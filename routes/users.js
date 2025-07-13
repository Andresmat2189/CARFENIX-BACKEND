const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.post('/register', UserController.register);
router.post('/login', UserController.login);

router.post('/registro', async (req, res) => {
  try {
    const { email, password, rol } = req.body;
    const nuevoUsuario = new Usuario({ email, password, rol });
    await nuevoUsuario.save();
    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'Error al registrar usuario' });
  }
});

module.exports = router;
