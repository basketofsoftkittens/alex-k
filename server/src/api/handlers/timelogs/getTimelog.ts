import { User, UserRole } from 'models/userModel';
import { PopulatedTimelog } from 'models/timelogModel';
import { getTimelogById, populateTimelog } from 'services/timelogService';
import { ApiError } from 'api/request';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';

type GetTimelogArgs = {
  logId: string;
  authUser: User;
};

export default async function handleGetTimelog({ logId, authUser }: GetTimelogArgs): Promise<PopulatedTimelog> {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw new ApiError(`ID ${logId} is not valid`, HttpStatus.BAD_REQUEST);
  }
  const log = await getTimelogById(logId);

  if (!log || (log.user != authUser.id && authUser.role !== UserRole.ADMIN)) {
    throw new ApiError(`no timelog with ID ${logId} found`, HttpStatus.NOT_FOUND);
  }

  return populateTimelog(log);
}
