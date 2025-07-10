import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

let prisma: PrismaClient;

if (!globalForPrisma.prisma) {
    prisma = new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
    });

    console.log('✅ Prisma Client initialized');

    // Try connecting to DB and log status
    prisma
        .$connect()
        .then(() => {
            console.log('✅ Database connected successfully');
        })
        .catch((err) => {
            console.error('❌ Database connection failed:', err);
        });

    // Store in global to avoid re-instantiation
    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
    }
} else {
    prisma = globalForPrisma.prisma;
}

export default prisma;
