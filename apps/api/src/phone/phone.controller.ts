import { Controller, Post, Get, Body, Param, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { TwilioPhoneService } from './twilio-phone.service';

@Controller('phone')
export class PhoneController {
  constructor(private readonly phoneService: TwilioPhoneService) {}

  @Post('call')
  async makeCall(@Body() body: {
    to: string;
    organizationId: string;
    ticketId?: string;
    agentId?: string;
  }) {
    return this.phoneService.makeCall(body);
  }

  @Post('voice/incoming')
  async handleIncomingCall(@Body() body: {
    From: string;
    To: string;
    CallSid: string;
  }) {
    const result = await this.phoneService.handleIncomingCall({
      from: body.From,
      to: body.To,
      callSid: body.CallSid,
    });
    return result;
  }

  @Post('voice/handle-greeting')
  async handleIVRResponse(@Body() body: {
    Digits: string;
    CallSid: string;
  }) {
    const call = await this.prisma.phoneCall.findFirst({
      where: { callSid: body.CallSid },
    });

    return this.phoneService.handleIVRResponse({
      digits: body.Digits,
      callSid: body.CallSid,
      organizationId: call?.organizationId || '',
    });
  }

  @Post('voice/voicemail')
  async handleVoicemail(@Body() body: {
    CallSid: string;
    RecordingUrl: string;
    RecordingDuration: string;
    TranscriptionText?: string;
  }) {
    return this.phoneService.handleVoicemail({
      callSid: body.CallSid,
      recordingUrl: body.RecordingUrl,
      duration: parseInt(body.RecordingDuration) || 0,
      transcription: body.TranscriptionText,
    });
  }

  @Post('voice/status')
  async handleCallStatus(@Body() body: {
    CallSid: string;
    CallStatus: string;
    CallDuration?: string;
  }) {
    return this.phoneService.handleCallStatusUpdate({
      callSid: body.CallSid,
      status: body.CallStatus,
      duration: body.CallDuration ? parseInt(body.CallDuration) : undefined,
    });
  }

  @Get('calls/:organizationId')
  async getCallHistory(
    @Param('organizationId') organizationId: string,
  ) {
    return this.phoneService.getCallHistory(organizationId);
  }

  @Get('metrics/:organizationId')
  async getCallMetrics(
    @Param('organizationId') organizationId: string,
  ) {
    return this.phoneService.getCallMetrics(organizationId);
  }
}
