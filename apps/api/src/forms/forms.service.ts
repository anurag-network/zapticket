import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.form.findMany({
      where: { organizationId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id, organizationId },
      include: {
        submissions: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { ticket: { select: { id: true, subject: true, status: true } } },
        },
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async findBySlug(slug: string) {
    return this.prisma.form.findFirst({
      where: { slug, active: true },
    });
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    fields: FormField[];
  }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + nanoid(6);

    return this.prisma.form.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        fields: data.fields as any,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    description?: string;
    fields?: FormField[];
    active?: boolean;
  }) {
    const form = await this.prisma.form.findFirst({
      where: { id, organizationId },
    });
    if (!form) throw new NotFoundException('Form not found');

    return this.prisma.form.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        fields: data.fields as any,
        active: data.active,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id, organizationId },
    });
    if (!form) throw new NotFoundException('Form not found');

    await this.prisma.form.delete({ where: { id } });
    return { success: true };
  }

  async submit(slug: string, data: Record<string, any>) {
    const form = await this.findBySlug(slug);
    if (!form) throw new NotFoundException('Form not found');

    const fields = form.fields as FormField[];
    const subject = this.extractSubject(fields, data);
    const description = this.formatDescription(fields, data);

    const ticket = await this.prisma.ticket.create({
      data: {
        subject,
        description,
        organizationId: form.organizationId,
        creatorId: '',
        channelId: '',
      },
    });

    const submission = await this.prisma.formSubmission.create({
      data: {
        data: data as any,
        formId: form.id,
        ticketId: ticket.id,
      },
    });

    return { submission, ticket };
  }

  private extractSubject(fields: FormField[], data: Record<string, any>): string {
    const subjectField = fields.find((f) => f.name === 'subject' || f.name === 'title');
    if (subjectField && data[subjectField.name]) {
      return String(data[subjectField.name]).slice(0, 200);
    }
    return 'New Form Submission';
  }

  private formatDescription(fields: FormField[], data: Record<string, any>): string {
    const lines = fields.map((field) => {
      const value = data[field.name];
      if (value === undefined || value === '') return null;
      
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
      return `**${field.label}**: ${displayValue}`;
    }).filter(Boolean);

    return lines.join('\n\n');
  }

  async getSubmissions(formId: string, organizationId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, organizationId },
    });
    if (!form) throw new NotFoundException('Form not found');

    return this.prisma.formSubmission.findMany({
      where: { formId },
      include: { ticket: { select: { id: true, subject: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
