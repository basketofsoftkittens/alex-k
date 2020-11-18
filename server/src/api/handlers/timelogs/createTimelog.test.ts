import httpMocks, { MockResponse } from 'node-mocks-http';
import { TimelogResponse, CreateTimelogBody, AuthenticatedRequest } from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import * as UserService from 'services/userService';
import { launch, AppState } from '~/testing/integrationSetup';
import moment from 'moment';
import { formatForApi } from 'services/chronoService';
import { createTimelog } from '.';

describe('createTimelog', () => {
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
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
      },
      {},
    );

    const response = (await createTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('creates timelog for self if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await createTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.date).toEqual(dateStr);
    expect(returnedTimelog.description).toEqual(description);
    expect(returnedTimelog.minutes).toEqual(minutes);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.userEmail).toEqual(user.email);
  });

  it('creates timelog for self if manager role', async () => {
    const user = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await createTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.date).toEqual(dateStr);
    expect(returnedTimelog.description).toEqual(description);
    expect(returnedTimelog.minutes).toEqual(minutes);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.userEmail).toEqual(user.email);
  });

  it('creates timelog for self if admin role', async () => {
    const user = await UserService.create('admin@example.com', '123', UserRole.ADMIN);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await createTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.date).toEqual(dateStr);
    expect(returnedTimelog.description).toEqual(description);
    expect(returnedTimelog.minutes).toEqual(minutes);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.userEmail).toEqual(user.email);
  });

  it('creates timelog even if minutes is zero', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 0;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await createTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.date).toEqual(dateStr);
    expect(returnedTimelog.description).toEqual(description);
    expect(returnedTimelog.minutes).toEqual(minutes);
    expect(returnedTimelog.userId).toEqual(user.id);
    expect(returnedTimelog.userEmail).toEqual(user.email);
  });

  it('cannot create timelog for others if role is user', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await createTimelog(mock.req, mock.res);
    }).rejects.toThrow('not allowed to create timelogs for other users');
  });

  it('cannot create timelog for others if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user@example.com', '123', UserRole.USER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await createTimelog(mock.req, mock.res);
    }).rejects.toThrow('not allowed to create timelogs for other users');
  });

  it('creates timelog for others if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user@example.com', '123', UserRole.USER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await createTimelog(mock.req, mock.res)) as MockResponse<Response<TimelogResponse>>;
    const returnedTimelog: TimelogResponse = response._getJSONData();
    expect(returnedTimelog.date).toEqual(dateStr);
    expect(returnedTimelog.description).toEqual(description);
    expect(returnedTimelog.minutes).toEqual(minutes);
    expect(returnedTimelog.userId).toEqual(otherUser.id);
    expect(returnedTimelog.userEmail).toEqual(otherUser.email);
  });

  it('has useful message if date is invalid', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const invalidDateStr = 'not a date';
    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: invalidDateStr,
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await createTimelog(mock.req, mock.res);
    }).rejects.toThrow('invalid date format, expected DDMMMYYYY');
  });

  it('has useful message if date is missing', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const description = 'some text';
    const minutes = 42;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await createTimelog(mock.req, mock.res);
    }).rejects.toThrow('date is required to create a timelog');
  });

  it('has useful message if minutes is negative', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const dateStr = formatForApi(moment([2020, 5, 15]));
    const description = 'some text';
    const minutes = -1;

    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
      Response<TimelogResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/timelogs/timelog',
        body: {
          date: dateStr,
          description,
          minutes,
          userId: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await createTimelog(mock.req, mock.res);
    }).rejects.toThrow('Validation error on field(s): minutes');
  });
});
