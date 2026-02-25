const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function restore() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('❌ Please provide the backup file path. Example: node scripts/restore_db.js backups/backup-xxx.json');
        process.exit(1);
    }

    const filePath = path.isAbsolute(args[0]) ? args[0] : path.join(__dirname, '..', args[0]);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    console.log('♻️ Starting Database Restore...');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    try {
        // Caution: This reset is necessary to avoid unique constraint conflicts
        // but we delete in reverse order of dependencies
        console.log('🧨 Cleaning existing data...');
        await prisma.playerMatchStat.deleteMany();
        await prisma.championVote.deleteMany();
        await prisma.player.deleteMany();
        await prisma.match.deleteMany();
        await prisma.team.deleteMany();
        await prisma.championship.deleteMany();
        await prisma.user.deleteMany();

        console.log('📥 Importing records...');

        // Import in order of dependency
        if (data.users.length) await prisma.user.createMany({ data: data.users });
        if (data.championships.length) await prisma.championship.createMany({ data: data.championships });
        if (data.teams.length) await prisma.team.createMany({ data: data.teams });
        if (data.players.length) await prisma.player.createMany({ data: data.players });
        if (data.matches.length) await prisma.match.createMany({ data: data.matches });
        if (data.championVotes?.length) await prisma.championVote.createMany({ data: data.championVotes });
        if (data.playerMatchStats?.length) await prisma.playerMatchStat.createMany({ data: data.playerMatchStats });

        console.log('✅ Restore finished successfully!');

    } catch (error) {
        console.error('❌ Restore failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
