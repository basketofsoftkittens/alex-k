import httpMocks, { MockResponse } from 'node-mocks-http';
import { register } from 'api/handlers/auth';
import { UserResponse, UnauthenticatedRequest, AuthBody } from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import { generateToken } from 'services/jwtService';
import * as UserService from 'services/userService';
import { AppState, launch } from '~/testing/integrationSetup';

describe('register', () => {
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

  it('creates user', async () => {
    const email = 'fake1@example.com';
    const password = 'password123';

    const mock = httpMocks.createMocks<
      UnauthenticatedRequest<expressCore.ParamsDictionary, AuthBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/auth/register',
        body: {
          email,
          password,
        },
      },
      {},
    );

    const response = (await register(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.email).toEqual(email);
    expect(returnedUser.role).toEqual(UserRole.USER);
    expect(returnedUser.token).toEqual(generateToken(returnedUser.id));
  });

  it('has meaningful error if email is duplicate', async () => {
    const email = 'fake1@example.com';
    const password = 'password123';
    await UserService.create(email, password);

    const mock = httpMocks.createMocks<
      UnauthenticatedRequest<expressCore.ParamsDictionary, AuthBody>,
      Response<UserResponse>
    >(
      {
        method: 'PUT',
        url: 'api/v1/auth/register',
        body: {
          email,
          password,
        },
      },
      {},
    );

    await expect(async () => {
      await register(mock.req, mock.res);
    }).rejects.toThrow('email already exists');
  });
});
