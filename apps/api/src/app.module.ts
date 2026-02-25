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
import { escalationModule } from './escalation/escalation.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { TicketLockModule } from './ticket-lock/ticket-lock.module';
import { AssignmentModule } from './assignment/assignment.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SentimentModule } from './sentiment/sentiment.module';
import { SmartResponsesModule } from './smart-responses/smart-responses.module';
import { CustomerHealthModule } from './customer-health/customer-health.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { VisualWorkflowModule } from './visual-workflow/visual-workflow.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { CannedResponsesModule } from './canned-responses/canned-responses.module';
import { TicketMergeModule } from './ticket-merge/ticket-merge.module';
import { BulkOperationsModule } from './bulk-operations/bulk-operations.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { CSATModule } from './csat/csat.module';
import { AgentAvailabilityModule } from './agent-availability/agent-availability.module';
import { NotificationModule } from './notifications/notification.module';
import { SLAModule } from './sla/sla.module';
import { MentionsModule } from './mentions/mentions.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';
import { TicketViewsModule } from './ticket-views/ticket-views.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { DataImportModule } from './data-import/data-import.module';
import { LiveChatModule } from './live-chat/live-chat.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { SSOModule } from './sso/sso.module';
import { PrismaModule } from './prisma/prisma.module';
import { AIModule } from './ai/ai.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ChannelsModule } from './channels/channels.module';
import { ForumModule } from './forum/forum.module';
import { StatusPageModule } from './status-page/status-page.module';
import { AuditModule } from './audit/audit.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MacrosModule } from './macros/macros.module';
import { SlaPoliciesModule } from './sla-policies/sla-policies.module';
import { DataExportModule } from './data-export/data-export.module';
import { DraftsModule } from './drafts/drafts.module';
import { AssignmentRulesModule } from './assignment-rules/assignment-rules.module';
import { ScheduledReportsModule } from './scheduled-reports/scheduled-reports.module';
import { RetentionPoliciesModule } from './retention-policies/retention-policies.module';
import { WebhookSubscriptionsModule } from './webhook-subscriptions/webhook-subscriptions.module';
import { IPWhitelistModule } from './ip-whitelist/ip-whitelist.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { EmailToTicketModule } from './email-to-ticket/email-to-ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ActivityLogModule,
    NotificationModule,
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
    CannedResponsesModule,
    TicketMergeModule,
    BulkOperationsModule,
    CustomerPortalModule,
    CSATModule,
    AgentAvailabilityModule,
    SLAModule,
    MentionsModule,
    FollowUpsModule,
    TicketViewsModule,
    CustomFieldsModule,
    DataImportModule,
    LiveChatModule,
    TimeTrackingModule,
    SSOModule,
    AIModule,
    CustomersModule,
    DashboardModule,
    WebsocketModule,
    ChannelsModule,
    ForumModule,
    StatusPageModule,
    AuditModule,
    PermissionsModule,
    MacrosModule,
    SlaPoliciesModule,
    DataExportModule,
    DraftsModule,
    AssignmentRulesModule,
    ScheduledReportsModule,
    RetentionPoliciesModule,
    WebhookSubscriptionsModule,
    IPWhitelistModule,
    TwoFactorModule,
    EmailToTicketModule,
  ],
})
export class AppModule {}
