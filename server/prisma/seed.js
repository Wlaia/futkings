const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './server/.env' });
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Delete existing data (Optional, but good for clean state if needed, but maybe dangerous if user has data he wants to keep. 
    // User asked to "create", not "reset". I will just append or check if exists.
    // actually, let's just create them. If they exist, it might fail if unique constraints are hit, but names are likely unique enough for this test.)

    const teamsData = [
        {
            name: 'Kings FC',
            logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KingsFC',
            players: [
                { name: 'Arthur Pendragon', number: 1, position: 'GOALKEEPER' },
                { name: 'Lancelot du Lac', number: 10, position: 'FIELD' },
                { name: 'Gawain Orkney', number: 7, position: 'FIELD' },
                { name: 'Percival Pellinore', number: 8, position: 'FIELD' },
                { name: 'Bors de Ganis', number: 5, position: 'FIELD' },
                { name: 'Galahad', number: 9, position: 'FIELD' },
            ]
        },
        {
            name: 'Iron Wolves',
            logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=IronWolves',
            players: [
                { name: 'Fenrir Greyback', number: 1, position: 'GOALKEEPER' },
                { name: 'Logan Howlett', number: 99, position: 'FIELD' },
                { name: 'Scott McCall', number: 11, position: 'FIELD' },
                { name: 'Remus Lupin', number: 6, position: 'FIELD' },
                { name: 'Sirius Black', number: 14, position: 'FIELD' },
                { name: 'Jacob Black', number: 3, position: 'FIELD' },
            ]
        },
        {
            name: 'Neon City',
            logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=NeonCity',
            players: [
                { name: 'Tron Legacy', number: 1, position: 'GOALKEEPER' },
                { name: 'Johnny Silverhand', number: 20, position: 'FIELD' },
                { name: 'David Martinez', number: 77, position: 'FIELD' },
                { name: 'Lucy Kushinada', number: 10, position: 'FIELD' },
                { name: 'Kaneda Shotaro', number: 8, position: 'FIELD' },
                { name: 'Testuo Shima', number: 4, position: 'FIELD' },
            ]
        },
        {
            name: 'Storm Breakers',
            logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=StormBreakers',
            players: [
                { name: 'Thor Odinson', number: 1, position: 'GOALKEEPER' },
                { name: 'Zeus Thunder', number: 10, position: 'FIELD' },
                { name: 'Raiden God', number: 7, position: 'FIELD' },
                { name: 'Storm Ororo', number: 8, position: 'FIELD' },
                { name: 'Pikachu', number: 25, position: 'FIELD' },
                { name: 'Enel Skypiea', number: 5, position: 'FIELD' },
            ]
        }
    ];

    for (const teamData of teamsData) {
        const team = await prisma.team.create({
            data: {
                name: teamData.name,
                logoUrl: teamData.logoUrl,
                players: {
                    create: teamData.players.map(p => ({
                        name: p.name,
                        number: p.number,
                        position: p.position,
                        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name.replace(/\s+/g, '')}`
                    }))
                }
            }
        });
        console.log(`✅ Created team: ${team.name}`);
    }

    console.log('🚀 Seed finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
