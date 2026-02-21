import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ImapService } from './imap.service';
import { EmailController } from './email.controller';

@Module({
  controllers: [EmailController],
  providers: [EmailService, ImapService],
  exports: [EmailService, ImapService],
})
export class EmailModule {}
