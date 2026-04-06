declare namespace Express {
  interface User {
    sub: string;
    email: string;
    role: 'admin' | 'user';
  }
}
