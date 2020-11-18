import httpMocks, { MockResponse } from 'node-mocks-http';
import { AuthenticatedRequest, SuccessResponse, DeleteTimelogParams } from 'api/request';
import { Response } from 'express';
import { UserRole } from 'models/userModel';
import * as UserService from 'services/userService';
import * as TimelogService from 'services/timelogService';
import { launch, AppState } from '~/testing/integrationSetup';
import moment from 'moment';
import { deleteTimelog } from '.';
import mongoose from 'mongoose';

describe('deleteTimelog', () => {
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

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );

    const response = (await deleteTimelog(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('deletes own timelog if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await deleteTimelog(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    const returned: SuccessResponse = response._getJSONData();
    expect(returned.success).toBeTruthy();
  });

  it('deletes own timelog if manager role', async () => {
    const user = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await deleteTimelog(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    const returned: SuccessResponse = response._getJSONData();
    expect(returned.success).toBeTruthy();
  });

  it('deletes own timelog if admin role', async () => {
    const user = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await deleteTimelog(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    const returned: SuccessResponse = response._getJSONData();
    expect(returned.success).toBeTruthy();
  });

  it('has useful message if log is not found', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const fakeId = `${mongoose.Types.ObjectId()}`;
    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${fakeId}`,
        params: {
          id: fakeId,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await deleteTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no timelog with ID ${fakeId} found`);
  });

  it('cannot delete timelog for others if role is user', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await deleteTimelog(mock.req, mock.res);
    }).rejects.toThrow(`no timelog with ID ${timelog.id} found`);
  });

  it('cannot delete timelog for others if role is manager', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await deleteTimelog(mock.req, mock.res);
    }).rejects.toThrow(`can only delete your own timelogs`);
  });

  it('deletes timelog for others if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user@example.com', '123', UserRole.USER);
    const timelog = await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/timelogs/timelog/${timelog.id}`,
        params: {
          id: timelog.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await deleteTimelog(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    const returned: SuccessResponse = response._getJSONData();
    expect(returned.success).toBeTruthy();
  });
});
