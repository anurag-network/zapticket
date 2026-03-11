import { Module } from '@nestjs/common';
import { ChannelModule } from './channel.module';
import { SMSModule } from './sms/sms.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { FacebookModule } from './facebook/facebook.module';
import { TwitterModule } from './twitter/twitter.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ChannelModule,
    SMSModule,
    WhatsAppModule,
    FacebookModule,
    TwitterModule,
    TelegramModule,
  ],
  exports: [
    ChannelModule,
    SMSModule,
    WhatsAppModule,
    FacebookModule,
    TwitterModule,
    TelegramModule,
  ],
})
export class ChannelsModule {}
