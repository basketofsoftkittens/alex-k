import { User, UserRole } from 'models/userModel';
import { PopulatedTimelog } from 'models/timelogModel';
import { ApiError } from 'api/request';
import HttpStatus from 'http-status-codes';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import mongoose from 'mongoose';

type CreateTimelogArgs = {
  description: string;
  date: Date;
  minutes: number;
  userId: string;
  authUser: User;
};

export default async function handleCreateTimelog({
  date,
  description,
  minutes,
  userId,
  authUser,
}: CreateTimelogArgs): Promise<PopulatedTimelog> {
  if (authUser.id !== userId && authUser.role !== UserRole.ADMIN) {
    throw new ApiError('not allowed to create timelogs for other users', HttpStatus.FORBIDDEN);
  }

  const assignedUser = await UserService.getUserById(userId);
  if (!assignedUser) {
    throw new ApiError(`user with ID ${userId} not found`, HttpStatus.NOT_FOUND);
  }

  try {
    const timelog = await TimelogService.create({
      date,
      description,
      user: assignedUser,
      minutes,
    });
    return TimelogService.populateTimelog(timelog);
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
