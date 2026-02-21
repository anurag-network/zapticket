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
import { EscalationModule } from './escalation/escalation.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { TicketLockModule } from './ticket-lock/ticket-lock.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SentimentModule } from './sentiment/sentiment.module';
import { SmartResponsesModule } from './smart-responses/smart-responses.module';
import { CustomerHealthModule } from './customer-health/customer-health.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { VisualWorkflowModule } from './visual-workflow/visual-workflow.module';
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
    EscalationModule,
    ScheduledTasksModule,
    TicketLockModule,
    AssignmentModule,
    ChatbotModule,
    SentimentModule,
    SmartResponsesModule,
    CustomerHealthModule,
    CollaborationModule,
    VisualWorkflowModule,
  ],
})
export class AppModule {}
