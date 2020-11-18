import { getTimelogById, deleteTimelogById, deleteTimelogsByUser } from 'services/timelogService';
import { User, UserRole } from 'models/userModel';
import { ApiError } from 'api/request';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { getUserById, deleteUserById } from 'services/userService';

type DeleteUserArgs = {
  userId: string;
  authUser: User;
};

export default async function handleDeleteUser({ userId, authUser }: DeleteUserArgs): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(`ID ${userId} is not valid`, HttpStatus.BAD_REQUEST);
  }
  if (![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    throw new ApiError('not allowed to delete users', HttpStatus.NOT_FOUND);
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(`no user with ID ${userId} found`, HttpStatus.NOT_FOUND);
  }

  await deleteTimelogsByUser(userId);
  await deleteUserById(userId);
}
