import { Module } from '@nestjs/common';
import { FxqlService } from './fxql.service';
import { FxqlController } from './fxql.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from 'src/database/entities/exchange-rates.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  controllers: [FxqlController],
  providers: [FxqlService],
})
export class FxqlModule {}
