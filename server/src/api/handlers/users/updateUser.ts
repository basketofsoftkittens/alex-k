import { User, UserRole, UserSettings } from 'models/userModel';
import { updateUser, getUserById } from 'services/userService';
import HttpStatus from 'http-status-codes';
import { ApiError } from 'api/request';
import mongoose from 'mongoose';

type UpdateUserArgs = {
  userId: string;
  email?: string;
  role?: UserRole;
  settings?: Partial<UserSettings>;
  authUser: User;
};

export default async function handleUpdateUser({
  userId,
  email,
  role,
  settings,
  authUser,
}: UpdateUserArgs): Promise<User> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(`ID ${userId} is not valid`, HttpStatus.BAD_REQUEST);
  }
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(`no user with ID ${userId} found`, HttpStatus.NOT_FOUND);
  }
  if (userId !== authUser.id && ![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    throw new ApiError(`no user with ID ${userId} found`, HttpStatus.NOT_FOUND);
  }
  if (role === UserRole.ADMIN && authUser.role !== UserRole.ADMIN) {
    throw new ApiError(`role ${role} not found`, HttpStatus.UNPROCESSABLE_ENTITY);
  }
  if (role === UserRole.MANAGER && ![UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role)) {
    throw new ApiError(`role ${role} not found`, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  const updateDoc: Partial<Pick<User, 'email' | 'role' | 'settings'>> = {};

  if (email && (userId === authUser.id || [UserRole.MANAGER, UserRole.ADMIN].includes(authUser.role))) {
    updateDoc.email = email;
  }
  if (role) {
    updateDoc.role = role;
  }
  if (settings?.preferredDailyHours !== undefined) {
    if (userId !== authUser.id) {
      throw new ApiError('can only update your own settings', HttpStatus.FORBIDDEN);
    }
    updateDoc.settings = {
      preferredDailyHours: settings.preferredDailyHours,
    };
  }

  if (updateDoc.email || updateDoc.role || updateDoc.settings) {
    const updatedUser = await updateUser(userId, updateDoc);
    return updatedUser || user;
  }
  return user;
}
