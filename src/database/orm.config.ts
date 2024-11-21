import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ExchangeRate } from './entities/exchange-rates.entity';

export const TypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  ssl: configService.get<boolean>('DB_SSL_MODE') || false,
  autoLoadEntities: true,
  entities: [ExchangeRate],
  synchronize: true,
  logging: false,
});
