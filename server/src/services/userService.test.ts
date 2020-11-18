import { Connection } from 'mongoose';
import { connect } from 'services/dbService';
import { create } from 'services/userService';
import userModel from 'models/userModel';
import MongoMemoryServer from 'mongodb-memory-server-core';

describe('insert user', () => {
  let mongoServer: MongoMemoryServer;
  let conn: Connection;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    conn = await connect(mongoUri);
  });

  afterAll(async () => {
    await conn.close();
    await mongoServer.stop();
  });

  it('inserts user', async () => {
    const email = 'fake1@example.com';
    const newUser = await create(email, 'password123');

    expect(newUser.id).toBeTruthy();
    expect(newUser.email).toEqual(email);

    const queriedUser = await userModel.findOne({ email }).exec();
    expect(queriedUser?.id).toEqual(newUser.id);
  });
});
