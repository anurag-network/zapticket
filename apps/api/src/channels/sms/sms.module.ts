import { Module } from '@nestjs/common';
import { SMSService } from './sms.service';
import { SMSController, PublicSMSController } from './sms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SMSController, PublicSMSController],
  providers: [SMSService],
  exports: [SMSService],
})
export class SMSModule {}
