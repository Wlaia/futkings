const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const championship = await prisma.championship.findFirst({
            where: {
                name: 'Futkings 5x5 1 Edição'
            },
            include: {
                teams: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (championship) {
            console.log(JSON.stringify(championship, null, 2));
        } else {
            console.log('Championship not found');
            // Try searching with a partial name if not found
            const allChampionships = await prisma.championship.findMany({
                select: { name: true }
            });
            console.log('Available championships:', allChampionships.map(c => c.name));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
