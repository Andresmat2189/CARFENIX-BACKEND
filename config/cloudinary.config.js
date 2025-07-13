require('dotenv').config(); // Asegura que cargue variables desde .env

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración segura usando variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true
});

// Configurar almacenamiento de multer para subir a Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'autos', // Carpeta en tu cuenta de Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Tipos permitidos
    transformation: [{ width: 800, height: 600, crop: 'limit' }] // Opcional: redimensionar
  },
});

module.exports = { cloudinary, storage };
