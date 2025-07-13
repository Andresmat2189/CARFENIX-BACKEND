const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Clave JWT desde .env
const JWT_SECRET = process.env.JWT_SECRET || 'clave_por_defecto_segura';

// 📌 Registro de usuario (rol forzado como 'cliente')
router.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(409).json({ mensaje: 'Correo ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      nombre,
      email,
      password: hashedPassword,
      rol: 'cliente', // 🚫 No permitir que llegue desde frontend
    });

    await user.save();
    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
});

// 📌 Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    const esValido = await bcrypt.compare(password, user.password);
    if (!esValido) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      usuario: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
});

module.exports = router;
