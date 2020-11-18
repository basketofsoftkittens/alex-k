import jwt from 'jsonwebtoken';
import { getUserById } from 'services/userService';
import { User } from 'models/userModel';

type JwtPayload = {
  version: number;
  userId: string;
};

export async function validateUserForToken(token: string): Promise<User | undefined> {
  if (!process.env.SERVER_SECRET) {
    throw new Error('SERVER_SECRET env variable is required but missing');
  }
  try {
    const jwtPayload = jwt.verify(token, process.env.SERVER_SECRET) as JwtPayload;
    return await getUserById(jwtPayload.userId);
  } catch (e) {
    // ignore
  }
}

export function generateToken(userId: string): string {
  if (!process.env.SERVER_SECRET) {
    throw new Error('SERVER_SECRET env variable is required but missing');
  }
  const payload: JwtPayload = {
    version: 1,
    userId,
  };
  return jwt.sign(payload, process.env.SERVER_SECRET);
}
