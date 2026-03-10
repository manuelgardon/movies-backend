import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();

async function createNestServer(expressInstance: ReturnType<typeof express>) {
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
    .setDescription('REST API for movie management with Star Wars sync')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

let nestApp: Awaited<ReturnType<typeof createNestServer>> | undefined;

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  if (!nestApp) {
    nestApp = await createNestServer(server);
  }
  server(req, res);
}
