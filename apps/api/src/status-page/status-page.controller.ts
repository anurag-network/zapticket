import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatusPageService } from './status-page.service';

@Controller()
export class StatusPageController {
  constructor(private statusPageService: StatusPageService) {}

  @Get('status/:slug')
  async getPublicStatusPage(@Param('slug') slug: string) {
    return this.statusPageService.getStatusPageBySlug(slug);
  }

  @Get('status/:slug/overall')
  async getOverallStatus(@Param('slug') slug: string) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { slug },
    });
    if (!statusPage) return { status: 'unknown' };
    const status = await this.statusPageService.getOverallStatus(statusPage.organizationId);
    return { status };
  }

  @Post('status/:slug/subscribe')
  async subscribe(
    @Param('slug') slug: string,
    @Body() body: { email: string },
  ) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { slug },
    });
    if (!statusPage) return { error: 'Status page not found' };
    return this.statusPageService.subscribe(statusPage.id, body.email);
  }

  @Post('status/verify')
  async verifySubscription(@Body('token') token: string) {
    return this.statusPageService.verifySubscription(token);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getMyStatusPage(@Request() req: any) {
    return this.statusPageService.getStatusPage(req.user.organizationId);
  }

  @Post('status')
  @UseGuards(JwtAuthGuard)
  async createStatusPage(
    @Request() req: any,
    @Body() body: {
      title: string;
      description?: string;
      logoUrl?: string;
      primaryColor?: string;
      domain?: string;
    },
  ) {
    return this.statusPageService.create(req.user.organizationId, body);
  }

  @Put('status')
  @UseGuards(JwtAuthGuard)
  async updateStatusPage(
    @Request() req: any,
    @Body() body: {
      title?: string;
      description?: string;
      logoUrl?: string;
      primaryColor?: string;
      domain?: string;
      isPublic?: boolean;
    },
  ) {
    return this.statusPageService.update(req.user.organizationId, body);
  }

  @Post('status/components')
  @UseGuards(JwtAuthGuard)
  async addComponent(
    @Request() req: any,
    @Body() body: { name: string; description?: string; category?: string },
  ) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { organizationId: req.user.organizationId },
    });
    if (!statusPage) return { error: 'Status page not found' };
    return this.statusPageService.addComponent(statusPage.id, body);
  }

  @Put('status/components/:componentId')
  @UseGuards(JwtAuthGuard)
  async updateComponentStatus(
    @Param('componentId') componentId: string,
    @Body('status') status: string,
  ) {
    return this.statusPageService.updateComponentStatus(componentId, status);
  }

  @Post('status/incidents')
  @UseGuards(JwtAuthGuard)
  async createIncident(
    @Request() req: any,
    @Body() body: { title: string; description?: string; severity?: string },
  ) {
    const statusPage = await this.prisma.statusPage.findUnique({
      where: { organizationId: req.user.organizationId },
    });
    if (!statusPage) return { error: 'Status page not found' };
    return this.statusPageService.createIncident(statusPage.id, body);
  }

  @Post('status/incidents/:incidentId/updates')
  @UseGuards(JwtAuthGuard)
  async addIncidentUpdate(
    @Param('incidentId') incidentId: string,
    @Body() body: { content: string; status: string; componentId?: string },
  ) {
    return this.statusPageService.addIncidentUpdate(incidentId, body);
  }

  @Post('status/incidents/:incidentId/resolve')
  @UseGuards(JwtAuthGuard)
  async resolveIncident(@Param('incidentId') incidentId: string) {
    return this.statusPageService.resolveIncident(incidentId);
  }
}
