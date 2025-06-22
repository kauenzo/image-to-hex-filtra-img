import { Injectable } from '@nestjs/common';
import { analyzeColors } from './color-analyzer.grpc-client';
import { applyFilterStream } from './image-filter.grpc-client';
import { ImageUtils } from './image-utils';

@Injectable()
export class AppService {
  /**
   * Analisa as cores dominantes de uma imagem
   * @param imageBuffer Buffer da imagem
   */
  async analyzeImageColors(imageBuffer: Buffer): Promise<string[]> {
    const checkedBuffer =
      await ImageUtils.validateAndCompressImage(imageBuffer);
    return analyzeColors(checkedBuffer);
  }

  /**
   * Aplica filtro na imagem usando streaming gRPC
   * @param imageId string identificador da imagem
   * @param filterType número do filtro
   * @param imageBuffer Buffer da imagem
   */
  async applyImageFilter(
    imageId: string,
    filterType: number,
    imageBuffer: Buffer,
  ): Promise<Buffer> {
    const checkedBuffer =
      await ImageUtils.validateAndCompressImage(imageBuffer);
    return applyFilterStream(imageId, filterType, checkedBuffer);
  }
}
