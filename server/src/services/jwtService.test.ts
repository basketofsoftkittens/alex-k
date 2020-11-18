import moment from 'moment';
import { generateToken, validateUserForToken } from 'services/jwtService';
import * as UserService from 'services/userService';
import { launch, AppState } from '~/testing/integrationSetup';

describe('jwtService.generateToken', () => {
  it('generates token', () => {
    expect(generateToken('abc123')).toBeTruthy();
  });
});

describe('jwtService.validateUserForToken', () => {
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

  it('validates valid token', async () => {
    const user = await UserService.create('user@example.com', '123');
    const token = generateToken(user.id);
    const retrievedUser = await validateUserForToken(token);
    expect(retrievedUser).toBeTruthy();
    expect(retrievedUser?.id).toEqual(user.id);
  });
  it('returns undefined for invalid token', async () => {
    const token = generateToken('some random string');
    const retrievedUser = await validateUserForToken(token);
    expect(retrievedUser).toBeUndefined();
  });
  it('returns undefined for token for nonexistent user', async () => {
    const user = await UserService.create('user@example.com', '123');
    const token = generateToken(user.id);
    await UserService.deleteUserById(user.id);
    const retrievedUser = await validateUserForToken(token);
    expect(retrievedUser).toBeUndefined();
  });
});
