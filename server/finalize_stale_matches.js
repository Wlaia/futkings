const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const staleMatchIds = [
        'ede4b726-a571-4943-a724-c5d65ed38775', // Galáticos vs Kings FC
        '53dae518-ac13-4604-97c8-60b6d541c071'  // Voltaço Angra vs Neon City
    ];

    for (const id of staleMatchIds) {
        await prisma.match.update({
            where: { id },
            data: { status: 'COMPLETED' }
        });
        console.log(`Match ${id} finalized.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
