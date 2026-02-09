const prisma = require('../utils/prismaClient');

const checkPublicPermission = async (teamId, permissionField) => {
    const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { isPublicLinkActive: true, [permissionField]: true }
    });

    if (!team) return false;
    if (!team.isPublicLinkActive) return false;
    return team[permissionField] === true;
};

const publicAddPlayer = async (req, res) => {
    const { id: teamId } = req.params;
    const { name, number, position, birthDate } = req.body;

    // Optional: Avatar URL logic
    let avatarUrl = req.body.avatarUrl || null;
    if (req.file) {
        avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    try {
        const allowed = await checkPublicPermission(teamId, 'publicCanAddPlayer');
        if (!allowed) {
            return res.status(403).json({ message: 'Ação não permitida via link público.' });
        }

        const player = await prisma.player.create({
            data: {
                name,
                number: parseInt(number),
                position,
                teamId,
                birthDate: birthDate ? new Date(birthDate) : null,
                avatarUrl // Optional
            }
        });
        res.status(201).json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar jogador.' });
    }
};

const publicUpdatePlayer = async (req, res) => {
    const { id: teamId, playerId } = req.params;
    const { name, number, position, birthDate } = req.body;

    let avatarUrl = req.body.avatarUrl || undefined;
    if (req.file) {
        avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    try {
        const allowed = await checkPublicPermission(teamId, 'publicCanEditPlayer'); // Covers edit/remove
        if (!allowed) {
            return res.status(403).json({ message: 'Ação não permitida via link público.' });
        }

        // Verify player belongs to team
        const playerExists = await prisma.player.findFirst({
            where: { id: playerId, teamId }
        });
        if (!playerExists) return res.status(404).json({ message: 'Jogador não encontrado neste time.' });

        const player = await prisma.player.update({
            where: { id: playerId },
            data: {
                name,
                number: number ? parseInt(number) : undefined,
                position,
                birthDate: birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : undefined,
                avatarUrl
            }
        });
        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar jogador.' });
    }
};

const publicRemovePlayer = async (req, res) => {
    const { id: teamId, playerId } = req.params;

    try {
        const allowed = await checkPublicPermission(teamId, 'publicCanEditPlayer'); // Covers edit/remove
        if (!allowed) {
            return res.status(403).json({ message: 'Ação não permitida via link público.' });
        }

        // Verify player belongs to team
        const playerExists = await prisma.player.findFirst({
            where: { id: playerId, teamId }
        });
        if (!playerExists) return res.status(404).json({ message: 'Jogador não encontrado neste time.' });

        await prisma.player.delete({
            where: { id: playerId }
        });
        res.json({ message: 'Jogador removido com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover jogador.' });
    }
};

module.exports = {
    publicAddPlayer,
    publicUpdatePlayer,
    publicRemovePlayer
};
