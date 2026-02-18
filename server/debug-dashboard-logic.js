const prisma = require('./src/utils/prismaClient');

async function debugDashboardLogic() {
    try {
        const lastCompleted = await prisma.championship.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { updatedAt: 'desc' },
            include: {
                matches: {
                    where: { status: 'COMPLETED' },
                    orderBy: { startTime: 'desc' },
                    include: { homeTeam: true, awayTeam: true }
                }
            }
        });

        if (!lastCompleted) {
            console.log("No COMPLETED championships found.");
            return;
        }

        console.log(`\n--- Dashboard Logic Result ---`);
        console.log(`Championship: ${lastCompleted.name} (ID: ${lastCompleted.id})`);
        console.log(`UpdatedAt: ${lastCompleted.updatedAt}`);
        console.log(`Total Completed Matches: ${lastCompleted.matches.length}`);

        if (lastCompleted.matches.length > 0) {
            const finalMatch = lastCompleted.matches[0];
            console.log(`\n Identified 'Final' Match (Last by startTime):`);
            console.log(`  Match ID: ${finalMatch.id}`);
            console.log(`  StartTime: ${finalMatch.startTime}`);
            console.log(`  Result: ${finalMatch.homeTeam.name} ${finalMatch.homeScore} x ${finalMatch.awayScore} ${finalMatch.awayTeam.name}`);

            let winner;
            if (finalMatch.homeScore > finalMatch.awayScore) winner = finalMatch.homeTeam.name;
            else if (finalMatch.awayScore > finalMatch.homeScore) winner = finalMatch.awayTeam.name;
            else winner = "Draw (or Penalties)";

            console.log(`  Winner according to logic: ${winner}`);
        } else {
            console.log("No completed matches found in this championship.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

debugDashboardLogic();
