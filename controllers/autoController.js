const Auto = require('../models/Auto');
const multer = require('multer');
const { storage } = require('../config/cloudinary.config'); // Configuración de Cloudinary
const upload = multer({ storage }); // Middleware de multer configurado

// Exportar middleware para usar en rutas
exports.upload = upload;

// Obtener todos los autos
exports.obtenerAutos = async (req, res) => {
  try {
    const autos = await Auto.find();
    res.json(autos);
  } catch (error) {
    console.error('❌ Error al obtener los autos:', error.message);
    res.status(500).json({ error: 'Error al obtener los autos' });
  }
};

// Crear un nuevo auto
exports.crearAuto = async (req, res) => {
  try {
    const { marca, modelo, descripcion, precio } = req.body;
     // LOG DE DEPURACIÓN
    console.log('📥 Body:', req.body);
    console.log('📷 Archivos:', req.files);
    // Validar campos obligatorios
    if (!marca || !modelo || !precio) {
      return res.status(400).json({ error: 'Marca, modelo y precio son obligatorios' });
    }

    // Obtener URLs de imágenes subidas a Cloudinary
    const imagenes = req.files?.map(file => file.path) || [];

    const nuevoAuto = new Auto({
      marca,
      modelo,
      descripcion: descripcion || '',
      precio,
      imagenes,
      color,
      kilometraje,
      anio
    });

    await nuevoAuto.save();
    res.status(201).json({ mensaje: '✅ Auto creado exitosamente', auto: nuevoAuto });

  } catch (error) {
    console.error('❌ Error al crear el auto:', error.message);
    res.status(500).json({ error: 'Error al crear el auto' });
  }
};

// Alias para compatibilidad
exports.getAutos = exports.obtenerAutos;
