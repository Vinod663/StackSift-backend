import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  websites: mongoose.Types.ObjectId[]; // Array of Website IDs
  createdAt: Date;
}

const CollectionSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  websites: [{ type: Schema.Types.ObjectId, ref: 'Website' }], // References the Website Model
}, { timestamps: true });

// Prevent duplicate folder names for the same user
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICollection>('Collection', CollectionSchema);