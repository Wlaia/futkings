const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    console.log('📦 Starting Database Backup...');

    try {
        const data = {
            users: await prisma.user.findMany(),
            championships: await prisma.championship.findMany(),
            teams: await prisma.team.findMany(),
            players: await prisma.player.findMany(),
            matches: await prisma.match.findMany(),
            playerMatchStats: await prisma.playerMatchStat.findMany(),
            championVotes: await prisma.championVote.findMany(),
        };

        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        console.log(`✅ Backup saved to: ${backupFile}`);
        console.log(`📊 Total records:
- Users: ${data.users.length}
- Championships: ${data.championships.length}
- Teams: ${data.teams.length}
- Players: ${data.players.length}
- Matches: ${data.matches.length}
- PlayerMatchStats: ${data.playerMatchStats.length}
- Votes: ${data.championVotes.length}`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
