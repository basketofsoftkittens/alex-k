import httpMocks, { MockResponse } from 'node-mocks-http';
import { login } from 'api/handlers/auth';
import { UserResponse, AuthBody, UnauthenticatedRequest } from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import { UserRole } from 'models/userModel';
import * as UserService from 'services/userService';
import { generateToken } from 'services/jwtService';
import { launch, AppState } from '~/testing/integrationSetup';

describe('login', () => {
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

  it('logs user in', async () => {
    const email = 'fake1@example.com';
    const password = 'password123';
    const user = await UserService.create(email, password, UserRole.USER);

    const mock = httpMocks.createMocks<
      UnauthenticatedRequest<expressCore.ParamsDictionary, AuthBody>,
      Response<UserResponse>
    >(
      {
        method: 'POST',
        url: 'api/v1/auth/login',
        body: {
          email,
          password,
        },
      },
      {},
    );

    const response = (await login(mock.req, mock.res)) as MockResponse<Response<UserResponse>>;
    const returnedUser: UserResponse = response._getJSONData();
    expect(returnedUser.email).toEqual(user.email);
    expect(returnedUser.role).toEqual(user.role);
    expect(returnedUser.token).toEqual(generateToken(user.id));
  });
});
