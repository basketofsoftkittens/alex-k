import HttpStatus from 'http-status-codes';
import { User } from 'models/userModel';
import { ApiError } from 'api/request';
import { create } from 'services/userService';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';

type RegisterArgs = {
  email: string;
  password: string;
};

export default async function handleRegister({ email, password }: RegisterArgs): Promise<User> {
  try {
    return await create(email, password);
  } catch (e) {
    const mongoError = e as MongoError;
    if (mongoError && mongoError.code === 11000) {
      // email is the only unique field on the User model
      throw new ApiError('email already exists', HttpStatus.CONFLICT);
    }
    const validationError = e as mongoose.Error.ValidationError;
    if (validationError.errors) {
      throw new ApiError(
        `Validation error on field(s): ${Object.keys(validationError.errors).sort()}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    throw e;
  }
}
