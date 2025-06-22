/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

// Caminho para o arquivo .proto
const PROTO_PATH = join(__dirname, '../protos/analyzer.proto');

// Carregar definição do proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
// O cast abaixo é necessário pois o grpc.loadPackageDefinition retorna um tipo genérico
const analyzerProto = (
  grpc.loadPackageDefinition(packageDefinition) as unknown as {
    analyzer: {
      ColorAnalyzer: grpc.ServiceClientConstructor;
    };
  }
).analyzer;

// Endereço do serviço ColorAnalyzer (ajuste conforme necessário)
const COLOR_ANALYZER_ADDRESS =
  process.env.COLOR_ANALYZER_ADDRESS || 'localhost:5281';

// Criação do client gRPC
export const colorAnalyzerClient = new analyzerProto.ColorAnalyzer(
  COLOR_ANALYZER_ADDRESS,
  grpc.credentials.createInsecure(),
) as grpc.Client;

interface ColorPalette {
  colors: string[];
}

/**
 * Função para analisar as cores dominantes de uma imagem
 * @param imageBuffer Buffer da imagem
 * @returns Promise com array de cores
 */
export function analyzeColors(imageBuffer: Buffer): Promise<string[]> {
  return new Promise((resolve, reject) => {
    (colorAnalyzerClient as any).AnalyzeColors(
      { image_data: imageBuffer },
      (err: grpc.ServiceError | null, response: ColorPalette | undefined) => {
        if (err) return reject(err);
        if (!response || !Array.isArray(response.colors)) return resolve([]);
        // Garantir que o retorno é sempre string[]
        return resolve(Array.isArray(response.colors) ? response.colors : []);
      },
    );
  });
}
