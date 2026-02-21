import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomerPortalService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(
    organizationId: string,
    email: string,
    name: string,
    password: string,
    phone?: string
  ) {
    const existingUser = await this.prisma.customerPortalUser.findUnique({
      where: {
        email_organizationId: { email, organizationId },
      },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.customerPortalUser.create({
      data: {
        email,
        name,
        passwordHash,
        phone,
        organizationId,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      type: 'customer',
      organizationId,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async login(organizationId: string, email: string, password: string) {
    const user = await this.prisma.customerPortalUser.findUnique({
      where: {
        email_organizationId: { email, organizationId },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.customerPortalUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      type: 'customer',
      organizationId,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  }

  async getProfile(userId: string) {
    return this.prisma.customerPortalUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    return this.prisma.customerPortalUser.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });
  }

  async getTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { customerPortalUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async getTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, customerPortalUserId: userId },
      include: {
        assignee: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async createTicket(
    userId: string,
    organizationId: string,
    subject: string,
    description: string,
    type?: string
  ) {
    const user = await this.prisma.customerPortalUser.findUnique({
      where: { id: userId },
    });

    return this.prisma.ticket.create({
      data: {
        subject,
        description,
        type: (type as any) || 'QUESTION',
        organizationId,
        customerPortalUserId: userId,
        creatorId: userId,
      },
    });
  }

  async addReply(userId: string, ticketId: string, content: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, customerPortalUserId: userId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const message = await this.prisma.message.create({
      data: {
        ticketId,
        authorId: userId,
        content,
        type: 'REPLY',
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'WAITING_ON_CUSTOMER',
        updatedAt: new Date(),
      },
    });

    return message;
  }
}
