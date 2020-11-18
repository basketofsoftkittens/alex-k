import { getTimelogById, deleteTimelogById } from 'services/timelogService';
import { User, UserRole } from 'models/userModel';
import { ApiError } from 'api/request';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';

type DeleteTimelogArgs = {
  logId: string;
  authUser: User;
};

export default async function handleDeleteTimelog({ logId, authUser }: DeleteTimelogArgs): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new ApiError(`ID ${logId} is not valid`, HttpStatus.BAD_REQUEST);
  }
  const timelog = await getTimelogById(logId);

  if (!timelog) {
    throw new ApiError(`no timelog with ID ${logId} found`, HttpStatus.NOT_FOUND);
  }

  if (`${timelog.user}` !== authUser.id && authUser.role !== UserRole.ADMIN) {
    if (authUser.role === UserRole.USER) {
      throw new ApiError(`no timelog with ID ${logId} found`, HttpStatus.NOT_FOUND);
    }
    throw new ApiError('can only delete your own timelogs', HttpStatus.FORBIDDEN);
  }

  await deleteTimelogById(logId);
}
