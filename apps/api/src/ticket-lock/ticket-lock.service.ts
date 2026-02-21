import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketLockService {
  constructor(private prisma: PrismaService) {}

  private readonly LOCK_DURATION_MS = 5 * 60 * 1000;

  async acquireLock(ticketId: string, userId: string): Promise<{ locked: boolean; lockedBy?: { id: string; name: string | null; email: string }; expiresAt?: Date }> {
    await this.cleanupExpiredLocks();

    const existingLock = await this.prisma.ticketLock.findUnique({
      where: { ticketId },
      include: { lockedBy: { select: { id: true, name: true, email: true } } },
    });

    if (existingLock) {
      if (existingLock.lockedById === userId) {
        return this.refreshLock(existingLock.id, userId);
      }
      if (existingLock.expiresAt > new Date()) {
        return {
          locked: false,
          lockedBy: existingLock.lockedBy,
          expiresAt: existingLock.expiresAt,
        };
      }
      await this.prisma.ticketLock.delete({ where: { id: existingLock.id } });
    }

    const expiresAt = new Date(Date.now() + this.LOCK_DURATION_MS);
    await this.prisma.ticketLock.create({
      data: {
        ticketId,
        lockedById: userId,
        expiresAt,
      },
    });

    return { locked: true, expiresAt };
  }

  private async refreshLock(lockId: string, userId: string): Promise<{ locked: boolean; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + this.LOCK_DURATION_MS);
    await this.prisma.ticketLock.update({
      where: { id: lockId },
      data: { expiresAt },
    });
    return { locked: true, expiresAt };
  }

  async releaseLock(ticketId: string, userId: string): Promise<void> {
    const lock = await this.prisma.ticketLock.findUnique({
      where: { ticketId },
    });

    if (!lock) return;

    if (lock.lockedById !== userId) {
      throw new ForbiddenException('You can only release your own locks');
    }

    await this.prisma.ticketLock.delete({ where: { id: lock.id } });
  }

  async getLockStatus(ticketId: string): Promise<{ locked: boolean; lockedBy?: { id: string; name: string | null; email: string }; expiresAt?: Date }> {
    await this.cleanupExpiredLocks();

    const lock = await this.prisma.ticketLock.findUnique({
      where: { ticketId },
      include: { lockedBy: { select: { id: true, name: true, email: true } } },
    });

    if (!lock) {
      return { locked: false };
    }

    if (lock.expiresAt <= new Date()) {
      await this.prisma.ticketLock.delete({ where: { id: lock.id } });
      return { locked: false };
    }

    return {
      locked: true,
      lockedBy: lock.lockedBy,
      expiresAt: lock.expiresAt,
    };
  }

  async forceReleaseLock(ticketId: string, userId: string): Promise<void> {
    const lock = await this.prisma.ticketLock.findUnique({
      where: { ticketId },
    });

    if (!lock) return;

    await this.prisma.ticketLock.delete({ where: { id: lock.id } });
  }

  private async cleanupExpiredLocks(): Promise<void> {
    await this.prisma.ticketLock.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
  }

  async bulkAcquireLocks(ticketIds: string[], userId: string): Promise<{ acquired: string[]; failed: { ticketId: string; lockedBy: { id: string; name: string | null; email: string } }[] }> {
    const acquired: string[] = [];
    const failed: { ticketId: string; lockedBy: { id: string; name: string | null; email: string } }[] = [];

    for (const ticketId of ticketIds) {
      const result = await this.acquireLock(ticketId, userId);
      if (result.locked) {
        acquired.push(ticketId);
      } else if (result.lockedBy) {
        failed.push({
          ticketId,
          lockedBy: result.lockedBy,
        });
      }
    }

    return { acquired, failed };
  }
}
