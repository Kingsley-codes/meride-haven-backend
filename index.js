import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import vendorAuthRouter from './backend/routes/vendorAuthRoutes.js';
// import userRouter from './backend/routes/userRoutes.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;


app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_LOCALHOST
    ],
    credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data



try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected Successfully");
} catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
}


// Basic route for testing
app.get('/', (req, res) => {
    res.json({
        status: "success",
        message: "Welcome to Meride Haven API"
    });
});

// Routes
// app.use('/api/users/auth', userRouter);
app.use('/api/vendors/auth', vendorAuthRouter);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "error",
        message: "Internal server error"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
