export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export type UserSettings = {
  preferredDailyHours?: number;
};

export type User = {
  id: string;
  email: string;
  role: UserRole;
  settings?: UserSettings;
};
