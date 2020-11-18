import { Response } from 'express';
import { userBlueprint } from 'api/blueprints';
import { UnauthenticatedRequest, AuthBody, UserResponse } from 'api/request';
import expressCore from 'express-serve-static-core';
import handleLogin from 'api/handlers/auth/login';
import handleRegister from 'api/handlers/auth/register';

export async function login(
  req: UnauthenticatedRequest<expressCore.ParamsDictionary, AuthBody>,
  res: Response<UserResponse>,
): Promise<Response<UserResponse>> {
  const user = await handleLogin({
    email: req.body.email,
    password: req.body.password,
  });
  return res.json(userBlueprint(user, { withToken: true }));
}

export function logout(_req: UnauthenticatedRequest, res: Response): Response<Pick<UserResponse, 'token'>> {
  return res.json({ token: undefined });
}

export async function register(
  req: UnauthenticatedRequest<expressCore.ParamsDictionary, AuthBody>,
  res: Response<UserResponse>,
): Promise<Response<UserResponse>> {
  const user = await handleRegister({
    email: req.body.email,
    password: req.body.password,
  });
  return res.json(userBlueprint(user, { withToken: true }));
}
