import {
  FullAuthenticatedRequest,
  TimelogSearchParams,
  TimelogsResponse,
  UsersResponse,
  AuthenticatedRequest,
} from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { listUsers } from '.';

describe('listUsers', () => {
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

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UsersResponse>>(
      {
        method: 'GET',
        url: 'api/v1/users',
      },
      {},
    );

    const response = (await listUsers(mock.req, mock.res)) as MockResponse<Response<UsersResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('lists only self if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UsersResponse>>(
      {
        method: 'GET',
        url: 'api/v1/users',
      },
      {},
    );
    mock.req.user = user;

    const response = (await listUsers(mock.req, mock.res)) as MockResponse<Response<UsersResponse>>;
    const returnedUsers: UsersResponse = response._getJSONData();
    expect(returnedUsers.numUsers).toEqual(1);
    expect(returnedUsers.users.length).toEqual(1);
    expect(returnedUsers.users[0].id).toEqual(user.id);
  });

  it('lists self and others but not admins if manager role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherManager = await UserService.create('manager2@example.com', '123', UserRole.MANAGER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UsersResponse>>(
      {
        method: 'GET',
        url: 'api/v1/users',
      },
      {},
    );
    mock.req.user = manager;

    const response = (await listUsers(mock.req, mock.res)) as MockResponse<Response<UsersResponse>>;
    const returnedUsers: UsersResponse = response._getJSONData();
    expect(returnedUsers.numUsers).toEqual(3);
    expect(returnedUsers.users.length).toEqual(3);
    expect(new Set(returnedUsers.users.map(u => u.id))).toEqual(new Set([manager.id, user.id, otherManager.id]));
  });

  it('lists self and others if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherAdmin = await UserService.create('admin2a@example.com', '123', UserRole.ADMIN);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UsersResponse>>(
      {
        method: 'GET',
        url: 'api/v1/users',
      },
      {},
    );
    mock.req.user = admin;

    const response = (await listUsers(mock.req, mock.res)) as MockResponse<Response<UsersResponse>>;
    const returnedUsers: UsersResponse = response._getJSONData();
    expect(returnedUsers.numUsers).toEqual(4);
    expect(returnedUsers.users.length).toEqual(4);
    expect(new Set(returnedUsers.users.map(u => u.id))).toEqual(
      new Set([manager.id, admin.id, user.id, otherAdmin.id]),
    );
  });
});
