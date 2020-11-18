import { UserRole } from 'models/userModel';
import moment from 'moment';
import { formatDuration, formatForDisplay } from 'services/chronoService';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import handleTimelogExport from './exportTimelogs';

describe('exportTimelogs', () => {
  let app: AppState;

  beforeAll(async () => {
    app = await launch();
  });

  afterAll(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await app.truncate();
  });

  it('user can only see own timelogs', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const ownTimelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 1,
      user,
    });
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 3,
      user: otherUser,
    });
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 5,
      user: manager,
    });
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 7,
      user: admin,
    });

    const data = await handleTimelogExport({
      authUser: user,
    });
    expect(data.groups.length).toEqual(1);
    expect(data.groups[0].userEmail).toBeUndefined();
    expect(data.groups[0].totalTimeStr).toEqual(formatDuration(moment.duration(ownTimelog.minutes, 'minutes')));
  });

  it('shows singleUserEmail and exporterEmail under right conditions', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);

    const userData = await handleTimelogExport({ authUser: user });
    expect(userData.singleUserEmail).toEqual(user.email);
    expect(userData.exporterEmail).toBeUndefined();

    const managerData = await handleTimelogExport({ authUser: manager });
    expect(managerData.singleUserEmail).toEqual(manager.email);
    expect(managerData.exporterEmail).toBeUndefined();

    const adminData = await handleTimelogExport({ authUser: admin });
    expect(adminData.singleUserEmail).toBeUndefined();
    expect(adminData.exporterEmail).toEqual(admin.email);
  });

  it('sorts groups by date descending', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const before = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'before',
      minutes: 1,
      user,
    });

    const after = await TimelogService.create({
      date: moment([2020, 5, 16]).toDate(),
      description: 'after',
      minutes: 5,
      user,
    });

    const data = await handleTimelogExport({ authUser: user });
    expect(data.groups.map(g => g.notes[0])).toEqual([after.description, before.description]);
  });

  it('groups by date and user', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user@example.com', '123', UserRole.USER);

    const a = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'on first day (1)',
      minutes: 1,
      user: otherUser,
    });
    const b = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'on first day (2)',
      minutes: 3,
      user: otherUser,
    });
    const c = await TimelogService.create({
      date: moment([2020, 5, 16]).toDate(),
      description: 'on second day',
      minutes: 5,
      user: otherUser,
    });
    const d = await TimelogService.create({
      date: moment([2020, 5, 16]).toDate(),
      description: 'on second day',
      minutes: 7,
      user: admin,
    });

    const data = await handleTimelogExport({ authUser: admin });
    expect(data.groups.length).toEqual(3);

    const dayOne = data.groups[2];
    expect(dayOne.dateStr).toEqual(formatForDisplay(a.date));
    expect(new Set(dayOne.notes)).toEqual(new Set([a.description, b.description]));
    expect(dayOne.totalTimeStr).toEqual(formatDuration(moment.duration(a.minutes + b.minutes, 'minutes')));
    expect(dayOne.userEmail).toEqual(otherUser.email);

    // don't know which order these will be in (no ordering across users)
    const dayTwoUser = data.groups[1].userEmail === otherUser.email ? data.groups[1] : data.groups[0];
    const dayTwoAdmin = data.groups[1].userEmail === admin.email ? data.groups[1] : data.groups[0];

    expect(dayTwoUser.dateStr).toEqual(formatForDisplay(c.date));
    expect(dayTwoUser.notes).toEqual([c.description]);
    expect(dayTwoUser.totalTimeStr).toEqual(formatDuration(moment.duration(c.minutes, 'minutes')));
    expect(dayTwoUser.userEmail).toEqual(otherUser.email);

    expect(dayTwoAdmin.dateStr).toEqual(formatForDisplay(d.date));
    expect(dayTwoAdmin.notes).toEqual([d.description]);
    expect(dayTwoAdmin.totalTimeStr).toEqual(formatDuration(moment.duration(d.minutes, 'minutes')));
    expect(dayTwoAdmin.userEmail).toEqual(admin.email);
  });
});
