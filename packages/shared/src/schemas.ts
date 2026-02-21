import { z } from 'zod';

export const TicketStatusValues = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'] as const;
export const PriorityValues = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const RoleValues = ['OWNER', 'ADMIN', 'AGENT', 'MEMBER'] as const;

export const ticketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(PriorityValues).default('NORMAL'),
  tags: z.array(z.string()).optional(),
});

export const messageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['NOTE', 'REPLY']).default('REPLY'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(TicketStatusValues).optional(),
  priority: z.enum(PriorityValues).optional(),
  assigneeId: z.string().nullable().optional(),
});

export type TicketInput = z.infer<typeof ticketSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
