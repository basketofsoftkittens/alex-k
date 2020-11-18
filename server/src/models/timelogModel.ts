import mongoose, { Schema, Document, Types } from 'mongoose';
import { User } from 'models/userModel';

const timelogSchema: Schema = new Schema(
  {
    description: String,
    date: Date,
    minutes: {
      type: Number,
      required: true,
      min: 0,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export interface Timelog extends Document {
  description: string;
  date: Date;
  minutes: number;
  user: Types.ObjectId | User;
}

export type PopulatedTimelog = Timelog & {
  user: User;
};

export function isPopulated(obj: User | Types.ObjectId): obj is User {
  const asUser = obj as User;
  return asUser.id && typeof asUser.id === 'string';
}

export default mongoose.model<Timelog>('Timelog', timelogSchema);
