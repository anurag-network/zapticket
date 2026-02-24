import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DashboardService } from '../dashboard/dashboard.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private organizationRooms = new Map<string, Set<string>>();

  constructor(private dashboardService: DashboardService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    
    setInterval(() => {
      this.broadcastMetrics();
    }, 30000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    for (const [orgId, clients] of this.organizationRooms.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.organizationRooms.delete(orgId);
        }
      }
    }
  }

  @SubscribeMessage('join:organization')
  handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string },
  ) {
    const { organizationId } = data;
    
    client.join(`org:${organizationId}`);
    
    if (!this.organizationRooms.has(organizationId)) {
      this.organizationRooms.set(organizationId, new Set());
    }
    this.organizationRooms.get(organizationId)!.add(client.id);

    this.logger.log(`Client ${client.id} joined organization ${organizationId}`);
    
    this.sendMetricsToClient(client, organizationId);

    return { success: true };
  }

  @SubscribeMessage('leave:organization')
  handleLeaveOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string },
  ) {
    const { organizationId } = data;
    client.leave(`org:${organizationId}`);
    
    const clients = this.organizationRooms.get(organizationId);
    if (clients) {
      clients.delete(client.id);
    }

    return { success: true };
  }

  @SubscribeMessage('request:metrics')
  async handleRequestMetrics(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string },
  ) {
    return this.sendMetricsToClient(client, data.organizationId);
  }

  @SubscribeMessage('subscribe:ticket')
  handleSubscribeTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.join(`ticket:${data.ticketId}`);
    return { success: true };
  }

  @SubscribeMessage('unsubscribe:ticket')
  handleUnsubscribeTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string },
  ) {
    client.leave(`ticket:${data.ticketId}`);
    return { success: true };
  }

  private async sendMetricsToClient(client: Socket, organizationId: string) {
    try {
      const metrics = await this.dashboardService.getMetrics(organizationId);
      client.emit('metrics:update', metrics);
    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`);
    }
  }

  async broadcastMetrics() {
    for (const [organizationId] of this.organizationRooms) {
      try {
        const metrics = await this.dashboardService.getMetrics(organizationId);
        this.server.to(`org:${organizationId}`).emit('metrics:update', metrics);
      } catch (error) {
        this.logger.error(`Failed to broadcast metrics for ${organizationId}: ${error.message}`);
      }
    }
  }

  broadcastTicketUpdate(organizationId: string, ticket: any) {
    this.server.to(`org:${organizationId}`).emit('ticket:update', ticket);
    this.server.to(`ticket:${ticket.id}`).emit('ticket:update', ticket);
  }

  broadcastNewTicket(organizationId: string, ticket: any) {
    this.server.to(`org:${organizationId}`).emit('ticket:new', ticket);
  }

  broadcastTicketResolved(organizationId: string, ticket: any) {
    this.server.to(`org:${organizationId}`).emit('ticket:resolved', ticket);
  }

  broadcastAgentStatus(organizationId: string, agentStatus: any) {
    this.server.to(`org:${organizationId}`).emit('agent:status', agentStatus);
  }

  broadcastNewMessage(ticketId: string, message: any) {
    this.server.to(`ticket:${ticketId}`).emit('message:new', message);
  }

  broadcastSLAAlert(organizationId: string, alert: any) {
    this.server.to(`org:${organizationId}`).emit('sla:alert', alert);
  }

  getConnectedClients(organizationId: string): number {
    return this.organizationRooms.get(organizationId)?.size || 0;
  }
}
