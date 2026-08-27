// Entry point: connects to Prisma, starts the HTTP server, and handles graceful shutdown.
import dotenv from 'dotenv';
import app from './index.js';
import prisma from './db/prisma.js';

dotenv.config();

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    await prisma.$connect();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Closing server....`);

      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.log('Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();