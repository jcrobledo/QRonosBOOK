require("dotenv").config(); // requerimos el módulo para leer las variables de entorno

const express = require("express");

const app = express();

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private'); // No almacenar la página en caché ni en el historial
    res.set('Pragma', 'no-cache');  // Para compatibilidad con HTTP/1.0
    res.set('Expires', '0'); // Para compatibilidad con navegadores antiguos
    next();
});

const methodOverride = require("method-override");
const cors = require('cors');
const PORT = process.env.PORT;

app.use(cors()); // para habilitar el Intercambio de Recursos de Origen Cruzado
app.use(express.urlencoded({ extended: false })); // para poder leer datos de formularios
app.use(express.json()); // para poder leer datos en formato JSON
app.use(methodOverride('_method')); // para soportar métodos PUT y DELETE desde formularios HTML

app.get('/', (req, res) => {
  res.send('QRonosBOOK - Sistema de Control de Fichajes'); // Respuesta al cliente
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
