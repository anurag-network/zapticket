import { Module } from '@nestjs/common';
import { SMSModule } from './sms/sms.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { FacebookModule } from './facebook/facebook.module';
import { TwitterModule } from './twitter/twitter.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    SMSModule,
    WhatsAppModule,
    FacebookModule,
    TwitterModule,
    TelegramModule,
  ],
  exports: [
    SMSModule,
    WhatsAppModule,
    FacebookModule,
    TwitterModule,
    TelegramModule,
  ],
})
export class ChannelsModule {}
