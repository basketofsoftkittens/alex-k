import httpMocks, { MockResponse } from 'node-mocks-http';
import { AuthenticatedRequest, SuccessResponse, DeleteTimelogParams, DeleteUserParams } from 'api/request';
import { Response } from 'express';
import { UserRole } from 'models/userModel';
import * as UserService from 'services/userService';
import * as TimelogService from 'services/timelogService';
import { launch, AppState } from '~/testing/integrationSetup';
import moment from 'moment';
import { deleteUser } from '.';
import mongoose from 'mongoose';

describe('deleteUser', () => {
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

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteUserParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );

    const response = (await deleteUser(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('deletes self and all owned timelogs if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user@example.com', '123', UserRole.USER);
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: manager,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteUserParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/users/user/${manager.id}`,
        params: {
          id: manager.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await deleteUser(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    const returned: SuccessResponse = response._getJSONData();
    expect(returned.success).toBeTruthy();

    const selfTimelogs = await TimelogService.findTimelogs(undefined, undefined, manager.id);
    expect(selfTimelogs.length).toEqual(0);

    const otherTimelogs = await TimelogService.findTimelogs(undefined, undefined, otherUser.id);
    expect(otherTimelogs.length).toEqual(1);
  });

  it('deletes self and all owned timelogs if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user@example.com', '123', UserRole.USER);
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: otherUser,
    });
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user: admin,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteUserParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/users/user/${admin.id}`,
        params: {
          id: admin.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await deleteUser(mock.req, mock.res)) as MockResponse<Response<SuccessResponse>>;
    const returned: SuccessResponse = response._getJSONData();
    expect(returned.success).toBeTruthy();

    const selfTimelogs = await TimelogService.findTimelogs(undefined, undefined, admin.id);
    expect(selfTimelogs.length).toEqual(0);

    const otherTimelogs = await TimelogService.findTimelogs(undefined, undefined, otherUser.id);
    expect(otherTimelogs.length).toEqual(1);
  });

  it('cannot delete self if role is user', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    await TimelogService.create({
      date: moment([2020, 5, 15]).toDate(),
      description: 'some text',
      minutes: 42,
      user,
    });

    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteUserParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await deleteUser(mock.req, mock.res);
    }).rejects.toThrow('not allowed to delete users');

    const timelogs = await TimelogService.findTimelogs(undefined, undefined, user.id);
    expect(timelogs.length).toEqual(1);
  });

  it('has useful message if user is not found', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const fakeId = `${mongoose.Types.ObjectId()}`;
    const mock = httpMocks.createMocks<AuthenticatedRequest<DeleteTimelogParams, unknown>, Response<SuccessResponse>>(
      {
        method: 'DELETE',
        url: `api/v1/users/user/${fakeId}`,
        params: {
          id: fakeId,
        },
      },
      {},
    );
    mock.req.user = admin;

    await expect(async () => {
      await deleteUser(mock.req, mock.res);
    }).rejects.toThrow(`no user with ID ${fakeId} found`);
  });
});
