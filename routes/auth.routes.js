const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('config');
const router = Router();

// /api/auth/register
router.post(
  '/register',
  [
    check('email', 'Incorrect email').isEmail(),
    check('password', 'Min length 6 symbols').isLength({ min: 6 })
  ],
  async (request, response) => {
    try {
      const errors = validationResult(request);

      if (!errors.isEmpty()) {
        return response.status(400).json({
          errors: errors.array(),
          message: 'Incorrect data while register'
        });
      }

      const { email, password } = request.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        response.status(400).jsonp({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });

      await user.save();

      response.status(201).json({ message: 'User created' });

    } catch (e) {
      response.status(500).json({ message: 'Something went wrong, please, try again' });
    }
  }
);

// /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Incorrect email').normalizeEmail().isEmail(),
    check('password', 'Enter the password').exists(),
  ],
  async (request, response) => {
    try {
      const errors = validationResult(request);

      if (!errors.isEmpty()) {
        return response.status(400).json({
          errors: errors.array(),
          message: 'Incorrect data while login'
        });
      }

      const { email, password } = request.body;
      const user = await User.findOne({ email });

      if (!user) {
        return response.status(400).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return response.status(400).jsonp({ message: 'Incorrect password, please, try again' });
      }

      const token = jwt.sign(
        { userId: user.id },
        config.get('jwtSecret'),
        { expiresIn: '1h' }
      );

      response.json({ token, userId: user.id });

    } catch (e) {
      response.status(500).json({ message: 'Something went wrong, please, try again' });
    }
  }
);

module.exports = router;