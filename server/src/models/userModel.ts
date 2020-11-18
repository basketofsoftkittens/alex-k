import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

const userSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: UserRole,
      enum: Object.values(UserRole),
      required: true,
    },
    authInfo: {
      salt: { type: String, select: false },
      hash: { type: String, select: false },
    },
    settings: {
      preferredDailyHours: {
        type: Number,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

export type UserAuthInfo = {
  salt: string;
  hash: string;
};

export type UserSettings = {
  preferredDailyHours?: number;
};

export interface User extends Document {
  email: string;
  role: UserRole;
  authInfo: UserAuthInfo;
  settings: UserSettings;
}

export default mongoose.model<User>('User', userSchema);
