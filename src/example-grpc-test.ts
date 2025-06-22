import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { analyzeColors } from './color-analyzer.grpc-client';
import { applyFilterStream } from './image-filter.grpc-client';

async function main(): Promise<void> {
  // Caminho da imagem de teste
  const imagePath: string = join(__dirname, '../test-image.jpg');
  const imageBuffer: Buffer = readFileSync(imagePath);

  // Exemplo: Analisar cores dominantes
  try {
    console.log('Analisando cores...');
    const colors: string[] = await analyzeColors(imageBuffer);
    console.log('Cores dominantes:', colors);
  } catch (err) {
    console.error('Erro ao analisar cores:', err);
  }

  // Exemplo: Aplicar filtro (filterType = 1)
  try {
    console.log('Aplicando filtro...');
    const filteredBuffer: Buffer = await applyFilterStream(
      'test-image',
      1,
      imageBuffer,
    );
    const outputPath: string = join(__dirname, '../test-image-filtered.jpg');
    writeFileSync(outputPath, filteredBuffer);
    console.log('Imagem filtrada salva em:', outputPath);
  } catch (err) {
    console.error('Erro ao aplicar filtro:', err);
  }
}

void main();
