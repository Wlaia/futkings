
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:We021221%40%40%21%21@db.pzfzxlrdwxsezfelzsbr.supabase.co:5432/postgres",
        },
    },
});

async function checkMatches() {
    try {
        console.log("Fetching recent matches...");
        const matches = await prisma.match.findMany({
            take: 1,
            orderBy: { updatedAt: 'desc' },
            include: { homeTeam: true, awayTeam: true }
        });

        console.log("Found matches:", matches.length);
        matches.forEach(m => {
            console.log(`Match ${m.id}:`);
            console.log(JSON.stringify(m, null, 2));
            console.log('-----------------------------------');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkMatches();
