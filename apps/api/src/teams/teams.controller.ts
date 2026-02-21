import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private teams: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all teams' })
  findAll(@Req() req: any) {
    return this.teams.findAll(req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a team' })
  create(@Req() req: any, @Body() data: { name: string; description?: string }) {
    return this.teams.create(req.user.organizationId, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team details with members' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.teams.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: { name?: string; description?: string }
  ) {
    return this.teams.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.teams.delete(id, req.user.organizationId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get team members' })
  getMembers(@Param('id') id: string, @Req() req: any) {
    return this.teams.getTeamMembers(id, req.user.organizationId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to team' })
  addMember(@Param('id') id: string, @Body('userId') userId: string, @Req() req: any) {
    return this.teams.addMember(id, userId, req.user.organizationId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from team' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    return this.teams.removeMember(id, userId, req.user.organizationId);
  }
}
