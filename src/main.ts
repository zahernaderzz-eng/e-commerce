import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { ResponseInterceptor } from './response/response.interceptor';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { initFirebaseAdmin } from './firebase/firebase-admin';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  initFirebaseAdmin();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

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

  const config = new DocumentBuilder()
    .setTitle('E-commerce Api')
    .setDescription('Api documentation for e-commerce application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
