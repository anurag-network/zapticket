import { Module } from '@nestjs/common';
import { MacrosController } from './macros.controller';
import { MacrosService } from './macros.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MacrosController],
  providers: [MacrosService],
  exports: [MacrosService],
})
export class MacrosModule {}
