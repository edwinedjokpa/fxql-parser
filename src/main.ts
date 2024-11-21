import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpErrorExceptionFilter } from './utils/https-error.exception';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow('PORT') || 3000;

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('FXQL Parser')
    .setDescription('The is a FXQL Parser to parse and store exchange rates.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpErrorExceptionFilter());

  await app.listen(PORT);
  logger.log(`App is listening on :${PORT}`);
}
bootstrap();
