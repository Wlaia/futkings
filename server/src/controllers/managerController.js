const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');

const createTeamManager = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { name, email, password } = req.body;

        // Verify if team exists
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Verify if team already has a manager
        if (team.managerId) {
            return res.status(400).json({ message: 'Team already has a manager assigned' });
        }

        // Verify if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // Check if user is already a manager of another team could be a rule, but let's keep simple: user exists with email.
            // If user exists, we might want to just link them if they don't have a role or team?
            // For now, let's assume we are creating a NEW user for the manager role.
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to create user and link to team
        const result = await prisma.$transaction(async (prisma) => {
            // Create User
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'MANAGER',
                },
            });

            // Update Team with managerId
            const updatedTeam = await prisma.team.update({
                where: { id: teamId },
                data: { managerId: user.id },
            });

            return { user, team: updatedTeam };
        });

        res.status(201).json({
            message: 'Manager created and assigned to team successfully',
            manager: { id: result.user.id, name: result.user.name, email: result.user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { createTeamManager };
