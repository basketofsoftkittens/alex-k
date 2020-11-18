import HttpStatus from 'http-status-codes';
import { User } from 'models/userModel';
import { ApiError } from 'api/request';
import { getUserByEmail, hashPassword } from 'services/userService';

type LoginArgs = {
  email: string;
  password: string;
};

export default async function handleLogin({ email, password }: LoginArgs): Promise<User> {
  const user = await getUserByEmail(email, true);
  if (!user) {
    throw new ApiError('email or password is incorrect', HttpStatus.UNAUTHORIZED);
  }
  const hash = hashPassword(password, user.authInfo.salt);
  if (hash !== user.authInfo.hash) {
    throw new ApiError('email or password is incorrect', HttpStatus.UNAUTHORIZED);
  }
  return user;
}
