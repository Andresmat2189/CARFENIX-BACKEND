require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

function verificarToken(req, res, next) {
  // Lee el token del header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ mensaje: 'Token inválido' });
    }

    // Agrega los datos del usuario al request para su uso posterior
    req.usuario = decoded;
    next();
  });
}

// Middleware adicional para validar si el usuario es administrador
function soloAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin };
