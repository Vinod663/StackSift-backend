import mongoose, { Schema, Document } from 'mongoose';

export enum Role {
   ADMIN="ADMIN",
   USER="USER"
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  role: Role[]; // Note: You named this "role" (singular)
  bio?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String },
  role: { type: [String], enum: Object.values(Role), default: [Role.USER] },
  bio: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);