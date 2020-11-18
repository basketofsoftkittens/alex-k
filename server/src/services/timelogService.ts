import TimelogModel, { Timelog, PopulatedTimelog } from 'models/timelogModel';
import UserModel from 'models/userModel';
import { Document, FilterQuery } from 'mongoose';
import { UserRole } from 'models/userModel';

enum SortOrder {
  ASC = 1,
  DESC = -1,
}

export async function getTimelogById(id: string): Promise<Timelog | undefined> {
  return (await TimelogModel.findById(id).exec()) || undefined;
}

export async function create(data: Pick<Timelog, Exclude<keyof Timelog, keyof Document>>): Promise<Timelog> {
  return await TimelogModel.create(data);
}

export async function findTimelogs(fromDate?: Date, toDate?: Date, userId?: string): Promise<Timelog[]> {
  const searchDoc: FilterQuery<Timelog> = {};
  if (fromDate || toDate) {
    searchDoc.date = {
      ...(fromDate ? { $gte: fromDate } : undefined),
      ...(toDate ? { $lte: toDate } : undefined),
    };
  }
  if (userId) {
    searchDoc.user = userId;
  }
  return await TimelogModel.find(searchDoc).sort({ date: SortOrder.DESC }).exec();
}

export async function populateTimelog(timelog: Timelog): Promise<PopulatedTimelog> {
  timelog.populate('user');
  await timelog.execPopulate();
  return timelog as PopulatedTimelog;
}

export async function populateTimelogs(timelogs: Timelog[]): Promise<PopulatedTimelog[]> {
  // TODO: can improve performance by querying all (unique) user emails in a single query instead of this
  return await Promise.all(timelogs.map(async timelog => populateTimelog(timelog)));
}

export async function deleteTimelogById(id: string): Promise<void> {
  await TimelogModel.findByIdAndDelete(id).exec();
}

export async function deleteTimelogsByUser(userId: string): Promise<void> {
  await TimelogModel.deleteMany({ user: userId }).exec();
}

export async function updateTimelog(
  id: string,
  fields: Partial<Pick<Timelog, 'user' | 'description' | 'date' | 'minutes'>>,
): Promise<Timelog | undefined> {
  const timelog = await getTimelogById(id);
  if (!timelog) {
    return undefined;
  }
  if (fields.date !== undefined) {
    timelog.date = fields.date;
  }
  if (fields.description !== undefined) {
    timelog.description = fields.description;
  }
  if (fields.minutes !== undefined) {
    timelog.minutes = fields.minutes;
  }
  if (fields.user !== undefined) {
    timelog.user = fields.user;
  }
  return await timelog.save();
}
