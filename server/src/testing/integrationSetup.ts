import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { Connection } from 'mongoose';
import { connect } from 'services/dbService';
import { Server } from 'http';
import { serve } from '~/app';
import UserModel from 'models/userModel';
import TimelogModel from 'models/timelogModel';

export type AppState = {
  mongoServer: MongoMemoryServer;
  dbConn: Connection;
  app: Server;
  stop: () => Promise<void>;
  truncate: () => Promise<void>;
};

async function createIndexes() {
  // indexes are automatic but asynchronous so we manually ensure here
  await UserModel.createIndexes();
  await TimelogModel.createIndexes();
}

export async function launch(): Promise<AppState> {
  const mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  const dbConn = await connect(mongoUri);
  await createIndexes();
  const app = serve(8001, (port, err) => {
    if (err) {
      console.error(err);
    }
  });
  return {
    mongoServer,
    dbConn,
    app,
    truncate: async () => {
      try {
        await TimelogModel.collection.drop();
      } catch (e) {
        // ignore
      }
      try {
        await UserModel.collection.drop();
      } catch (e) {
        // ignore
      }
      await createIndexes();
    },
    stop: async () => {
      app.close();
      await dbConn.close();
      await mongoServer.stop();
    },
  };
}
