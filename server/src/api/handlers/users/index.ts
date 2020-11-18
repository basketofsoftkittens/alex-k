import { Response } from 'express';
import { userBlueprint } from 'api/blueprints';
import {
  AuthenticatedRequest,
  UsersResponse,
  UpdateUserBody,
  UpdateUserParams,
  UserResponse,
  SuccessResponse,
  DeleteUserParams,
  CreateUserBody,
} from 'api/request';
import handleListUsers from 'api/handlers/users/listUsers';
import handleGetUser from 'api/handlers/users/getUser';
import handleUpdateUser from 'api/handlers/users/updateUser';
import handleDeleteUser from 'api/handlers/users/deleteUser';
import expressCore from 'express-serve-static-core';
import handleCreateUser from './createUser';

export async function listUsers(
  req: AuthenticatedRequest,
  res: Response<UsersResponse>,
): Promise<Response<UsersResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  const users = await handleListUsers({ authUser: req.user });
  return res.json({
    numUsers: users.length,
    users: users.map(u => userBlueprint(u)),
  });
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response): Response<UserResponse> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  return res.json(userBlueprint(req.user));
}

export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<Response<UserResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  const user = await handleGetUser({ userId: req.params.id, authUser: req.user });
  return res.json(userBlueprint(user));
}

export async function createUser(
  req: AuthenticatedRequest<expressCore.ParamsDictionary, CreateUserBody>,
  res: Response<UserResponse>,
): Promise<Response<UserResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }

  const newUser = await handleCreateUser({
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    authUser: req.user,
  });
  return res.json(userBlueprint(newUser));
}

export async function updateUser(
  req: AuthenticatedRequest<UpdateUserParams, UpdateUserBody>,
  res: Response<UserResponse>,
): Promise<Response<UserResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  const user = await handleUpdateUser({
    userId: req.params.id,
    email: req.body.email,
    role: req.body.role,
    settings: req.body.settings,
    authUser: req.user,
  });
  return res.json(userBlueprint(user));
}

export async function updateSelf(
  req: AuthenticatedRequest<expressCore.ParamsDictionary, UpdateUserBody>,
  res: Response<UserResponse>,
): Promise<Response<UserResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  const user = await handleUpdateUser({
    userId: req.user.id,
    email: req.body.email,
    role: req.body.role,
    settings: req.body.settings,
    authUser: req.user,
  });
  return res.json(userBlueprint(user));
}

export async function deleteUser(
  req: AuthenticatedRequest<DeleteUserParams, unknown>,
  res: Response<SuccessResponse>,
): Promise<Response<SuccessResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  await handleDeleteUser({ userId: req.params.id, authUser: req.user });
  return res.json({ success: true });
}
