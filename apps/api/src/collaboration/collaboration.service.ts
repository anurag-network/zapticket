import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CollaboratorInfo {
  userId: string;
  userName: string | null;
  userEmail: string;
  joinedAt: Date;
  lastActiveAt: Date;
  isEditing: boolean;
  cursorPosition?: { line: number; column: number };
}

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private activeCollaborators: Map<string, Set<string>> = new Map();
  private editLocks: Map<string, string> = new Map();

  constructor(private prisma: PrismaService) {}

  async joinTicket(ticketId: string, userId: string): Promise<CollaboratorInfo[]> {
    const existing = await this.prisma.ticketCollaborator.findUnique({
      where: { ticketId_userId: { ticketId, userId } },
    });

    if (existing) {
      await this.prisma.ticketCollaborator.update({
        where: { id: existing.id },
        data: { lastActiveAt: new Date() },
      });
    } else {
      await this.prisma.ticketCollaborator.create({
        data: {
          ticketId,
          userId,
          joinedAt: new Date(),
          lastActiveAt: new Date(),
        },
      });
    }

    if (!this.activeCollaborators.has(ticketId)) {
      this.activeCollaborators.set(ticketId, new Set());
    }
    this.activeCollaborators.get(ticketId)!.add(userId);

    return this.getActiveCollaborators(ticketId);
  }

  async leaveTicket(ticketId: string, userId: string): Promise<void> {
    await this.prisma.ticketCollaborator.deleteMany({
      where: { ticketId, userId },
    });

    if (this.editLocks.get(ticketId) === userId) {
      this.editLocks.delete(ticketId);
    }

    const collaborators = this.activeCollaborators.get(ticketId);
    if (collaborators) {
      collaborators.delete(userId);
      if (collaborators.size === 0) {
        this.activeCollaborators.delete(ticketId);
      }
    }
  }

  async startEditing(ticketId: string, userId: string): Promise<{ success: boolean; lockedBy?: CollaboratorInfo }> {
    const currentLock = this.editLocks.get(ticketId);

    if (currentLock && currentLock !== userId) {
      const lockedBy = await this.getCollaboratorInfo(ticketId, currentLock);
      return { success: false, lockedBy };
    }

    this.editLocks.set(ticketId, userId);

    await this.prisma.ticketCollaborator.updateMany({
      where: { ticketId, userId },
      data: { isEditing: true },
    });

    return { success: true };
  }

  async stopEditing(ticketId: string, userId: string): Promise<void> {
    if (this.editLocks.get(ticketId) === userId) {
      this.editLocks.delete(ticketId);
    }

    await this.prisma.ticketCollaborator.updateMany({
      where: { ticketId, userId },
      data: { isEditing: false },
    });
  }

  async updateCursorPosition(
    ticketId: string,
    userId: string,
    position: { line: number; column: number }
  ): Promise<void> {
    await this.prisma.ticketCollaborator.updateMany({
      where: { ticketId, userId },
      data: {
        cursorPosition: position,
        lastActiveAt: new Date(),
      },
    });
  }

  async heartbeat(ticketId: string, userId: string): Promise<void> {
    await this.prisma.ticketCollaborator.updateMany({
      where: { ticketId, userId },
      data: { lastActiveAt: new Date() },
    });
  }

  async getActiveCollaborators(ticketId: string): Promise<CollaboratorInfo[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const collaborators = await this.prisma.ticketCollaborator.findMany({
      where: {
        ticketId,
        lastActiveAt: { gte: fiveMinutesAgo },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return collaborators.map((c) => ({
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      joinedAt: c.joinedAt,
      lastActiveAt: c.lastActiveAt,
      isEditing: c.isEditing,
      cursorPosition: c.cursorPosition as any,
    }));
  }

  private async getCollaboratorInfo(ticketId: string, userId: string): Promise<CollaboratorInfo> {
    const collaborator = await this.prisma.ticketCollaborator.findUnique({
      where: { ticketId_userId: { ticketId, userId } },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      userId: collaborator!.userId,
      userName: collaborator!.user.name,
      userEmail: collaborator!.user.email,
      joinedAt: collaborator!.joinedAt,
      lastActiveAt: collaborator!.lastActiveAt,
      isEditing: collaborator!.isEditing,
      cursorPosition: collaborator!.cursorPosition as any,
    };
  }

  async cleanupInactiveCollaborators(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const inactive = await this.prisma.ticketCollaborator.findMany({
      where: {
        lastActiveAt: { lt: fiveMinutesAgo },
      },
    });

    for (const collab of inactive) {
      if (this.editLocks.get(collab.ticketId) === collab.userId) {
        this.editLocks.delete(collab.ticketId);
      }

      const collaborators = this.activeCollaborators.get(collab.ticketId);
      if (collaborators) {
        collaborators.delete(collab.userId);
      }
    }

    await this.prisma.ticketCollaborator.deleteMany({
      where: {
        lastActiveAt: { lt: fiveMinutesAgo },
      },
    });

    this.logger.log(`Cleaned up ${inactive.length} inactive collaborators`);
  }

  isUserEditing(ticketId: string, userId: string): boolean {
    return this.editLocks.get(ticketId) === userId;
  }

  getEditLockOwner(ticketId: string): string | undefined {
    return this.editLocks.get(ticketId);
  }
}
