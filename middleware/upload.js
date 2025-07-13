const multer = require('multer');
const { storage } = require('../cloudinary.config');
const upload = multer({ storage });

module.exports = upload;
