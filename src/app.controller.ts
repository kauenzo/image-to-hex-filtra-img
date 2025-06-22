/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { randomUUID } from 'crypto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint para analisar as cores dominantes de uma imagem
   * Exemplo: POST /analyze-colors (multipart/form-data: file)
   */
  @Post('analyze-colors')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeColors(@UploadedFile() file: { buffer: Buffer }) {
    if (!file) throw new BadRequestException('Arquivo de imagem é obrigatório');

    // mock para teste
    // return {
    //   colors: [
    //     '#FF6B6B',
    //     '#4ECDC4',
    //     '#45B7D1',
    //     '#96CEB4',
    //     '#FFEAA7',
    //     '#DDA0DD',
    //     '#98D8C8',
    //     '#F7DC6F',
    //     '#BB8FCE',
    //     '#85C1E9',
    //     '#F8C471',
    //     '#82E0AA',
    //     '#F1948A',
    //     '#85C1E9',
    //     '#F4D03F',
    //     '#A9DFBF',
    //     '#D7BDE2',
    //     '#AED6F1',
    //   ],
    // };
    const colors = await this.appService.analyzeImageColors(file.buffer);
    return { colors };
  }

  /**
   * Endpoint para aplicar filtro em uma imagem
   * Exemplo: POST /apply-filter (multipart/form-data: file, body: filterType)
   */
  @Post('apply-filter')
  @UseInterceptors(FileInterceptor('file'))
  async applyFilter(
    @UploadedFile() file: { buffer: Buffer },
    @Body('filterType') filterType: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo de imagem é obrigatório');
    if (!filterType) throw new BadRequestException('filterType é obrigatório');
    try {
      await this.appService.analyzeImageColors(file.buffer); // Só valida
    } catch (e) {
      throw new BadRequestException(e.message);
    }
    const imageId = randomUUID();
    const filteredBuffer = await this.appService.applyImageFilter(
      imageId,
      parseInt(filterType, 10),
      file.buffer,
    );
    return {
      imageId,
      filtered: filteredBuffer.toString('base64'),
    };
  }
}
