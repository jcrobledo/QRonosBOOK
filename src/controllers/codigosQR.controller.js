const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const model = require("../models/user");
const modelMark = require("../models/mark");
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const nodemailer = require("nodemailer");

let gDinURL;

/********************************************************************************************/

const authQR = async (req, res) => {

  const result = validationResult(req);  

  if (result.isEmpty()) {

    const usuarioAuth = {
      dni: req.body.dni,
      password: req.body.password,
    };

    try {

      const queryAdmin = await model.findByDniAdmin(usuarioAuth.dni);

      if (queryAdmin) {

        const queryTrab = await model.findByDniTrab(usuarioAuth.dni);

        const loginCorrecto = await bcrypt.compare(usuarioAuth.password, queryTrab.password);

        if (loginCorrecto) {          

          const token = jwt.sign(
            { dni: queryTrab.dni, nombre: queryTrab.nombre, apellidos: queryTrab.apellidos, QRs: true },
            process.env.JWT_SECRET            
          );

          const cookieOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo HTTP en === 'development'            
            path: "/",
          };

          res.cookie('authTokenQR', token, cookieOption);
          return res.redirect('/codigosQR');

        } else {
          res.cookie('flash_msg', 'Usuario o Contraseña INCORRECTOS', {
            signed: true,
            httpOnly: true,
            maxAge: 5000
          });          
          return res.redirect('/?callerForm=FQRs');
        };
      } else {
        res.cookie('flash_msg', 'El usuario NO existe o No tiene permisos de Administración', {
          signed: true,
          httpOnly: true,
          maxAge: 5000
        });        
        return res.redirect('/?callerForm=FQRs');
      };

    } catch (error) {
      console.error("Error general de acceso a BBDD:", error);
      res.cookie('flash_msg', 'Error de acceso a la Base de Datos. Inténtelo más tarde', {
        signed: true,
        httpOnly: true,
        maxAge: 5000
      });      
      return res.redirect('/?callerForm=FQRs');
    }
  } else {
    console.error("Error general Express-validator:", result);
    res.cookie('flash_msg', 'Credenciales NO válidas según formatos establecidos', {
      signed: true,
      httpOnly: true,
      maxAge: 5000
    });    
    return res.redirect('/?callerForm=FQRs');
  };

};

/********************************************************************************************/

const index = async (req, res) => {   

    console.log("Prefijo desde INDEX CodigoQR: ", req.user);    
    gDinURL = req.user;    

    try {
        const urlTemp = `https://192.168.31.100/codigosQR/urlTemporal/${req.user}`;

        const qrCodeBuffer = await QRCode.toBuffer(urlTemp, {
            errorCorrectionLevel: 'Q',
            type: 'image/png',
            margin: 1,
            width: 300
        });

        const qrBase64 = qrCodeBuffer.toString('base64'); // Convertir el buffer a Base64        
        const qrImageSrc = `data:image/png;base64,${qrBase64}`; // Crear el Data URI para la etiqueta <img> 

        const fechaActual = new Date();
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const fecha = fechaActual.toLocaleDateString('es-ES', opciones);

        const hora = fechaActual.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // true para formato AM/PM
        });

        res.render('codigosQR/index', { title: "Códigos QR", layout: "./layouts/layout-codigosQR", qrImageSrc, fecha, hora });

    } catch (error) {
        console.error("Error al generar el QR: ", error);
        return res.status(500).send("Error al generar el QR");

    };

};

/********************************************************************************************/

const actualTime = (req, res) => {
    const fechaActual = new Date();
    const hora = fechaActual.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // true para formato AM/PM
    });
    res.json({ hora });
};

/********************************************************************************************/

