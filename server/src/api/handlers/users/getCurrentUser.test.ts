import {
  FullAuthenticatedRequest,
  TimelogSearchParams,
  TimelogsResponse,
  UsersResponse,
  AuthenticatedRequest,
  UserResponse,
} from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import moment from 'moment';
import httpMocks, { MockResponse } from 'node-mocks-http';
import * as TimelogService from 'services/timelogService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';
import { listUsers, getCurrentUser } from '.';

describe('getCurrentUser', () => {
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
    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UsersResponse>>(
      {
        method: 'GET',
        url: 'api/v1/users/user',
      },
      {},
    );

    const response = (await getCurrentUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    expect(response._getData()).toEqual('');
  });

  it('returns self', async () => {
    const user = await UserService.create('user@example.com', '123', UserRole.USER);

    const mock = httpMocks.createMocks<AuthenticatedRequest, Response<UserResponse>>(
      {
        method: 'GET',
        url: 'api/v1/users/user',
      },
      {},
    );
    mock.req.user = user;

    const response = (await getCurrentUser(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.id).toEqual(user.id);
  });
});
