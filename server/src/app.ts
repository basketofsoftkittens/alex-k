import express, { Response, Request, NextFunction } from 'express';
import 'express-async-errors';
import bodyParser from 'body-parser';
import routes from 'api/routes';
import { AuthenticatedRequest, ApiError } from 'api/request';
import { validateUserForToken } from 'services/jwtService';
import HttpStatus from 'http-status-codes';
import path from 'path';
import cors from 'cors';
import rootRoutes from 'api/rootRoutes';
import { Server } from 'http';

function defaultCallback(port: number, err: Error) {
  if (err) {
    console.error(err);
  } else {
    console.log(`Server is listening on ${port}`);
  }
}

export const serve = (port: number, callback?: (err: Error, html: string) => void): Server => {
  const app = express();

  app.set('views', path.join(__dirname, '/views'));
  app.set('view engine', 'pug');

  app.use(cors());

  app.use(async (req: AuthenticatedRequest, res, next) => {
    if (req.headers.authorization) {
      try {
        const pieces = req.headers.authorization.split(' ');
        req.user = await validateUserForToken(pieces[1]);
      } catch (e) {
        // ignore
      }
    } else if (req.query.token) {
      req.user = await validateUserForToken(`${req.query.token}`);
    }

    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use('/', rootRoutes);
  app.use('/api/v1', routes);

  app.use((error: Error, _req: Request, res: Response, next: NextFunction) => {
    console.error(error.stack);

    const apiError = error as ApiError;
    if (apiError.httpStatus) {
      res.status(apiError.httpStatus).json({ message: apiError.message });
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
      });
    }

    next();
  });

  return app.listen(port, (err, html) => {
    if (callback) {
      callback(err, html);
    } else {
      defaultCallback(port, err);
    }
  });
};
