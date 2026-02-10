const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'PLAYER',
            },
        });

        res.status(201).json({ message: 'User registered successfully', userId: user.id, email: user.email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        console.error('Login error:', error);
        // Log masked DB URL and JWT Secret presence for debugging (do not log actual secrets)
        const dbUrl = process.env.DATABASE_URL ? 'Defined' : 'Undefined';
        const jwtSecret = process.env.JWT_SECRET ? 'Defined' : 'Undefined';
        console.error(`Debug Info - DB_URL: ${dbUrl}, JWT_SECRET: ${jwtSecret}`);

        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = { register, login };
