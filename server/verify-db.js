const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to database...');
        await prisma.$connect();
        console.log('Successfully connected to the database!');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Connection verified. Users found:', users.length);
        if (users.length > 0) {
            console.log('Sample user ID:', users[0].id);
        }
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
