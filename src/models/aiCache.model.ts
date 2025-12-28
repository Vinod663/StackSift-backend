import mongoose, { Schema, Document } from 'mongoose';

export interface IAiCache extends Document {
  query: string; // The search term, e.g., "crop image"
  results: any[]; // The JSON list the AI returned
  createdAt: Date;
}

const AiCacheSchema: Schema = new Schema({
  query: { type: String, required: true, unique: true, lowercase: true, trim: true },
  results: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete after 7 days (optional)
});

export default mongoose.model<IAiCache>('AiCache', AiCacheSchema);