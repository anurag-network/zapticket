import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TicketStatus, Priority, TicketType } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 'Unable to login to my account' })
  subject: string;

  @ApiProperty({ example: 'I have been trying to login but keep getting an error message.' })
  description: string;

  @ApiPropertyOptional({ enum: TicketType, default: TicketType.QUESTION })
  type?: TicketType;

  @ApiPropertyOptional({ enum: TicketStatus, default: TicketStatus.OPEN })
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NORMAL })
  priority?: Priority;

  @ApiPropertyOptional({ example: 'user-id' })
  assigneeId?: string;

  @ApiPropertyOptional({ example: ['urgent', 'customer-xyz'], type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ example: 'channel-id' })
  channelId?: string;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  dueAt?: Date;

  @ApiPropertyOptional({ example: true })
  isMerged?: boolean;
}

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TicketType })
  type: TicketType;

  @ApiProperty({ enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiPropertyOptional()
  dueAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional()
  closedAt?: Date;

  @ApiProperty()
  organizationId: string;

  @ApiPropertyOptional()
  assigneeId?: string;

  @ApiProperty()
  creatorId: string;
}

export class CreateMessageDto {
  @ApiProperty({ example: 'Thank you for your patience. I have reset your password.' })
  content: string;

  @ApiPropertyOptional({ enum: ['NOTE', 'REPLY'], default: 'REPLY' })
  type?: 'NOTE' | 'REPLY';
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  ticketId: string;
}
