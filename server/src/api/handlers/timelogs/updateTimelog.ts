import { ApiError } from 'api/request';
import HttpStatus from 'http-status-codes';
import { PopulatedTimelog, Timelog } from 'models/timelogModel';
import { User, UserRole } from 'models/userModel';
import mongoose from 'mongoose';
import { getTimelogById, populateTimelog, updateTimelog } from 'services/timelogService';
import { getUserById } from 'services/userService';

type UpdateTimelogArgs = {
  logId: string;
  assignedUserId?: string;
  description?: string;
  date?: Date;
  minutes?: number;
  authUser: User;
};

export default async function handleUpdateTimelog({
  logId,
  assignedUserId,
  description,
  date,
  minutes,
  authUser,
}: UpdateTimelogArgs): Promise<PopulatedTimelog> {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new ApiError(`log ID ${logId} is not valid`, HttpStatus.BAD_REQUEST);
  }
  if (assignedUserId && !mongoose.Types.ObjectId.isValid(assignedUserId)) {
    throw new ApiError(`user ID ${assignedUserId} is not valid`, HttpStatus.BAD_REQUEST);
  }
  if (assignedUserId && authUser.role !== UserRole.ADMIN && assignedUserId !== authUser.id) {
    throw new ApiError(`no user with ID ${assignedUserId} found`, HttpStatus.NOT_FOUND);
  }

  const log = await getTimelogById(logId);
  if (!log || (log.user != authUser.id && authUser.role !== UserRole.ADMIN)) {
    throw new ApiError(`no timelog with ID ${logId} found`, HttpStatus.NOT_FOUND);
  }

  const assignedUser = assignedUserId ? await getUserById(assignedUserId) : undefined;
  if (assignedUserId && !assignedUser) {
    throw new ApiError(`no user with ID ${assignedUserId} found`, HttpStatus.NOT_FOUND);
  }

  const updateDoc: Partial<Pick<Timelog, 'user' | 'description' | 'date' | 'minutes'>> = {};
  if (assignedUser) {
    updateDoc.user = assignedUser.id;
  }
  if (description) {
    updateDoc.description = description;
  }
  if (date) {
    updateDoc.date = date;
  }
  if (minutes !== undefined) {
    updateDoc.minutes = minutes;
  }

  if (updateDoc.user || updateDoc.description !== undefined || updateDoc.date || updateDoc.minutes !== undefined) {
    const updatedLog = await updateTimelog(logId, updateDoc);
    return populateTimelog(updatedLog || log);
  }

  return populateTimelog(log);
}
