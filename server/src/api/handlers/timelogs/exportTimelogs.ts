import moment, { Moment } from 'moment';
import { User, UserRole } from 'models/userModel';
import { findTimelogs, populateTimelogs } from 'services/timelogService';
import { groupBy, sortBy } from 'lodash';
import { formatForDisplay, formatDuration } from 'services/chronoService';
import { PopulatedTimelog } from 'models/timelogModel';

type ExportTimelogsArgs = {
  fromMoment?: Moment;
  toMoment?: Moment;
  authUser: User;
};

type ExportTimelogsTemplateData = {
  fromDateStr?: string;
  toDateStr?: string;
  generatedDateStr: string;
  singleUserEmail?: string;
  exporterEmail?: string;
  groups: {
    dateStr: string;
    totalTimeStr: string;
    userEmail?: string;
    notes: string[];
  }[];
};

type UserDay = {
  date: Date;
  email: string;
  minutes: number;
  notes: string[];
};

const groupByUserAndDay = (timelogs: PopulatedTimelog[]): UserDay[] => {
  const groupedByDay = groupBy(timelogs, timelog => timelog.date.valueOf());
  const userDays: UserDay[] = [];
  Object.keys(groupedByDay).forEach(k => {
    const timelogsOnDay = groupedByDay[k];
    const groupedByUser = groupBy(timelogsOnDay, timelog => timelog.user.email);
    Object.keys(groupedByUser).forEach(email => {
      const timelogsOnDayForUser = groupedByUser[email];
      userDays.push(
        timelogsOnDayForUser.reduce(
          (acc: UserDay, timelog) => {
            const description = timelog.description.trim();
            return {
              ...acc,
              minutes: acc.minutes + timelog.minutes,
              // TODO: may want to only keep distinct descriptions/notes
              notes: description ? [...acc.notes, description] : [...acc.notes],
            };
          },
          {
            date: timelogsOnDayForUser[0].date,
            email,
            minutes: 0,
            notes: [],
          },
        ),
      );
    });
  });
  return userDays;
};

export default async function handleTimelogExport({
  fromMoment,
  toMoment,
  authUser,
}: ExportTimelogsArgs): Promise<ExportTimelogsTemplateData> {
  const selfOnly = [UserRole.USER, UserRole.MANAGER].includes(authUser.role);
  const timelogs = await findTimelogs(
    fromMoment?.toDate(),
    toMoment?.toDate(),
    authUser.role === UserRole.ADMIN ? undefined : authUser.id,
  );
  const populatedTimelogs = await populateTimelogs(timelogs);
  const userDays = groupByUserAndDay(populatedTimelogs);
  return {
    fromDateStr: fromMoment ? formatForDisplay(fromMoment) : undefined,
    toDateStr: toMoment ? formatForDisplay(toMoment) : undefined,
    // risk of timezone bug by using moment() on server
    generatedDateStr: formatForDisplay(moment()),
    singleUserEmail: selfOnly ? authUser.email : undefined,
    exporterEmail: selfOnly ? undefined : authUser.email,
    groups: sortBy(userDays, userDay => userDay.date)
      .reverse()
      .map(userDay => {
        return {
          dateStr: formatForDisplay(userDay.date),
          totalTimeStr: formatDuration(moment.duration(userDay.minutes, 'minutes')),
          userEmail: selfOnly ? undefined : userDay.email,
          notes: userDay.notes,
        };
      }),
  };
}
