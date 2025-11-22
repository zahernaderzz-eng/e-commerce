import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // ignore Stripe webhook
    if (req.url.startsWith('/payment/webhook')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((response) => ({
        success: true,
        data: response,
      })),
    );
  }
}
