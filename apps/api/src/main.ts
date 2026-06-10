import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:3012', 'http://127.0.0.1:3012', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const jwtService = app.get(JwtService);
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(jwtService, reflector));

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  console.log(`API server running on http://localhost:${port}`);
}
bootstrap();
