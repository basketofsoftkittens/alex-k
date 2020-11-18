import { timelogBlueprint } from 'api/blueprints';
import handleCreateTimelog from 'api/handlers/timelogs/createTimelog';
import handleDeleteTimelog from 'api/handlers/timelogs/deleteTimelog';
import handleTimelogExport from 'api/handlers/timelogs/exportTimelogs';
import handleGetTimelog from 'api/handlers/timelogs/getTimelog';
import handleListTimelogs from 'api/handlers/timelogs/listTimelogs';
import handleUpdateTimelog from 'api/handlers/timelogs/updateTimelog';
import {
  ApiError,
  AuthenticatedRequest,
  CreateTimelogBody,
  DeleteTimelogParams,
  FullAuthenticatedRequest,
  SuccessResponse,
  TimelogResponse,
  TimelogSearchParams,
  TimelogsResponse,
  UpdateTimelogBody,
  UpdateTimelogParams,
  GetTimelogParams,
} from 'api/request';
import { Response } from 'express';
import expressCore from 'express-serve-static-core';
import HttpStatus from 'http-status-codes';
import { parseFromApi } from 'services/chronoService';

export async function listTimelogs(
  req: FullAuthenticatedRequest<expressCore.ParamsDictionary, unknown, TimelogSearchParams>,
  res: Response<TimelogsResponse>,
): Promise<Response<TimelogsResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  const populatedTimelogs = await handleListTimelogs({
    fromMoment: parseFromApi(req.query.fromDate),
    toMoment: parseFromApi(req.query.toDate)?.endOf('day'),
    authUser: req.user,
  });
  return res.json({
    numTimelogs: populatedTimelogs.length,
    timelogs: populatedTimelogs.map(log => timelogBlueprint(log)),
  });
}

export async function exportTimelogsHtml(
  req: FullAuthenticatedRequest<expressCore.ParamsDictionary, unknown, TimelogSearchParams>,
  res: Response<void>,
): Promise<void> {
  if (!req.user) {
    // prevented by middleware
    return;
  }
  const templateData = await handleTimelogExport({
    fromMoment: parseFromApi(req.query.fromDate),
    toMoment: parseFromApi(req.query.toDate)?.endOf('day'),
    authUser: req.user,
  });
  res
    .set({
      'Content-Type': 'text/html',
      'Content-Disposition': 'attachment; filename="time_records.html"',
    })
    .render('exportTimelogs', templateData);
}

export async function getTimelog(
  req: AuthenticatedRequest<GetTimelogParams, unknown>,
  res: Response,
): Promise<Response<TimelogResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  const populatedTimelog = await handleGetTimelog({
    logId: req.params.id,
    authUser: req.user,
  });
  return res.json(timelogBlueprint(populatedTimelog));
}

export async function createTimelog(
  req: AuthenticatedRequest<expressCore.ParamsDictionary, CreateTimelogBody>,
  res: Response<TimelogResponse>,
): Promise<Response<TimelogResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }

  const date = parseFromApi(req.body.date)?.toDate();
  if (!date) {
    throw new ApiError('date is required to create a timelog', HttpStatus.BAD_REQUEST);
  }
  const populatedTimelog = await handleCreateTimelog({
    description: req.body.description,
    minutes: req.body.minutes,
    date,
    userId: req.body.userId,
    authUser: req.user,
  });
  return res.json(timelogBlueprint(populatedTimelog));
}

export async function updateTimelog(
  req: AuthenticatedRequest<UpdateTimelogParams, UpdateTimelogBody>,
  res: Response<TimelogResponse>,
): Promise<Response<TimelogResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }

  const populatedTimelog = await handleUpdateTimelog({
    logId: req.params.id,
    assignedUserId: req.body.userId,
    description: req.body.description,
    date: parseFromApi(req.body.date)?.toDate(),
    minutes: req.body.minutes,
    authUser: req.user,
  });
  return res.json(timelogBlueprint(populatedTimelog));
}

export async function deleteTimelog(
  req: AuthenticatedRequest<DeleteTimelogParams, unknown>,
  res: Response<SuccessResponse>,
): Promise<Response<SuccessResponse>> {
  if (!req.user) {
    // prevented by middleware
    return res;
  }
  await handleDeleteTimelog({ logId: req.params.id, authUser: req.user });
  return res.json({ success: true });
}
