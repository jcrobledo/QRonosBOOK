require("dotenv").config(); // requerimos el módulo para leer las variables de entorno

const express = require("express");
const https = require('https'); // para HTTPS
const fs = require('fs');       // para HTTPS
const { Server } = require('socket.io');

const app = express();

const baseOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH + '/localhost+1-key.pem'), // para HTTPS
    cert: fs.readFileSync(process.env.SSL_KEY_PATH + '/localhost+1.pem'),     // para HTTPS    
}

const certOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH + '/localhost+1-key.pem'), // para HTTPS
    cert: fs.readFileSync(process.env.SSL_KEY_PATH + '/localhost+1.pem'),     // para HTTPS
    ca: [
        fs.readFileSync(process.env.SSL_KEY_PATH + '/AC_Raiz_FNMT-RCM_SHA256.pem'),
        fs.readFileSync(process.env.SSL_KEY_PATH + '/AC_FNMT_Usuarios.pem'),
        fs.readFileSync(process.env.SSL_KEY_PATH + '/AC RAIZ DNIE 2.pem'),
        fs.readFileSync(process.env.SSL_KEY_PATH + '/AC RAIZ DNIE.pem'),
        fs.readFileSync(process.env.SSL_KEY_PATH + '/chambersofcommerceroot-2016.pem'),
        fs.readFileSync(process.env.SSL_KEY_PATH + '/chambersofcommerceroot-2018.pem'),
        fs.readFileSync(process.env.SSL_KEY_PATH + '/chambersofcommerceroot2018.pem')        
    ],
    requestCert: true, // Solicita el certificado al cliente
    rejectUnauthorized: false // Rechaza si el certificado no es válido NORMALMENTE TRUE; si queremos tratar OCSP tiene que ser FALSE
}

const path = require("path");
const layouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORTSSL = process.env.PORTSSL;
const PORTSSL_X509 = process.env.PORTSSL_X509;

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
app.use("/codigosQR", require('./src/routers/codigosQR.router'));

const server = https.createServer(baseOptions, app);
const io = new Server(server);

io.on('connection', (socket) => {    
    socket.on('SolicitarRecargaQR', () => { // El servidor está "suscrito" a este evento que viene del navegador
        console.log('Conexión con dispositivo móvil realizada. Renovación QR solicitada.');         
        io.emit('EjecutarRecargaQR'); // El servidor reacciona emitiendo el evento a TODOS los demás
        console.log('QR renovado.');
    });
});

server.listen(PORTSSL, () => {
    console.log(`https://localhost:${PORTSSL}`);
});

https.createServer(certOptions, app).listen(PORTSSL_X509, () => {
    console.log(`https://localhost:${PORTSSL_X509}`);
});
