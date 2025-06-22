/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

// Caminho para o arquivo .proto
const PROTO_PATH = join(__dirname, '../protos/Filter.proto');

// Carregar definição do proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
// O cast abaixo é necessário pois o grpc.loadPackageDefinition retorna um tipo genérico
const filterProto = (
  grpc.loadPackageDefinition(packageDefinition) as unknown as {
    filters: {
      ImageFilterService: grpc.ServiceClientConstructor;
    };
  }
).filters;

// Endereço do serviço ImageFilterService (ajuste conforme necessário)
const IMAGE_FILTER_ADDRESS =
  process.env.IMAGE_FILTER_ADDRESS || 'localhost:50052';

// Criação do client gRPC
export const imageFilterClient = new filterProto.ImageFilterService(
  IMAGE_FILTER_ADDRESS,
  grpc.credentials.createInsecure(),
) as grpc.Client;

interface ImageFilterChunk {
  image_id: string;
  filter_type: number;
  data: Buffer;
  chunk_number: number;
  is_last: boolean;
}

/**
 * Função para aplicar filtro em uma imagem usando streaming bidirecional
 * @param imageId string identificador da imagem
 * @param filterType número do filtro
 * @param imageBuffer Buffer da imagem
 * @param chunkSize tamanho dos chunks em bytes
 * @returns Promise<Buffer> com a imagem processada
 */
export function applyFilterStream(
  imageId: string,
  filterType: number,
  imageBuffer: Buffer,
  chunkSize = 64 * 1024,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const call = (
      imageFilterClient as unknown as grpc.Client
    ).makeBidiStreamRequest(
      '/filters.ImageFilterService/ApplyFilterStream',
      (arg: any) => arg,
      (arg: any) => arg,
    );
    const totalChunks = Math.ceil(imageBuffer.length / chunkSize);
    const receivedBuffers: Buffer[] = [];

    // Envia os chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, imageBuffer.length);
      const chunk: ImageFilterChunk = {
        image_id: imageId,
        filter_type: filterType,
        data: imageBuffer.slice(start, end),
        chunk_number: i,
        is_last: i === totalChunks - 1,
      };
      call.write(chunk);
    }
    call.end();

    // Recebe os chunks processados
    call.on('data', (chunk: ImageFilterChunk) => {
      if (chunk && Buffer.isBuffer(chunk.data)) {
        receivedBuffers.push(chunk.data);
      }
    });
    call.on('end', () => {
      resolve(Buffer.concat(receivedBuffers));
    });
    call.on('error', (err: grpc.ServiceError) => {
      reject(err);
    });
  });
}
