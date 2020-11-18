import { User, UserRole } from 'models/userModel';
import { listUsers } from 'services/userService';

type ListUsersArgs = {
  authUser: User;
};

export default async function handleListUsers({ authUser }: ListUsersArgs): Promise<User[]> {
  if (authUser.role == UserRole.USER) {
    return [authUser];
  }

  if (authUser.role == UserRole.MANAGER) {
    return await listUsers({ role: { $in: [UserRole.USER, UserRole.MANAGER] } });
  }

  return await listUsers();
}
