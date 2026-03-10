import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

export async function bootstrap(expressInstance: any) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Movies API')
    .setDescription(
      'REST API for movie management with Star Wars synchronization.\n\n' +
        '## Authentication\n' +
        'Register a user and login to obtain a JWT token. ' +
        'Include it as `Bearer <token>` in the Authorization header.\n\n' +
        '## Roles\n' +
        '- **admin**: Can create, update, delete movies and trigger SWAPI sync\n' +
        '- **user**: Can list and view movie details',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}
