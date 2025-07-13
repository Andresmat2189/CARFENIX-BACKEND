const bcrypt = require('bcrypt');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { cloudinary } = require('./config/cloudinary.config');
const SECRET_KEY = 'clave_secreta_segura';
const app = express();
const PORT = 3000;



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/auto_catalogo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Modelo Usuario
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});
const User = mongoose.model('User', userSchema);

// Crear administrador
async function crearAdministrador() {
  const adminExiste = await User.findOne({ username: 'admin' });
  if (!adminExiste) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashedPassword, role: 'admin' });
    console.log('👤 Usuario administrador creado (admin/admin123)');
  }
}
crearAdministrador();

// Middlewares
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ mensaje: 'Token inválido' });
    req.user = user;
    next();
  });
}

function soloAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  }
  next();
}

// Modelo Auto
const autoSchema = new mongoose.Schema({
  marca: String,
  modelo: String,
  descripcion: String,
  precio: Number,
  imagenes: [String], // ✅ Corregido: array de imágenes
  color: String,           // Nuevo
  kilometraje: Number,     // Nuevo
  anio: Number
});
const Auto = mongoose.model('Auto', autoSchema);

// Registro
app.post('/api/registro', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ mensaje: 'Faltan datos' });

  const existe = await User.findOne({ username });
  if (existe) return res.status(409).json({ mensaje: 'El usuario ya existe' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const nuevoUsuario = new User({ username, password: hashedPassword, role: 'cliente' });
  await nuevoUsuario.save();
  res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, role: user.role });
});

// Obtener autos
app.get('/api/autos', async (req, res) => {
  const { marca } = req.query;
  const autos = marca
    ? await Auto.find({ marca: { $regex: new RegExp(marca, 'i') } })
    : await Auto.find();
  res.json(autos);
});

// Subida de imágenes
const storage = multer.diskStorage({
  destination: 'public/images/',
  filename: (req, file, cb) => {
    const nombreArchivo = Date.now() + path.extname(file.originalname);
    cb(null, nombreArchivo);
  }
});
const upload = multer({ storage });

app.post(
  '/api/autos',
  verificarToken,
  soloAdmin,
  upload.array('imagenes', 10),  // acepta hasta 10 archivos en el campo 'imagenes'
  async (req, res) => {
    try {
      const { marca, modelo, descripcion, precio } = req.body;
      const urlsImagenes = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path);
          urlsImagenes.push(result.secure_url);
        }
      }

      const nuevoAuto = new Auto({
        marca,
        modelo,
        descripcion,
        precio,
        imagenes: urlsImagenes
      });

      const autoGuardado = await nuevoAuto.save();
      res.status(201).json(autoGuardado);
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: 'Error al guardar auto' });
    }
  }
);


// Obtener un solo auto por ID
app.get('/api/autos/:id', async (req, res) => {
  const auto = await Auto.findById(req.params.id);
  res.json(auto);
});

// Actualizar auto
app.put('/api/autos/:id', verificarToken, soloAdmin, async (req, res) => {
  const autoActualizado = await Auto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(autoActualizado);
});

// Eliminar auto
app.delete('/api/autos/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const auto = await Auto.findByIdAndDelete(req.params.id);
    if (!auto) return res.status(404).json({ mensaje: 'Auto no encontrado' });
    res.json({ mensaje: 'Auto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar auto' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
});
// Después de todas las rutas, agrega el manejador de errores:
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Campo rechazado por Multer:', err.field);
    return res.status(400).json({
      error: 'Error en subida de archivos',
      field: err.field,
      message: err.message
    });
  }
  next(err); // Deja que otros manejadores de error lo gestionen :contentReference[oaicite:1]{index=1}
});