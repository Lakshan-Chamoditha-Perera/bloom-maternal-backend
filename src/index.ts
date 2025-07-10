import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import routes from './routes';
import prisma from './prisma/prismaClient';

const app = express();
const PORT = process.env.PORT || 3000;

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
        process.exit(1); // Exit if DB connection fails
    }
}

startServer();
