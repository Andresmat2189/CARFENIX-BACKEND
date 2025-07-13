const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 👉 Registro de usuario
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validar campos
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si el usuario ya existe
    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'cliente' // Valor por defecto: 'cliente'
    });

    await nuevoUsuario.save();
    res.status(201).json({ message: 'Usuario registrado correctamente', user: nuevoUsuario });

  } catch (error) {
    console.error('❌ Error en registro:', error.message);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

// 👉 Inicio de sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Generar token JWT con role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Expira en 1 hora
    );

    res.json({ token, role: user.role });

  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};
