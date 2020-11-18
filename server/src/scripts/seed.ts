import { create } from 'services/userService';
import { UserRole } from 'models/userModel';
import { connect } from 'services/dbService';

const password = 'password';

const data: { [email: string]: UserRole } = {
  'admin@example.com': UserRole.ADMIN,
  'manager@example.com': UserRole.MANAGER,
  'user@example.com': UserRole.USER,
};

async function seedUsers(mongoUrl: string) {
  const conn = await connect(mongoUrl);
  try {
    await Promise.all(
      Object.keys(data).map(async email => {
        console.log(`Seeding ${data[email]}: ${email} / ${password}`);
        await create(email, 'password', data[email]);
      }),
    );
  } catch (e) {
    console.error(e);
  } finally {
    if (conn) {
      conn.close();
    }
  }
}

if (!process.env.MONGO_URL) {
  console.error('Missing MONGO_URL env variable');
} else {
  console.log('Seeding users...');
  seedUsers(process.env.MONGO_URL);
}
