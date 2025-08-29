import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'; // Import cors
import routes from './routes';
import prisma from './prisma/prismaClient';

const app = express();
const PORT = process.env.PORT || 3100;

// Disable CORS by allowing all origins
app.use(
    cors({
        origin: "*", // Allow all origins
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"], // Allow all common headers
    })
);

app.use(express.json());
app.use('/api/v1', routes);

async function startServer() {
    try {
        console.log('🔄 Connecting to database...');
        await prisma.$connect();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Exit if DB connection fails
    }
}

startServer();