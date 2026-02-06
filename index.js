require("dotenv").config(); // requerimos el módulo para leer las variables de entorno

const express = require("express");
const https = require('https'); // para HTTPS
const fs = require('fs');       // para HTTPS

const app = express();

const baseOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH + '/localhost+1-key.pem'), // para HTTPS
    cert: fs.readFileSync(process.env.SSL_KEY_PATH + '/localhost+1.pem'),     // para HTTPS    
}

const path = require("path");
const layouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = process.env.PORT;
const PORTSSL = process.env.PORTSSL;

app.use(cors()); // para habilitar el Intercambio de Recursos de Origen Cruzado
app.use(cookieParser(process.env.JWT_SECRET)); // para poder manejar cookies
app.use(express.urlencoded({ extended: false })); // para poder leer datos de formularios
app.use(express.json()); // para poder leer datos en formato JSON
app.use(methodOverride('_method')); // para soportar métodos PUT y DELETE desde formularios HTML

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use(layouts);
app.set("layout", "./layouts/layout-public"); // especificamos la ubicación del layout principal

app.use("/", require('./src/routers/main.router'));
app.use("/adminPanel", require('./src/routers/adminPanel.router'));
app.use("/trabPanel", require('./src/routers/trabPanel.router'));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

https.createServer(baseOptions, app).listen(PORTSSL, () => {
    console.log(`https://localhost:${PORTSSL}`);
});
