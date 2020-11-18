import httpMocks, { MockResponse } from 'node-mocks-http';
import { AuthenticatedRequest, CreateUserBody, UserResponse } from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import * as UserService from 'services/userService';
import { launch, AppState } from '~/testing/integrationSetup';
import { createUser } from '.';
import { hashPassword } from 'services/userService';

describe('createUser', () => {
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
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email: 'user@example.com',
          password: '123',
          role: UserRole.USER,
        },
      },
      {},
    );

    const response = (await createUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('creates user if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const email = 'user@example.com';
    const password = '123';
    const role = UserRole.USER;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await createUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).not.toEqual(manager.id);
    expect(returnedUser.email).toEqual(email);
    expect(returnedUser.role).toEqual(role);

    const fullUser = await UserService.getUserByEmail(returnedUser.email, true);
    expect(fullUser?.authInfo.hash).toEqual(hashPassword(password, fullUser?.authInfo.salt || ''));
  });

  it('creates user if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);

    const email = 'user@example.com';
    const password = '123';
    const role = UserRole.USER;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await createUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).not.toEqual(admin.id);
    expect(returnedUser.email).toEqual(email);
    expect(returnedUser.role).toEqual(role);

    const fullUser = await UserService.getUserByEmail(returnedUser.email, true);
    expect(fullUser?.authInfo.hash).toEqual(hashPassword(password, fullUser?.authInfo.salt || ''));
  });

  it('creates manager if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const email = 'manager2@example.com';
    const password = '123';
    const role = UserRole.MANAGER;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await createUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).not.toEqual(manager.id);
    expect(returnedUser.email).toEqual(email);
    expect(returnedUser.role).toEqual(role);

    const fullUser = await UserService.getUserByEmail(returnedUser.email, true);
    expect(fullUser?.authInfo.hash).toEqual(hashPassword(password, fullUser?.authInfo.salt || ''));
  });

  it('creates manager if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);

    const email = 'manager@example.com';
    const password = '123';
    const role = UserRole.MANAGER;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await createUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).not.toEqual(admin.id);
    expect(returnedUser.email).toEqual(email);
    expect(returnedUser.role).toEqual(role);

    const fullUser = await UserService.getUserByEmail(returnedUser.email, true);
    expect(fullUser?.authInfo.hash).toEqual(hashPassword(password, fullUser?.authInfo.salt || ''));
  });

  it('cannot create user if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const email = 'user2@example.com';
    const password = '123';
    const role = UserRole.USER;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await createUser(mock.req, mock.res);
    }).rejects.toThrow('not allowed to create users');
  });

  it('cannot create admin if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const email = 'admin@example.com';
    const password = '123';
    const role = UserRole.ADMIN;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await createUser(mock.req, mock.res);
    }).rejects.toThrow('not allowed to create admins');
  });

  it('has useful message if email is invalid', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const email = 'no-at-symbol.com';
    const password = '123';
    const role = UserRole.ADMIN;
    const mock = httpMocks.createMocks<
      AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/users/user',
        body: {
          email,
          password,
          role,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await createUser(mock.req, mock.res);
    }).rejects.toThrow('email must be valid');
  });
});
