import UserModel, { User, UserRole } from 'models/userModel';
import crypto from 'crypto';
import { DocumentQuery, MongooseFilterQuery } from 'mongoose';

enum SortOrder {
  ASC = 1,
  DESC = -1,
}

function includeAuth<QueryHelpers>(
  query: DocumentQuery<User | null, User, QueryHelpers>,
  withAuth: boolean,
): DocumentQuery<User | null, User, QueryHelpers> {
  if (withAuth) {
    return query.select('+authInfo.salt +authInfo.hash');
  }
  return query;
}

export function hashPassword(password: string, salt: string): string {
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  return hash.digest('hex');
}

export async function getUserById(id: string): Promise<User | undefined> {
  return (await UserModel.findById(id).exec()) || undefined;
}

export async function getUserByEmail(email: string, withAuth = false): Promise<User | undefined> {
  return (await includeAuth(UserModel.findOne({ email }), withAuth).exec()) || undefined;
}

export async function userWithIdExists(id: string): Promise<boolean> {
  return await UserModel.exists({ id });
}

export async function userWithEmailExists(email: string): Promise<boolean> {
  return await UserModel.exists({ email });
}

export async function listUsers(
  query?: MongooseFilterQuery<Pick<User, '_id' | 'email' | 'role' | 'authInfo' | 'settings'>>,
): Promise<User[]> {
  return await UserModel.find(query || {})
    .sort({ created_at: SortOrder.ASC })
    .exec();
}

export async function deleteUserById(id: string): Promise<void> {
  await UserModel.findByIdAndDelete(id).exec();
}

export async function updateUser(
  id: string,
  fields: Partial<Pick<User, 'email' | 'role' | 'settings'>>,
): Promise<User | undefined> {
  const user = await getUserById(id);
  if (!user) {
    return undefined;
  }
  if (fields.email !== undefined) {
    user.email = fields.email;
  }
  if (fields.role !== undefined) {
    user.role = fields.role;
  }
  if (fields.settings?.preferredDailyHours !== undefined) {
    user.settings.preferredDailyHours = fields.settings.preferredDailyHours;
  }
  return await user.save();
}

export async function create(email: string, password: string, role?: UserRole): Promise<User> {
  const userSalt = crypto.randomBytes(32).toString('base64');
  return await UserModel.create({
    email,
    authInfo: {
      salt: userSalt,
      hash: hashPassword(password, userSalt),
    },
    settings: {},
    role: role || UserRole.USER,
  });
}
