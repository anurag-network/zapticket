import { Module } from '@nestjs/common';
import { StatusPageService } from './status-page.service';
import { StatusPageController } from './status-page.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatusPageController],
  providers: [StatusPageService],
  exports: [StatusPageService],
})
export class StatusPageModule {}
