import { PopulatedTimelog } from 'models/timelogModel';
import { User, UserRole } from 'models/userModel';
import { Moment } from 'moment';
import { findTimelogs, populateTimelogs } from 'services/timelogService';

type ListTimelogsArgs = {
  fromMoment?: Moment;
  toMoment?: Moment;
  authUser: User;
};

export default async function handleListTimelogs({
  fromMoment,
  toMoment,
  authUser,
}: ListTimelogsArgs): Promise<PopulatedTimelog[]> {
  const timelogs = await findTimelogs(
    fromMoment?.toDate(),
    toMoment?.toDate(),
    authUser.role === UserRole.ADMIN ? undefined : authUser.id,
  );
  return populateTimelogs(timelogs);
}
