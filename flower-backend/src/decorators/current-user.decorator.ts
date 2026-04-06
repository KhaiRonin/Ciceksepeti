import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}

export const CurrentUser = createParamDecorator((data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  if (!request.user) {
    return null;
  }
  return data ? request.user[data] : request.user;
});
