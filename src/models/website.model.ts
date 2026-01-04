import mongoose, { Schema, Document } from 'mongoose';

//TypeScript Interface 
export interface IWebsite extends Document {
  title: string;
  url: string;
  domain: string;           // e.g., "figma.com"
  description: string;
  category: string;
  tags: string[];
  screenshotUrl?: string;   
  addedBy?: mongoose.Types.ObjectId; // Link to the User who added it
  approved: boolean;        // For Admin moderation
  upvotes: mongoose.Types.ObjectId[];
  views: number;
  
  //AI Fields 
  aiSummary?: string;
  aiCategories?: string[];
  aiKeywords?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

//Mongoose Schema
const WebsiteSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, unique: true },
  domain: { type: String }, 
  description: { type: String, required: true },
  category: { type: String, default: 'Uncategorized' },
  tags: { type: [String], default: [] },
  
  screenshotUrl: { type: String },
  
  // Relationship to User 
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' }, 
  
  // Status Fields
  approved: { type: Boolean, default: false }, // Default: Pending approval
  upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },

  // AI Generated Data
  aiSummary: { type: String },
  aiCategories: { type: [String] },
  aiKeywords: { type: [String] },

  // createdAt: { type: Date, default: Date.now },
  // updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Export
export default mongoose.model<IWebsite>('Website', WebsiteSchema);