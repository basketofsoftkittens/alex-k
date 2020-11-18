import { AuthenticatedRequest, GetTimelogParams, TimelogResponse } from 'api/request';
import { Response } from 'express';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { getTimelog } from '.';

describe('getTimelog', () => {
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

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );

    const response = (await getTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('gets own timelog if user role', async () => {
    const user = await UserService.create('fake1@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 50,
      user,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await getTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.userEmail).toEqual(user.email);
  });

  it('gets own timelog if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 50,
      user: manager,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await getTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(manager.id);
    expect(returnedTimelog.userEmail).toEqual(manager.email);
  });

  it('gets own timelog if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const timelog = await TimelogService.create({
      date: moment().toDate(),
      minutes: 50,
      user: admin,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await getTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(admin.id);
    expect(returnedTimelog.userEmail).toEqual(admin.email);
  });

  it('cannot get timelog for others if role is user', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await getTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no timelog with ID ${timelog.id} found`);
  });

  it('cannot get timelog for others if role is manager', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await getTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no timelog with ID ${timelog.id} found`);
  });

  it('can get timelog for others if role is admin', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<GetTimelogParams, unknown>, Response<TimelogResponse>>(
      {
        method: 'GET',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await getTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.id).toEqual(timelog.id);
    expect(returnedTimelog.userId).toEqual(otherUser.id);
    expect(returnedTimelog.userEmail).toEqual(otherUser.email);
  });
});
