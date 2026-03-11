import api from './client';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  type: 'BUG' | 'FEATURE' | 'QUESTION' | 'INCIDENT' | 'TASK' | 'FEEDBACK' | 'OTHER';
  assigneeId?: string;
  customerId: string;
  organizationId: string;
  channelId?: string;
  tags: string[];
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignee?: User;
  customer?: CustomerProfile;
  messages?: Message[];
}

export interface Message {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorType: 'USER' | 'CUSTOMER';
  isInternal: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'AGENT' | 'MEMBER';
}

export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  organizationId: string;
}

export interface DashboardMetrics {
  tickets: {
    open: number;
    pending: number;
    resolved: number;
    closed: number;
    total: number;
    today: number;
  };
  responseTime: {
    avgFirstResponse: number;
    avgResolution: number;
  };
  agents: {
    online: number;
    away: number;
    busy: number;
    offline: number;
    total: number;
  };
  satisfaction: {
    avgScore: number;
    totalResponses: number;
    trend: 'up' | 'down' | 'stable';
  };
  sla: {
    atRisk: number;
    breached: number;
    complianceRate: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigneeId?: string;
  customerId?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ticketsApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<Ticket>> => {
    const response = await api.instance.get('/tickets', { params });
    return response.data;
  },

  get: async (id: string): Promise<Ticket> => {
    const response = await api.instance.get(`/tickets/${id}`);
    return response.data;
  },

  create: async (data: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.instance.post('/tickets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
    const response = await api.instance.patch(`/tickets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.instance.delete(`/tickets/${id}`);
  },

  assign: async (id: string, assigneeId: string): Promise<Ticket> => {
    const response = await api.instance.post(`/tickets/${id}/assign`, { assigneeId });
    return response.data;
  },

  addMessage: async (id: string, content: string, isInternal: boolean = false): Promise<Message> => {
    const response = await api.instance.post(`/tickets/${id}/messages`, { content, isInternal });
    return response.data;
  },

  getMessages: async (id: string): Promise<Message[]> => {
    const response = await api.instance.get(`/tickets/${id}/messages`);
    return response.data;
  },
};

export const usersApi = {
  list: async (): Promise<User[]> => {
    const response = await api.instance.get('/users');
    return response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await api.instance.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.instance.patch(`/users/${id}`, data);
    return response.data;
  },
};

export const customersApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<CustomerProfile>> => {
    const response = await api.instance.get('/customers', { params });
    return response.data;
  },

  get: async (id: string): Promise<CustomerProfile> => {
    const response = await api.instance.get(`/customers/${id}`);
    return response.data;
  },

  get360: async (id: string): Promise<any> => {
    const response = await api.instance.get(`/customers/${id}/360`);
    return response.data;
  },
};

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.instance.get('/dashboard/metrics');
    return response.data;
  },

  getTrends: async (days: number = 30): Promise<any[]> => {
    const response = await api.instance.get('/dashboard/trends', { params: { days } });
    return response.data;
  },
};

export const knowledgeBaseApi = {
  listArticles: async (categoryId?: string): Promise<any[]> => {
    const response = await api.instance.get('/knowledge-base/articles', { params: { categoryId } });
    return response.data;
  },

  search: async (query: string): Promise<any[]> => {
    const response = await api.instance.get('/knowledge-base/search', { params: { q: query } });
    return response.data;
  },
};
