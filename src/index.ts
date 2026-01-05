import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import postRoutes from './routes/post.routes';
import authRoutes from './routes/auth.routes';
import collectionRoutes from './routes/collection.routes';
import contactRoutes from './routes/contact.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const SERVER_PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI as string

const app = express()



app.use(express.json())


app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5175', 'https://stacksift-frontend.vercel.app'],           
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  
    credentials: true // Allow cookies and authentication headers
    
})) 


// Routes
// Root route for health check
//http://localhost:4000/
app.get('/', (req, res) => {
  res.status(200).json({
    message: "StackSift API is running successfully!",
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/post', postRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/contact', contactRoutes);


app.use('/api/v1/user', userRoutes);


mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 45000
})
.then(() => {
        console.log("Connected to MongoDB")
    }
)
.catch((error) => {-
    console.error("Error connecting to MongoDB:", error)
    process.exit(1)//exit the application with failure code
})



app.listen(SERVER_PORT, () => {
  console.log("Server is running on port " + SERVER_PORT)
})
