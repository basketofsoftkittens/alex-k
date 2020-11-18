import { User, UserRole } from 'models/userModel';
import { getUserById } from 'services/userService';
import HttpStatus from 'http-status-codes';
import { ApiError } from 'api/request';
import mongoose from 'mongoose';

type GetUserArgs = {
  userId: string;
  authUser: User;
};

export default async function handleGetUser({ userId, authUser }: GetUserArgs): Promise<User> {
  if (userId === authUser.id) {
    return authUser;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(`ID ${userId} is not valid`, HttpStatus.BAD_REQUEST);
  }

  if (![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    throw new ApiError(`no user with ID ${userId} found`, HttpStatus.NOT_FOUND);
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(`no user with ID ${userId} found`, HttpStatus.NOT_FOUND);
  }
  return user;
}
