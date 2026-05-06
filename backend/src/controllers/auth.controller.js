// const bcrypt = require('bcryptjs');
// const { body } = require('express-validator');
// const prisma = require('../utils/prisma');
// const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

// // ── Validators ───────────────────────────────────────────────────────────────
// const signupValidators = [
//   body('name').trim().notEmpty().withMessage('Name is required'),
//   body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
// ];

// const loginValidators = [
//   body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
//   body('password').notEmpty().withMessage('Password is required'),
// ];

// // ── Controllers ──────────────────────────────────────────────────────────────
// const signup = async (req, res, next) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const existing = await prisma.user.findUnique({ where: { email } });
//     if (existing) return res.status(409).json({ error: 'Email already registered' });

//     const hashed = await bcrypt.hash(password, 12);
//     const user = await prisma.user.create({
//       data: { name, email, password: hashed, role: role || 'MEMBER' },
//       select: { id: true, name: true, email: true, role: true, createdAt: true },
//     });

//     const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
//     res.status(201).json({ user, ...tokens });
//   } catch (err) {
//     next(err);
//   }
// };

// const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(401).json({ error: 'Invalid email or password' });

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

//     const { password: _pw, ...userWithoutPw } = user;
//     const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
//     res.json({ user: userWithoutPw, ...tokens });
//   } catch (err) {
//     next(err);
//   }
// };

// const refresh = async (req, res, next) => {
//   try {
//     const { refreshToken } = req.body;
//     if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

//     const decoded = verifyRefreshToken(refreshToken);
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.id },
//       select: { id: true, email: true, role: true },
//     });
//     if (!user) return res.status(401).json({ error: 'User not found' });

//     const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
//     res.json(tokens);
//   } catch (err) {
//     return res.status(401).json({ error: 'Invalid or expired refresh token' });
//   }
// };

// const getMe = async (req, res, next) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: { id: true, name: true, email: true, role: true, createdAt: true },
//     });
//     if (!user) return res.status(404).json({ error: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = { signup, login, refresh, getMe, signupValidators, loginValidators };



const prisma = require('../utils/prisma');
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    // check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "MEMBER"
      }
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      error: "Signup failed",
      details: error.message
    });
  }
};

module.exports = { signup };