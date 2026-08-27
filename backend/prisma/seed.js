import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('Password@123', 10);
    await prisma.user.upsert({
        where: { email: 'candidate@example.com' },
        update: {},
        create: {
            name: 'Demo candidate',
            email: 'candidate@example.com',
            password,
            role: 'candidate'
        }
    });

    await prisma.user.upsert({
        where: { email: 'hr@example.com' },
        update: {},
        create: {
            name: 'Demo HR',
            email: 'hr@example.com',
            password,
            role: 'hr'
        }
    });

    console.log('Seed complete');
}

main().catch((err) => {
    console.log(err);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});