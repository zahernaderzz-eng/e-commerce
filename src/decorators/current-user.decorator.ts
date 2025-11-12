import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() decorator
 * يرجع المستخدم الحالي من الـrequest (اللي حطّه AuthenticationGuard)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    // AuthenticationGuard بيضيف userId بعد ما يفك JWT
    return request.userId;
  },
);