const urlTemporal = (req, res) => {        

    const { sufijo } = req.params;    
    
    let sufijoTexto;

    if (gDinURL === undefined) {
        return res.render('QRurlDin/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-mark" });
    } else if (sufijo === gDinURL) {          
        sufijoTexto = sufijo;
    } else if (sufijo !== req.query.sufijoURL) {
        console.log("estoy en error general urlTemporal");
        return res.render('QRurlDin/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-mark" });
    };    
    
    console.log("Sufijo desde controller URLTEMPORAL gDinURL: ", gDinURL);     
    console.log("query Sufijo URLTEMPORAL sufijoURL: ", req.query.sufijoURL);


    let incorrecto = "";
    let error = "";
    let noExiste = "";
    let escondido = "";
    let escondidoBT = "";
    let escondidoFkey = "";
    let nombre = "";
    let dni = "";
    let user = "";
    let fichajeOK = "";
    let noUsuCert = "";
    let sufijoURL = "";

    const fechaActual = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fecha = fechaActual.toLocaleDateString('es-ES', opciones);

    const hora = fechaActual.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // true para formato AM/PM
    });

    if (Object.keys(req.query).length > 0) {
        incorrecto = req.query.incorrecto;
        error = req.query.error;
        noExiste = req.query.noExiste;
        escondido = req.query.escondido;
        escondidoBT = req.query.escondidoBT;
        escondidoFkey = req.query.escondidoFkey;
        nombre = req.query.nombre;
        fichajeOK = req.query.fichajeOK;
        noUsuCert = req.query.noUsuCert;   
        sufijoURL = req.query.sufijoURL;
        
        console.log("Sufijo desde controller URLTEMPORAL dentro parámetros gDinURL: ", gDinURL);     
        console.log("query Sufijo URLTEMPORAL dentro parámetros sufijoURL: ", req.query.sufijoURL);


        return res.render('QRurlDin/urlTemporal', { title: "URL para Fichajes", layout: "./layouts/layout-mark", fecha, hora, incorrecto, error, noExiste, escondido, escondidoBT, escondidoFkey, nombre, dni, user, fichajeOK, noUsuCert, dinamic: "", reloadQR: "", sufijoURL: req.query.sufijoURL });
    };    
    res.render('QRurlDin/urlTemporal', { title: "URL para Fichajes", layout: "./layouts/layout-mark", fecha, hora, incorrecto: "", error: "", noExiste: "", escondido: "true", escondidoBT: "false", escondidoFkey: "true", nombre: "", dni: "", user: "", fichajeOK: "", noUsuCert: "", dinamic: "", reloadQR: "true", sufijoURL: sufijoTexto });
};

/********************************************************************************************/

const auth = async (req, res) => {

        console.log("Sufijo desde controller AUTH gDinURL: ", gDinURL);   
        console.log("body Sufijo desde controller AUTH sufijoURL: ", req.body.sufijoURL);
  

    const result = validationResult(req);    

    if (!result.error) {

        const usuarioAuth = {
            nombre: req.body.nombre,
            password: req.body.password,
        };

        const fechaActual = new Date();
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const fechaAc = fechaActual.toLocaleDateString('es-ES', opciones);

        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Enero es 0
        const dd = String(hoy.getDate()).padStart(2, '0');
        const fechaStringDate = `${dd}-${mm}-${yyyy}`;

        try {

            const query = await model.findById(usuarioAuth.nombre);

            if (query) {
                const loginCorrecto = await bcrypt.compare(usuarioAuth.password, query.password);

                if (loginCorrecto) {
                    
                    console.log("Clave generada en auth: ", req.user, "para el usuario: ", query.user, " para la sesión: ", req.body.sufijoURL);
                    const dinKEYHash = await bcrypt.hash(req.user, 10);                    

                    const textoEmail = "QronosBOOK - CLAVE de UN SOLO USO para fichar hoy " + fechaStringDate + " es: " + req.user;
                    const textoSubject = "QRonosBOOK - Clave Temporal para Fichar fecha " + fechaStringDate;

                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT,
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASS,
                        },
                    });

                    try {
                        const info = await transporter.sendMail({
                            from: "jcrm-costero@alwaysdata.net", // dirección de quien envía el formulario
                            to: query.email,
                            subject: textoSubject,
                            text: textoEmail, // plain‑text body
                            html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: darkblue; font-weight: bold;">${textoEmail}</p>`, // HTML body
                        });
                        // console.info(info); información del envío del correo. Descomentar si hay error
                    } catch (error) {
                        console.error("Error al enviar el correo:", error);
                        return res.render('QRurlDin/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-mark" });
                    };

                    return res.render('QRurlDin/urlTemporal', { title: "URL para Fichajes", layout: "./layouts/layout-mark", incorrecto: "true", error: "", noExiste: "", escondido: "true", escondidoBT: "true", escondidoFkey: "false", nombre: query.user, dni: query.dni, user: query.user, fecha: fechaAc, hora: req.body.hora, fichajeOK: "", noUsuCert: "", sufijoURL: req.body.sufijoURL, dinamic: dinKEYHash, reloadQR: "" });

                } else {
                    return res.redirect(`/codigoQR/urlTemporal/${req.body.sufijoURL}?incorrecto=true&error=&noExiste=&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
                };
            } else {
                return res.redirect(`/codigoQR/urlTemporal/${req.body.sufijoURL}?incorrecto=&error=&noExiste=true&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
            };

        } catch (error) {
            console.error("Error general de acceso:", error);
            return res.redirect(`/codigoQR/urlTemporal/${req.body.sufijoURL}?incorrecto=&error=true&noExiste=&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
        }
    } else {
        return res.redirect(`/codigoQR/urlTemporal/${req.body.sufijoURL}?incorrecto=&error=true&noExiste=&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
    };

};

/********************************************************************************************/


module.exports = {
    authQR,
    index,    
    actualTime,
    urlTemporal,
    auth
};