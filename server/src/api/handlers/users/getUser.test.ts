import { AuthenticatedRequest, GetTimelogParams, TimelogResponse, UserResponse } from 'api/request';
import { Response } from 'express';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { getUserById } from '.';

describe('getUser', () => {
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
    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );

    const response = (await getUserById(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('gets self', async () => {
    const user = await UserService.create('fake1@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await getUserById(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(user.id);
  });

  it('cannot get others if role is user', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: `api/v1/users/user/${otherUser.id}`,
        params: {
          id: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await getUserById(mock.req, mock.res);
    }).rejects.toThrow(`no user with ID ${otherUser.id} found`);
  });

  it('can get users if role is manager', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await getUserById(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(user.id);
  });

  it('can get users if role is admin', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await getUserById(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(user.id);
  });

  it('can get managers if role is admin', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: `api/v1/users/user/${manager.id}`,
        params: {
          id: manager.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await getUserById(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(manager.id);
  });
});
