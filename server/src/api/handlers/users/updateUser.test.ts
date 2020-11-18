import {
  AuthenticatedRequest,
  TimelogResponse,
  UpdateTimelogBody,
  UpdateTimelogParams,
  UpdateUserBody,
  UserResponse,
  UpdateUserParams,
} from 'api/request';
import { Response } from 'express';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import { formatForApi } from 'services/chronoService';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { updateUser } from '.';
import expressCore from 'express-serve-static-core';

describe('updateUser', () => {
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

    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${user.id}`,
        params: {
          id: user.id,
        },
      },
      {},
    );

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('updates email and hours for self if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const updatedEmail = `user-updated@example.com`;
    const updatedHours = user.settings.preferredDailyHours;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${user.id}`,
        body: {
          email: updatedEmail,
          settings: {
            preferredDailyHours: updatedHours,
          },
        },
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(user.id);
    expect(returnedUser.email).toEqual(updatedEmail);
    expect(returnedUser.settings?.preferredDailyHours).toEqual(updatedHours);
  });

  it('updates hours to zero for self', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${user.id}`,
        body: {
          settings: {
            preferredDailyHours: 0,
          },
        },
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(user.id);
    expect(returnedUser.settings?.preferredDailyHours).toEqual(0);
  });

  it('cannot update hours to negative value', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const updatedHours = -1;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${user.id}`,
        body: {
          settings: {
            preferredDailyHours: updatedHours,
          },
        },
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await updateUser(mock.req, mock.res);
    }).rejects.toThrow(
      `User validation failed: settings.preferredDailyHours: Path \`settings.preferredDailyHours\` (${updatedHours}) is less than minimum allowed value (0).`,
    );
  });

  it('cannot update role for self if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const updatedRole = UserRole.MANAGER;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${user.id}`,
        body: {
          role: updatedRole,
        },
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await updateUser(mock.req, mock.res);
    }).rejects.toThrow(`role ${updatedRole} not found`);
  });

  it('cannot update role to admin for self if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const updatedRole = UserRole.ADMIN;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${manager.id}`,
        body: {
          role: updatedRole,
        },
        params: {
          id: manager.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    await expect(async () => {
      await updateUser(mock.req, mock.res);
    }).rejects.toThrow(`role ${updatedRole} not found`);
  });

  it('downgrades role for self if manager', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);

    const updatedRole = UserRole.USER;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${manager.id}`,
        body: {
          role: updatedRole,
        },
        params: {
          id: manager.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(manager.id);
    expect(returnedUser.role).toEqual(updatedRole);
  });

  it('downgrades role for self if admin', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);

    const updatedRole = UserRole.MANAGER;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${admin.id}`,
        body: {
          role: updatedRole,
        },
        params: {
          id: admin.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(admin.id);
    expect(returnedUser.role).toEqual(updatedRole);
  });

  it('downgrades role to user for self if admin', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);

    const updatedRole = UserRole.USER;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${admin.id}`,
        body: {
          role: updatedRole,
        },
        params: {
          id: admin.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(admin.id);
    expect(returnedUser.role).toEqual(updatedRole);
  });

  it('cannot update others if user role', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${otherUser.id}`,
        body: {
          email: 'user2-updated@example.com',
        },
        params: {
          id: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = user;

    await expect(async () => {
      await updateUser(mock.req, mock.res);
    }).rejects.toThrow(`no user with ID ${otherUser.id} found`);
  });

  it('updates email for other if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);

    const updatedEmail = 'user2-updated@example.com';
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${otherUser.id}`,
        body: {
          email: updatedEmail,
        },
        params: {
          id: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(otherUser.id);
    expect(returnedUser.email).toEqual(updatedEmail);
  });

  it('updates email for other if manager role', async () => {
    const manager = await UserService.create('manager@example.com', '123', UserRole.MANAGER);
    const otherUser = await UserService.create('user2@example.com', '123', UserRole.USER);

    const updatedEmail = 'user2-updated@example.com';
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${otherUser.id}`,
        body: {
          email: updatedEmail,
        },
        params: {
          id: otherUser.id,
        },
      },
      {},
    );
    mock.req.user = manager;

    const response = (await updateUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(otherUser.id);
    expect(returnedUser.email).toEqual(updatedEmail);
  });

  it('cannot update hours for others even if admin role', async () => {
    const admin = await UserService.create('admin@example.com', '123', UserRole.ADMIN);
    const user = await UserService.create('user2@example.com', '123', UserRole.USER);

    const updatedHours = 7;
    const mock = httpMocks.createMocks<AuthenticatedRequest<UpdateUserParams, UpdateUserBody>, Response<UserResponse>>(
      {
        method: 'POST',
        url: `api/v1/users/user/${user.id}`,
        body: {
          settings: {
            preferredDailyHours: updatedHours,
          },
        },
        params: {
          id: user.id,
        },
      },
      {},
    );
    mock.req.user = admin;

    await expect(async () => {
      await updateUser(mock.req, mock.res);
    }).rejects.toThrow('can only update your own settings');
  });
});
