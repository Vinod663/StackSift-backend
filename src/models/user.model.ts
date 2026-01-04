import mongoose, { Schema, Document } from 'mongoose';

export enum Role {
   ADMIN="ADMIN",
   USER="USER"
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  role: Role[]; 
  bio?: string;
  coverGradient?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  avatarUrl: { type: String },
  role: { type: [String], enum: Object.values(Role), default: [Role.USER] },
  bio: { type: String },
  coverGradient: { type: String, default: 'default' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);