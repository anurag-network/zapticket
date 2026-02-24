import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Permission {
  resource: string;
  actions: string[];
}

interface Role {
  name: string;
  permissions: Permission[];
}

const DEFAULT_ROLES: Role[] = [
  {
    name: 'OWNER',
    permissions: [
      { resource: '*', actions: ['*'] },
    ],
  },
  {
    name: 'ADMIN',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read', 'update', 'delete', 'assign'] },
      { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'settings', actions: ['read', 'update'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'integrations', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'knowledge-base', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'chatbot', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'workflows', actions: ['create', 'read', 'update', 'delete'] },
    ],
  },
  {
    name: 'AGENT',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read', 'update', 'assign'] },
      { resource: 'users', actions: ['read'] },
      { resource: 'teams', actions: ['read'] },
      { resource: 'reports', actions: ['read'] },
      { resource: 'knowledge-base', actions: ['read'] },
    ],
  },
  {
    name: 'MEMBER',
    permissions: [
      { resource: 'tickets', actions: ['create', 'read'] },
      { resource: 'knowledge-base', actions: ['read'] },
    ],
  },
];

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private roleCache = new Map<string, Role[]>();

  constructor(private prisma: PrismaService) {}

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organizationId) return false;

    const role = await this.getUserRole(user.organizationId, user.role);
    return this.hasPermission(role, resource, action);
  }

  async enforcePermission(userId: string, resource: string, action: string): Promise<void> {
    const hasPermission = await this.checkPermission(userId, resource, action);
    if (!hasPermission) {
      throw new ForbiddenException(`You don't have permission to ${action} ${resource}`);
    }
  }

  private hasPermission(role: Role, resource: string, action: string): boolean {
    for (const perm of role.permissions) {
      if (perm.resource === '*' && perm.actions.includes('*')) return true;
      if (perm.resource === resource && (perm.actions.includes('*') || perm.actions.includes(action))) {
        return true;
      }
    }
    return false;
  }

  private async getUserRole(organizationId: string, baseRole: string): Promise<Role> {
    const customRoles = await this.getCustomRoles(organizationId);
    const allRoles = [...DEFAULT_ROLES, ...customRoles];
    
    return allRoles.find(r => r.name === baseRole) || DEFAULT_ROLES[3];
  }

  async getCustomRoles(organizationId: string): Promise<Role[]> {
    if (this.roleCache.has(organizationId)) {
      return this.roleCache.get(organizationId)!;
    }

    try {
      const roles = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "CustomRole" WHERE "organizationId" = ${organizationId}
      `;

      const customRoles = roles.map(r => ({
        name: r.name,
        permissions: r.permissions as Permission[],
      }));

      this.roleCache.set(organizationId, customRoles);
      return customRoles;
    } catch (error) {
      return [];
    }
  }

  async createCustomRole(organizationId: string, data: {
    name: string;
    description?: string;
    permissions: Permission[];
  }): Promise<any> {
    try {
      return await this.prisma.$executeRaw`
        INSERT INTO "CustomRole" (id, name, description, permissions, "organizationId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${data.name}, ${data.description}, ${JSON.stringify(data.permissions)}, ${organizationId}, NOW(), NOW())
      `;
    } catch (error) {
      this.logger.error(`Failed to create custom role: ${error.message}`);
      throw error;
    }
  }

  async updateCustomRole(organizationId: string, roleId: string, data: {
    name?: string;
    description?: string;
    permissions?: Permission[];
  }): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.permissions) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(data.permissions));
    }

    if (updates.length === 0) return;

    values.push(roleId, organizationId);

    try {
      await this.prisma.$executeRaw`
        UPDATE "CustomRole" 
        SET name = ${data.name}, description = ${data.description}, permissions = ${JSON.stringify(data.permissions)}
        WHERE id = ${roleId} AND "organizationId" = ${organizationId}
      `;
      
      this.roleCache.delete(organizationId);
    } catch (error) {
      this.logger.error(`Failed to update custom role: ${error.message}`);
      throw error;
    }
  }

  async deleteCustomRole(organizationId: string, roleId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        DELETE FROM "CustomRole" WHERE id = ${roleId} AND "organizationId" = ${organizationId}
      `;
      
      this.roleCache.delete(organizationId);
    } catch (error) {
      this.logger.error(`Failed to delete custom role: ${error.message}`);
      throw error;
    }
  }

  async getAllRoles(organizationId: string): Promise<Role[]> {
    const customRoles = await this.getCustomRoles(organizationId);
    return [...DEFAULT_ROLES, ...customRoles];
  }

  canAccessField(userId: string, field: string, entity: string): boolean {
    return true;
  }

  canAccessTicket(userId: string, ticketId: string, action: string): Promise<boolean> {
    return this.checkPermission(userId, 'tickets', action);
  }

  canAccessCustomer(userId: string, customerId: string, action: string): Promise<boolean> {
    return this.checkPermission(userId, 'customers', action);
  }
}
