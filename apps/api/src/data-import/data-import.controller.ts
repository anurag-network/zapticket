import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataImportService } from './data-import.service';

@Controller('data-imports')
@UseGuards(JwtAuthGuard)
export class DataImportController {
  constructor(private dataImportService: DataImportService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createImport(
    @Request() req: any,
    @Body() body: { source: string; fieldMapping?: string; options?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fieldMapping = body.fieldMapping ? JSON.parse(body.fieldMapping) : undefined;
    const options = body.options ? JSON.parse(body.options) : undefined;

    const dataImport = await this.dataImportService.createImport(
      req.user.organizationId,
      req.user.id,
      body.source,
      file.originalname,
      file.size,
      fieldMapping,
      options,
    );

    let data: any;
    try {
      const content = file.buffer.toString('utf-8');
      if (file.originalname.endsWith('.json')) {
        data = JSON.parse(content);
      } else if (file.originalname.endsWith('.csv')) {
        data = this.parseCSV(content);
      } else {
        data = JSON.parse(content);
      }
    } catch (err) {
      throw new BadRequestException('Failed to parse file: ' + err.message);
    }

    switch (body.source) {
      case 'ZENDESK':
        return this.dataImportService.processZendeskExport(dataImport.id, data);
      case 'ZAMMAD':
        return this.dataImportService.processZammadExport(dataImport.id, data);
      case 'CSV':
        return this.dataImportService.processCSVImport(
          dataImport.id,
          data,
          fieldMapping || this.getDefaultCSVMapping(),
        );
      case 'JSON':
        return this.dataImportService.processZendeskExport(dataImport.id, data);
      default:
        return this.dataImportService.processZendeskExport(dataImport.id, data);
    }
  }

  @Get()
  async getImports(@Request() req: any) {
    return this.dataImportService.getImports(req.user.organizationId);
  }

  @Get(':id')
  async getImport(@Param('id') importId: string) {
    return this.dataImportService.getImport(importId);
  }

  @Post(':id/cancel')
  async cancelImport(@Param('id') importId: string) {
    return this.dataImportService.cancelImport(importId);
  }

  @Delete(':id')
  async deleteImport(@Param('id') importId: string) {
    return this.dataImportService.deleteImport(importId);
  }

  parseCSV(content: string): any[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = this.parseCSVLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const record: Record<string, string> = {};

      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim() || '';
      });

      records.push(record);
    }

    return records;
  }

  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  getDefaultCSVMapping(): Record<string, string> {
    return {
      subject: 'subject',
      description: 'description',
      status: 'status',
      priority: 'priority',
      type: 'type',
      requesterEmail: 'requester_email',
      requesterName: 'requester_name',
      assigneeEmail: 'assignee_email',
      tags: 'tags',
    };
  }
}
