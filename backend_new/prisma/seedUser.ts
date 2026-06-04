import { PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(){
    const password = 'password';
    const hashedPassoword = await bcrypt.hash(password, 10);

    const testUser = await prisma.user.upsert({
        where: {email : 'test@example.com'},
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test Candidate',
            password: hashedPassoword,
            role: 'candidate',
            currentStep: 'info',
        },
    });
    
    console.log({testUser});
    console.log('Sample user created successfully');
}

main()
    .catch((e) => {
        console.log(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
