import express, { NextFunction, Response } from 'express';
import { login, logout, register } from 'api/handlers/auth';
import {
  listUsers,
  getCurrentUser,
  getUserById,
  updateSelf,
  updateUser,
  deleteUser,
  createUser,
} from 'api/handlers/users';
import {
  listTimelogs,
  exportTimelogsHtml,
  getTimelog,
  createTimelog,
  deleteTimelog,
  updateTimelog,
} from 'api/handlers/timelogs';
import HttpStatus from 'http-status-codes';
import { AuthenticatedRequest } from 'api/request';

const router = express.Router();

router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.put('/auth/register', register);

router.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      message: 'not logged in',
    });
  }
  next();
});

router.get('/users', listUsers);
router.get('/users/user', getCurrentUser);
router.put('/users/user', createUser);
router.post('/users/user', updateSelf);
router.get('/users/user/:id', getUserById);
router.post('/users/user/:id', updateUser);
router.delete('/users/user/:id', deleteUser);

router.get('/timelogs', listTimelogs);
router.get('/timelogs.html', exportTimelogsHtml);
router.put('/timelogs/timelog', createTimelog);
router.get('/timelogs/timelog/:id', getTimelog);
router.post('/timelogs/timelog/:id', updateTimelog);
router.delete('/timelogs/timelog/:id', deleteTimelog);

export default router;
