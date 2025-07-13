const express = require('express');
const router = express.Router();
const { obtenerAutos, crearAuto, upload } = require('../controllers/autoController');
const { verificarToken, soloAdmin } = require('../middlewares/auth'); // ✅ IMPORTA AMBOS

// Ruta pública para obtener autos
router.get('/', obtenerAutos);

/*
// Ruta protegida para crear auto (solo admin)
router.post('/autos', verificarToken, soloAdmin, upload.array('imagenes', 5), crearAuto); // ✅ AGREGA soloAdmin
*/

router.post('/autos',
  verificarToken,
  soloAdmin,
  (req, res, next) => {
    upload.array('imagenes', 5)(req, res, err => {
      if (err) {
        console.error('⚠️ Multer error:', err);
        return res.status(400).json({ mensaje: err.message });
      }
      next();
    });
  },
  crearAuto
);



module.exports = router;
