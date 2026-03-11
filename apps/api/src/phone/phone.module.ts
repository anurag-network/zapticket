import { Module } from '@nestjs/common';
import { PhoneController } from './phone.controller';
import { TwilioPhoneService } from './twilio-phone.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PhoneController],
  providers: [TwilioPhoneService],
  exports: [TwilioPhoneService],
})
export class PhoneModule {}
