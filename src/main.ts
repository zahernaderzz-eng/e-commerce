import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { ResponseInterceptor } from './response/response.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initFirebaseAdmin } from './firebase/firebase-admin';
async function bootstrap() {
  initFirebaseAdmin();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.use('/payment/webhook', bodyParser.raw({ type: 'application/json' }));

  app.use(bodyParser.json());

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
