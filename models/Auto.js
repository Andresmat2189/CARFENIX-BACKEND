const mongoose = require('mongoose');

const autoSchema = new mongoose.Schema({
  marca: String,
  modelo: String,
  descripcion: String,
  precio: Number,
  kilometraje: Number,
  imagenes: [String],
  color: String,           // Nuevo
  kilometraje: Number,     // Nuevo
  anio: Number
});

module.exports = mongoose.model('Auto', autoSchema);
