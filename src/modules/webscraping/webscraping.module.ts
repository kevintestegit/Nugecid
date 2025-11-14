import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebscrapingController } from './webscraping.controller';
import { WebscrapingService } from './services/webscraping.service';

@Module({
  imports: [ConfigModule],
  controllers: [WebscrapingController],
  providers: [WebscrapingService],
  exports: [WebscrapingService],
})
export class WebscrapingModule {}
