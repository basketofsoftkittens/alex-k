import { AuthenticatedRequest, TimelogResponse, UpdateTimelogBody, UpdateTimelogParams } from 'api/request';
import { Response } from 'express';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import { formatForApi } from 'services/chronoService';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { updateTimelog } from '.';

describe('updateTimelog', () => {
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

  it('requires authentication', async () => {
    const user = await UserService.create('fake1@example.com', '123');
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 50,
      user,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('updates own timelog if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });

    const updatedDescription = `${timelog.description} updated`;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          description: updatedDescription,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.date).toEqual(formatForApi(timelog.date));
    expect(returnedTimelog.minutes).toEqual(timelog.minutes);
    expect(returnedTimelog.description).toEqual(updatedDescription);
  });

  it('updates own timelog if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: manager,
      description: 'blah',
    });

    const updatedDescription = `${timelog.description} updated`;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          description: updatedDescription,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(manager.id);
    expect(returnedTimelog.date).toEqual(formatForApi(timelog.date));
    expect(returnedTimelog.minutes).toEqual(timelog.minutes);
    expect(returnedTimelog.description).toEqual(updatedDescription);
  });

  it('updates own timelog if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: admin,
      description: 'blah',
    });

    const updatedDescription = `${timelog.description} updated`;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          description: updatedDescription,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(admin.id);
    expect(returnedTimelog.date).toEqual(formatForApi(timelog.date));
    expect(returnedTimelog.minutes).toEqual(timelog.minutes);
    expect(returnedTimelog.description).toEqual(updatedDescription);
  });

  it('updates only date of timelog', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });

    const updatedDate = moment([2020, 5, 15]);
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          date: formatForApi(updatedDate),
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.date).toEqual(formatForApi(updatedDate));
  });

  it('updates only user of timelog if allowed', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: admin,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          userId: user.id,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
  });

  it('cannot update user of timelog to self if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: otherUser,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          userId: user.id,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await updateTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no timelog with ID ${timelog.id} found`);
  });

  it('cannot update user of timelog from self if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          userId: otherUser.id,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await updateTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no user with ID ${otherUser.id} found`);
  });

  it('cannot update user of timelog to self if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: otherUser,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          userId: manager.id,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await updateTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no timelog with ID ${timelog.id} found`);
  });

  it('cannot update user of timelog from self if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: manager,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          userId: otherUser.id,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await updateTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no user with ID ${otherUser.id} found`);
  });

  it('updates only minutes of timelog', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });

    const updatedMinutes = timelog.minutes + 100;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          minutes: updatedMinutes,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.minutes).toEqual(updatedMinutes);
  });

  it('can update minutes of timelog to zero', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          minutes: 0,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.minutes).toEqual(0);
  });

  it('updates all fields of timelog at same time', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: admin,
      description: 'blah',
    });

    const updatedDate = moment([2020, 5, 15]);
    const updatedMinutes = timelog.minutes + 100;
    const updatedDescription = `${timelog.description} updated`;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          date: updatedDate,
          minutes: updatedMinutes,
          description: updatedDescription,
          userId: user.id,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await updateTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.description).toEqual(updatedDescription);
    expect(returnedTimelog.date).toEqual(formatForApi(updatedDate));
    expect(returnedTimelog.minutes).toEqual(updatedMinutes);
  });

  it('cannot update minutes of timelog to negative value', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });

    const updatedMinutes = -1;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'POST',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        body: {
          minutes: updatedMinutes,
        },
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await updateTimelog(mock.req, mock.res);
    }).rejects.toThrow(
      `Timelog validation failed: minutes: Path \`minutes\` (${updatedMinutes}) is less than minimum allowed value (0).`,
    );
  });
});
