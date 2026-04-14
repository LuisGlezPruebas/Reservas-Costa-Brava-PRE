'use server';

import { login } from '@/lib/auth';

export async function loginAction(password: string) {
  return await login(password);
}

// Made with Bob