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
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['https://carfenix-frontend.vercel.app/'], // 🔴 reemplaza con tu dominio real de Vercel
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Esquema y modelo de Usuario
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});
const User = mongoose.model('User', userSchema);

// Crear usuario administrador por defecto
async function crearAdministrador() {
  const adminExiste = await User.findOne({ username: 'admin' });
  if (!adminExiste) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hashedPassword, role: 'admin' });
    console.log('👤 Usuario administrador creado (admin/admin123)');
  }
}
crearAdministrador();

// Middleware para verificar token JWT
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

// Middleware para permitir solo administradores
function soloAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  }
  next();
}

// Esquema y modelo de Auto
const autoSchema = new mongoose.Schema({
  marca: String,
  modelo: String,
  descripcion: String,
  precio: Number,
  imagenes: [String],
  color: String,
  kilometraje: Number,
  anio: Number
});
const Auto = mongoose.model('Auto', autoSchema);

// Registro de usuario
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

// Login de usuario
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, role: user.role });
});

// Obtener lista de autos
app.get('/api/autos', async (req, res) => {
  const { marca } = req.query;
  const autos = marca
    ? await Auto.find({ marca: { $regex: new RegExp(marca, 'i') } })
    : await Auto.find();
  res.json(autos);
});

// Subida de imágenes con Multer
const storage = multer.diskStorage({
  destination: 'public/images/',
  filename: (req, file, cb) => {
    const nombreArchivo = Date.now() + path.extname(file.originalname);
    cb(null, nombreArchivo);
  }
});
const upload = multer({ storage });

// Crear auto (solo admin)
app.post(
  '/api/autos',
  verificarToken,
  soloAdmin,
  upload.array('imagenes', 10),
  async (req, res) => {
    try {
      const { marca, modelo, descripcion, precio, color, kilometraje, anio } = req.body;
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
        imagenes: urlsImagenes,
        color,
        kilometraje,
        anio
      });

      const autoGuardado = await nuevoAuto.save();
      res.status(201).json(autoGuardado);
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: 'Error al guardar auto' });
    }
  }
);

// Obtener auto por ID
app.get('/api/autos/:id', async (req, res) => {
  const auto = await Auto.findById(req.params.id);
  res.json(auto);
});

// Actualizar auto (solo admin)
app.put('/api/autos/:id', verificarToken, soloAdmin, async (req, res) => {
  const autoActualizado = await Auto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(autoActualizado);
});

// Eliminar auto (solo admin)
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

// Manejo de errores de Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Campo rechazado por Multer:', err.field);
    return res.status(400).json({
      error: 'Error en subida de archivos',
      field: err.field,
      message: err.message
    });
  }
  next(err);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
});
