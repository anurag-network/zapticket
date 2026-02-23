import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCustomFieldInput {
  name: string;
  key: string;
  type: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: Record<string, any>;
  validation?: Record<string, any>;
}

interface UpdateCustomFieldInput {
  name?: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  options?: Record<string, any>;
  validation?: Record<string, any>;
  position?: number;
  active?: boolean;
}

interface SetFieldValueInput {
  fieldId: string;
  ticketId: string;
  value: any;
}

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, input: CreateCustomFieldInput) {
    const existing = await this.prisma.customField.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: input.key,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Field with this key already exists');
    }

    const maxPosition = await this.prisma.customField.aggregate({
      where: { organizationId },
      _max: { position: true },
    });

    return this.prisma.customField.create({
      data: {
        name: input.name,
        key: input.key,
        type: input.type as any,
        required: input.required ?? false,
        description: input.description,
        placeholder: input.placeholder,
        defaultValue: input.defaultValue,
        options: input.options as any,
        validation: input.validation as any,
        position: (maxPosition._max.position ?? -1) + 1,
        organizationId,
      },
    });
  }

  async findByOrganization(organizationId: string, activeOnly: boolean = false) {
    const where: any = { organizationId };
    if (activeOnly) {
      where.active = true;
    }

    return this.prisma.customField.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  async findOne(fieldId: string) {
    return this.prisma.customField.findUnique({
      where: { id: fieldId },
    });
  }

  async update(fieldId: string, input: UpdateCustomFieldInput) {
    return this.prisma.customField.update({
      where: { id: fieldId },
      data: input,
    });
  }

  async delete(fieldId: string) {
    await this.prisma.customField.delete({
      where: { id: fieldId },
    });

    return { success: true };
  }

  async reorder(organizationId: string, fieldIds: string[]) {
    const updates = fieldIds.map((id, index) =>
      this.prisma.customField.update({
        where: { id },
        data: { position: index },
      }),
    );

    await Promise.all(updates);
    return { success: true };
  }

  async setFieldValue(input: SetFieldValueInput) {
    const field = await this.findOne(input.fieldId);
    if (!field) {
      throw new BadRequestException('Field not found');
    }

    const validatedValue = this.validateValue(field, input.value);

    return this.prisma.customFieldValue.upsert({
      where: {
        fieldId_ticketId: {
          fieldId: input.fieldId,
          ticketId: input.ticketId,
        },
      },
      update: { value: validatedValue as any },
      create: {
        fieldId: input.fieldId,
        ticketId: input.ticketId,
        value: validatedValue as any,
      },
    });
  }

  async setMultipleFieldValues(ticketId: string, values: Record<string, any>) {
    const results = [];
    for (const [fieldId, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        results.push(await this.setFieldValue({ fieldId, ticketId, value }));
      }
    }
    return results;
  }

  async getTicketFieldValues(ticketId: string) {
    return this.prisma.customFieldValue.findMany({
      where: { ticketId },
      include: {
        field: true,
      },
    });
  }

  async deleteTicketFieldValues(ticketId: string) {
    await this.prisma.customFieldValue.deleteMany({
      where: { ticketId },
    });
    return { success: true };
  }

  validateValue(field: any, value: any): any {
    if (field.required && (value === null || value === undefined || value === '')) {
      throw new BadRequestException(`${field.name} is required`);
    }

    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (field.type) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        if (typeof value !== 'string') {
          throw new BadRequestException(`${field.name} must be a string`);
        }
        if (field.validation?.minLength && value.length < field.validation.minLength) {
          throw new BadRequestException(`${field.name} must be at least ${field.validation.minLength} characters`);
        }
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
          throw new BadRequestException(`${field.name} must be at most ${field.validation.maxLength} characters`);
        }
        if (field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new BadRequestException(`${field.name} must be a valid email`);
        }
        if (field.type === 'URL' && !/^https?:\/\/.+/.test(value)) {
          throw new BadRequestException(`${field.name} must be a valid URL`);
        }
        break;

      case 'NUMBER':
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(`${field.name} must be a number`);
        }
        if (field.validation?.min !== undefined && num < field.validation.min) {
          throw new BadRequestException(`${field.name} must be at least ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          throw new BadRequestException(`${field.name} must be at most ${field.validation.max}`);
        }
        return num;

      case 'DATE':
      case 'DATETIME':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new BadRequestException(`${field.name} must be a valid date`);
        }
        return date.toISOString();

      case 'SELECT':
      case 'RADIO':
        if (field.options?.choices && !field.options.choices.includes(value)) {
          throw new BadRequestException(`Invalid option for ${field.name}`);
        }
        break;

      case 'MULTI_SELECT':
        if (!Array.isArray(value)) {
          throw new BadRequestException(`${field.name} must be an array`);
        }
        if (field.options?.choices) {
          const invalid = value.filter(v => !field.options.choices.includes(v));
          if (invalid.length > 0) {
            throw new BadRequestException(`Invalid options for ${field.name}: ${invalid.join(', ')}`);
          }
        }
        break;

      case 'CHECKBOX':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`${field.name} must be a boolean`);
        }
        break;

      case 'USER':
      case 'TEAM':
        if (typeof value !== 'string') {
          throw new BadRequestException(`${field.name} must be a valid ID`);
        }
        break;
    }

    return value;
  }

  getFieldDefinition(field: any) {
    return {
      id: field.id,
      name: field.name,
      key: field.key,
      type: field.type,
      required: field.required,
      description: field.description,
      placeholder: field.placeholder,
      defaultValue: field.defaultValue,
      options: field.options,
      validation: field.validation,
    };
  }
}
