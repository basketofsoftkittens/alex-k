import { User, UserRole } from 'models/userModel';
import { ApiError } from 'api/request';
import HttpStatus from 'http-status-codes';
import * as UserService from 'services/userService';
import mongoose from 'mongoose';

type CreateUserArgs = {
  email: string;
  password: string;
  role: UserRole;
  authUser: User;
};

export default async function handleCreateUser({ email, password, role, authUser }: CreateUserArgs): Promise<User> {
  if (!email.includes('@')) {
    throw new ApiError('email must be valid', HttpStatus.UNPROCESSABLE_ENTITY);
  }
  if (authUser.role === UserRole.MANAGER && role === UserRole.ADMIN) {
    throw new ApiError('not allowed to create admins', HttpStatus.FORBIDDEN);
  }
  if (![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    throw new ApiError('not allowed to create users', HttpStatus.FORBIDDEN);
  }

  try {
    return await UserService.create(email, password, role);
  } catch (e) {
    const error = e as mongoose.Error.ValidationError;
    if (error.errors) {
      throw new ApiError(
        `Validation error on field(s): ${Object.keys(error.errors).sort()}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    throw e;
  }
}
