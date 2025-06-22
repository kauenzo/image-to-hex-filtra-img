/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import sharp from 'sharp';

function safeSharp(buffer: Buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Arquivo de imagem inválido.');
  }

  return sharp(buffer);
}

export class ImageUtils {
  static async validateAndCompressImage(imageBuffer: Buffer): Promise<Buffer> {
    let metadata: unknown;
    try {
      metadata = await safeSharp(imageBuffer).metadata();
    } catch {
      throw new Error('Arquivo de imagem inválido ou corrompido.');
    }
    // Checagem manual do campo format

    const format =
      metadata && typeof metadata === 'object' && 'format' in metadata
        ? (metadata as { format?: string }).format
        : undefined;
    if (!format || (format !== 'jpeg' && format !== 'png')) {
      throw new Error(
        'Formato de imagem não suportado. Apenas PNG e JPEG são permitidos.',
      );
    }
    // Se a imagem for maior que 1MB, comprime
    if (imageBuffer.length > 1024 * 1024) {
      try {
        let output: Buffer;
        if (format === 'jpeg') {
          output = (await safeSharp(imageBuffer)
            .jpeg({ quality: 80 })
            .toBuffer()) as Buffer;
        } else if (format === 'png') {
          output = (await safeSharp(imageBuffer)
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer()) as Buffer;
        } else {
          throw new Error('Formato de imagem não suportado.');
        }
        if (!Buffer.isBuffer(output)) {
          throw new Error('Erro ao comprimir a imagem.');
        }
        return output;
      } catch {
        throw new Error('Erro ao comprimir a imagem.');
      }
    }
    // Se não precisa comprimir, retorna o buffer original
    return imageBuffer;
  }
}
