import { Module } from '@nestjs/common';
import { CannedResponseService } from './canned-responses.service';
import { CannedResponseController } from './canned-responses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CannedResponseController],
  providers: [CannedResponseService],
  exports: [CannedResponseService],
})
export class CannedResponsesModule {}
