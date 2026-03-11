import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface CallResult {
  callSid: string;
  status: string;
}

interface VoicemailTranscription {
  transcription: string;
  duration: number;
}

@Injectable()
export class TwilioPhoneService {
  private readonly logger = new Logger(TwilioPhoneService.name);
  private twilioClient: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized');
      } catch (error) {
        this.logger.warn('Twilio not available:', error.message);
      }
    }
  }

  async makeCall(options: {
    to: string;
    organizationId: string;
    ticketId?: string;
    agentId?: string;
  }): Promise<CallResult> {
    const twilioPhoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');
    
    if (!this.twilioClient || !twilioPhoneNumber) {
      throw new Error('Twilio not configured');
    }

    const call = await this.twilioClient.calls.create({
      url: `${this.configService.get('API_URL')}/phone/voice/connect`,
      to: options.to,
      from: twilioPhoneNumber,
      statusCallback: `${this.configService.get('API_URL')}/phone/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    await this.prisma.phoneCall.create({
      data: {
        callSid: call.sid,
        organizationId: options.organizationId,
        ticketId: options.ticketId,
        agentId: options.agentId,
        from: twilioPhoneNumber,
        to: options.to,
        status: call.status,
        direction: 'OUTBOUND',
      },
    });

    return {
      callSid: call.sid,
      status: call.status,
    };
  }

  async handleIncomingCall(data: {
    from: string;
    to: string;
    callSid: string;
  }): Promise<any> {
    const organization = await this.prisma.organization.findFirst({
      where: {
        phoneNumbers: {
          has: data.to,
        },
      },
    });

    if (!organization) {
      return this.twilioClient.markupResponse({
        say: 'Thank you for calling. We are unable to identify your organization. Goodbye.',
      }).toString();
    }

    await this.prisma.phoneCall.create({
      data: {
        callSid: data.callSid,
        organizationId: organization.id,
        from: data.from,
        to: data.to,
        status: 'INCOMING',
        direction: 'INBOUND',
      },
    });

    const ivrGreeting = `Thank you for calling ${organization.name}. Press 1 for sales, 2 for support, or 0 to speak with an agent.`;

    return this.twilioClient.markupResponse({
      gather: {
        numDigits: 1,
        action: `${this.configService.get('API_URL')}/phone/voice/handle-greeting`,
      },
      say: ivrGreeting,
    }).toString();
  }

  async handleIVRResponse(data: {
    digits: string;
    callSid: string;
    organizationId: string;
  }): Promise<any> {
    const call = await this.prisma.phoneCall.findFirst({
      where: { callSid: data.callSid },
    });

    if (!call) {
      return this.twilioClient.markupResponse({
        say: 'Invalid request. Goodbye.',
      }).toString();
    }

    switch (data.digits) {
      case '1':
        await this.prisma.phoneCall.update({
          where: { id: call.id },
          data: { ivrOption: 'SALES' },
        });
        return this.twilioClient.markupResponse({
          say: 'Connecting you to sales...',
          dial: {
            record: 'record-from-ringing-dual',
            callback: `${this.configService.get('API_URL')}/phone/voice/dial-status`,
          },
        }).toString();

      case '2':
        await this.prisma.phoneCall.update({
          where: { id: call.id },
          data: { ivrOption: 'SUPPORT' },
        });
        
        const availableAgent = await this.findAvailableAgent(data.organizationId);
        
        if (availableAgent) {
          return this.twilioClient.markupResponse({
            say: 'Connecting you to support...',
            dial: {
              record: 'record-from-ringing-dual',
              callback: `${this.configService.get('API_URL')}/phone/voice/dial-status`,
            },
          }).toString();
        } else {
          return this.twilioClient.markupResponse({
            say: 'All agents are currently busy. Please leave a message after the beep.',
            record: {
              action: `${this.configService.get('API_URL')}/phone/voice/voicemail`,
              maxLength: 60,
              transcribe: true,
            },
          }).toString();
        }

      case '0':
        await this.prisma.phoneCall.update({
          where: { id: call.id },
          data: { ivrOption: 'AGENT' },
        });
        
        const agent = await this.findAvailableAgent(data.organizationId);
        
        if (agent) {
          return this.twilioClient.markupResponse({
            say: 'Connecting you to an agent...',
            dial: {
              record: 'record-from-ringing-dual',
            },
          }).toString();
        }
        
        return this.twilioClient.markupResponse({
          say: 'No agents available. Please leave a message.',
          record: {
            action: `${this.configService.get('API_URL')}/phone/voice/voicemail`,
            maxLength: 60,
          },
        }).toString();

      default:
        return this.twilioClient.markupResponse({
          say: 'Invalid option. Goodbye.',
        }).toString();
    }
  }

  async handleVoicemail(data: {
    callSid: string;
    recordingUrl: string;
    duration: number;
    transcription?: string;
  }): Promise<void> {
    const call = await this.prisma.phoneCall.findFirst({
      where: { callSid: data.callSid },
    });

    if (call) {
      await this.prisma.phoneCall.update({
        where: { id: call.id },
        data: {
          status: 'VOICEMAIL',
          recordingUrl: data.recordingUrl,
          duration: data.duration,
          transcription: data.transcription,
        },
      });

      if (call.organizationId) {
        const notification = await this.prisma.notification.create({
          data: {
            organizationId: call.organizationId,
            type: 'VOICEMAIL',
            title: 'New Voicemail',
            message: `New voicemail from ${call.from}`,
            data: {
              callId: call.id,
              recordingUrl: data.recordingUrl,
              transcription: data.transcription,
            } as any,
          },
        });

        const agents = await this.prisma.user.findMany({
          where: {
            organizationId: call.organizationId,
            role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
          },
        });

        await this.prisma.notification.createMany({
          data: agents.map(agent => ({
            userId: agent.id,
            organizationId: call.organizationId,
            type: 'VOICEMAIL',
            title: 'New Voicemail',
            message: `New voicemail from ${call.from}`,
            data: { callId: call.id } as any,
          })),
        });
      }
    }
  }

  async transcribeRecording(recordingUrl: string): Promise<VoicemailTranscription> {
    if (!this.twilioClient) {
      return { transcription: '', duration: 0 };
    }

    try {
      const transcription = await this.twilioClient.transcriptions.create({
        recordingSid: recordingUrl,
      });
      return {
        transcription: transcription.transcriptionText,
        duration: 0,
      };
    } catch (error) {
      this.logger.error('Transcription failed:', error.message);
      return { transcription: '', duration: 0 };
    }
  }

  async getCallHistory(organizationId: string, limit: number = 50) {
    return this.prisma.phoneCall.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: { select: { id: true, subject: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getCallMetrics(organizationId: string) {
    const totalCalls = await this.prisma.phoneCall.count({
      where: { organizationId },
    });

    const answeredCalls = await this.prisma.phoneCall.count({
      where: { 
        organizationId,
        status: 'COMPLETED',
      },
    });

    const missedCalls = await this.prisma.phoneCall.count({
      where: { 
        organizationId,
        status: 'NO_ANSWER',
      },
    });

    const voicemails = await this.prisma.phoneCall.count({
      where: { 
        organizationId,
        status: 'VOICEMAIL',
      },
    });

    return {
      total: totalCalls,
      answered: answeredCalls,
      missed: missedCalls,
      voicemails,
      answerRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
    };
  }

  private async findAvailableAgent(organizationId: string) {
    const agents = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
        availabilityStatus: 'ONLINE',
      },
      include: {
        agentAvailability: {
          where: { status: 'ONLINE' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (agents.length === 0) return null;

    const agentCounts = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: {
        assigneeId: { in: agents.map(a => a.id) },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      _count: { id: true },
    });

    const countMap = new Map(agentCounts.map(c => [c.assigneeId, c._count.id]));
    
    return agents.sort((a, b) => 
      (countMap.get(a.id) || 0) - (countMap.get(b.id) || 0)
    )[0];
  }

  async handleCallStatusUpdate(data: {
    callSid: string;
    status: string;
    duration?: number;
  }) {
    const updateData: any = { status: data.status.toUpperCase() };
    
    if (data.duration) {
      updateData.duration = data.duration;
    }

    await this.prisma.phoneCall.updateMany({
      where: { callSid: data.callSid },
      data: updateData,
    });
  }
}
