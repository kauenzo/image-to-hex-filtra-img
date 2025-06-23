import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

const PROTO_PATH = join(__dirname, '../protos/Filter.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const filterProto = (
  grpc.loadPackageDefinition(packageDefinition) as unknown as {
    filters: {
      ImageFilterService: any;
    };
  }
).filters;

const IMAGE_FILTER_ADDRESS =
  process.env.IMAGE_FILTER_ADDRESS || 'localhost:5281';

export const imageFilterClient = new filterProto.ImageFilterService(
  IMAGE_FILTER_ADDRESS,
  grpc.credentials.createInsecure(),
);

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
    const call = imageFilterClient.ApplyFilterStream();

    const totalChunks = Math.ceil(imageBuffer.length / chunkSize);
    const receivedBuffers: Buffer[] = [];

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

    call.on('data', (chunk: ImageFilterChunk) => {
      if (chunk?.data instanceof Buffer) {
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
