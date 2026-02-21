import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TeamsModule } from './teams/teams.module';
import { EmailModule } from './email/email.module';
import { FormsModule } from './forms/forms.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ReportingModule } from './reporting/reporting.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    OrganizationsModule,
    TeamsModule,
    EmailModule,
    FormsModule,
    KnowledgeBaseModule,
    WorkflowsModule,
    IntegrationsModule,
    ReportingModule,
    ScheduledTasksModule,
  ],
})
export class AppModule {}
