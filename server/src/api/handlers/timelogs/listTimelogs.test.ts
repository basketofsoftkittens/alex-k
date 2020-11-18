import { FullAuthenticatedRequest, TimelogSearchParams, TimelogsResponse } from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { listTimelogs } from '.';

describe('listTimelogs', () => {
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
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 50,
      user,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      FullAuthenticatedRequest<expressCore.ParamsDictionary, unknown, TimelogSearchParams>,
      Response<TimelogsResponse>
    >(
      {
        method: 'GET',
        url: 'api/v1/timelogs',
      },
      {},
    );

    const response = (await listTimelogs(mock.req, mock.res)) as MockResponse<Response<TimelogsResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('lists only own timelogs if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 3,
      user: manager,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 5,
      user: admin,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 7,
      user: otherUser,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      FullAuthenticatedRequest<expressCore.ParamsDictionary, unknown, TimelogSearchParams>,
      Response<TimelogsResponse>
    >(
      {
        method: 'GET',
        url: 'api/v1/timelogs',
      },
      {},
    );
    mock.req.user = user;

    const response = (await listTimelogs(mock.req, mock.res)) as MockResponse<Response<TimelogsResponse>>;
    const returnedTimelogs: TimelogsResponse = response._getJSONData();
    expect(returnedTimelogs.numTimelogs).toEqual(1);
    expect(returnedTimelogs.timelogs.length).toEqual(1);
    expect(returnedTimelogs.timelogs[0].userId).toEqual(user.id);
  });

  it('lists only own timelogs if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherManager = await UserService.create('manager2@example.com', '123', UserRole.MANAGER);
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: manager,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 3,
      user: admin,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 5,
      user: user,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 7,
      user: otherManager,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      FullAuthenticatedRequest<expressCore.ParamsDictionary, unknown, TimelogSearchParams>,
      Response<TimelogsResponse>
    >(
      {
        method: 'GET',
        url: 'api/v1/timelogs',
      },
      {},
    );
    mock.req.user = manager;

    const response = (await listTimelogs(mock.req, mock.res)) as MockResponse<Response<TimelogsResponse>>;
    const returnedTimelogs: TimelogsResponse = response._getJSONData();
    expect(returnedTimelogs.numTimelogs).toEqual(1);
    expect(returnedTimelogs.timelogs.length).toEqual(1);
    expect(returnedTimelogs.timelogs[0].userId).toEqual(manager.id);
  });

  it('lists own timelogs and others if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherAdmin = await UserService.create('admin2a@example.com', '123', UserRole.ADMIN);
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 1,
      user: admin,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 3,
      user: manager,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 5,
      user: user,
      description: 'blah',
    });
    await TimelogService.create({
      date: moment().toDate(),
      minutes: 7,
      user: otherAdmin,
      description: 'blah',
    });

    const mock = httpMocks.createMocks<
      FullAuthenticatedRequest<expressCore.ParamsDictionary, unknown, TimelogSearchParams>,
      Response<TimelogsResponse>
    >(
      {
        method: 'GET',
        url: 'api/v1/timelogs',
      },
      {},
    );
    mock.req.user = admin;

    const response = (await listTimelogs(mock.req, mock.res)) as MockResponse<Response<TimelogsResponse>>;
    const returnedTimelogs: TimelogsResponse = response._getJSONData();
    expect(returnedTimelogs.numTimelogs).toEqual(4);
    expect(returnedTimelogs.timelogs.length).toEqual(4);
    expect(new Set(returnedTimelogs.timelogs.map(log => log.userId))).toEqual(
      new Set([manager.id, admin.id, user.id, otherAdmin.id]),
    );
  });
});
