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

    // console.log("Prefijo desde INDEX CodigosQR: ", req.user);
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
        return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
    } else if (sufijo === gDinURL) {
        sufijoTexto = sufijo;
    } else if (sufijo !== req.query.sufijoURL) {
        // console.log("estoy en error general urlTemporal");
        return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
    };

    // console.log("Sufijo desde controller URLTEMPORAL gDinURL: ", gDinURL);
    // console.log("query Sufijo URLTEMPORAL sufijoURL: ", req.query.sufijoURL);


    let incorrecto = "";
    let error = "";
    let noExiste = "";
    let escondido = "";
    let escondidoBT = "";
    let escondidoFkey = "";
    let dni = "";
    let nombre = "";    
    let apellidos = "";
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
        dni = req.query.dniUser;        
        nombre = req.query.nombre;
        apellidos = req.query.apellidos;
        fichajeOK = req.query.fichajeOK;
        noUsuCert = req.query.noUsuCert;
        sufijoURL = req.query.sufijoURL;

        // console.log("Sufijo desde controller URLTEMPORAL dentro parámetros gDinURL: ", gDinURL);
        // console.log("query Sufijo URLTEMPORAL dentro parámetros sufijoURL: ", req.query.sufijoURL);


        return res.render('codigosQR/urlTemporal', { title: "URL para Fichajes", layout: "./layouts/layout-codigosQR", fecha, hora, incorrecto, error, noExiste, escondido, escondidoBT, escondidoFkey, dni, nombre, apellidos, fichajeOK, noUsuCert, dinamic: "", reloadQR: "", sufijoURL: req.query.sufijoURL });
    };
    res.render('codigosQR/urlTemporal', { title: "URL para Fichajes", layout: "./layouts/layout-codigosQR", fecha, hora, incorrecto: "", error: "", noExiste: "", escondido: "true", escondidoBT: "false", escondidoFkey: "true", dni: "", nombre: "", apellidos: "", fichajeOK: "", noUsuCert: "", dinamic: "", reloadQR: "true", sufijoURL: sufijoTexto });
};

/********************************************************************************************/

const auth = async (req, res) => {

    // console.log("Sufijo desde controller AUTH gDinURL: ", gDinURL);
    // console.log("body Sufijo desde controller AUTH sufijoURL: ", req.body.sufijoURL);


    const result = validationResult(req);

    if (!result.error) {

        const usuarioAuth = {
            dni: req.body.dni
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

            const queryTrab = await model.findByDniTrab(usuarioAuth.dni);            

            if (queryTrab) {

                // console.log("queryTRAB: ", queryTrab);

                // console.log("Clave generada en auth: ", req.user, "para el usuario: ", queryTrab.nombre, " ", queryTrab.apellidos, " para la sesión: ", req.body.sufijoURL);
                const dinKEYHash = await bcrypt.hash(req.user, 10);              
                
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                try {
                    const textoEmail =  req.user + " - QronosBOOK - CLAVE de UN SOLO USO para fichar - HORA: " + req.body.hora + " - DÍA: " + fechaStringDate;
                    const info = await transporter.sendMail({
                        from: "jcrm-costero@alwaysdata.net", 
                        to: queryTrab.email,
                        subject: "QRonosBOOK - Clave Temporal para Fichar fecha " + fechaStringDate,
                        text: textoEmail, 
                        html: `<div style="width: 100%; text-align: center; margin-bottom: 20px;">
                                    <img src="https://jcrm-costero.alwaysdata.net//images/logo04.png" style="display: block; margin: 0 auto; max-width: 200px; height: auto;">        
                                </div>
                                <div style="text-align: center; width: 100%;">
                                    <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">CLAVE de UN SOLO USO para fichar:</p>
                                    <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">${req.user}</p>
                                    <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">DÍA: ${fechaStringDate}</p>
                                    <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">HORA: ${req.body.hora}</p>
                                </div>`
                    });
                    // console.info(info); // información del envío del correo. Descomentar si hay error
                } catch (error) {
                    console.error("Error al enviar el correo:", error);
                    return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
                };

                return res.render('codigosQR/urlTemporal', { title: "URL para Fichajes", layout: "./layouts/layout-codigosQR", incorrecto: "true", error: "", noExiste: "", escondido: "true", escondidoBT: "true", escondidoFkey: "false", dni: queryTrab.dni, nombre: queryTrab.nombre, apellidos: queryTrab.apellidos, fecha: fechaAc, hora: req.body.hora, fichajeOK: "", noUsuCert: "", sufijoURL: req.body.sufijoURL, dinamic: dinKEYHash, reloadQR: "" });


            } else {
                return res.redirect(`/codigosQR/urlTemporal/${req.body.sufijoURL}?incorrecto=&error=&noExiste=true&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
            };

        } catch (error) {
            console.error("Error general de acceso:", error);
            return res.redirect(`/codigosQR/urlTemporal/${req.body.sufijoURL}?incorrecto=&error=true&noExiste=&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
        }
    } else {
        return res.redirect(`/codigosQR/urlTemporal/${req.body.sufijoURL}?incorrecto=&error=true&noExiste=&escondido=false&escondidoBT=false&escondidoFkey=true&noUsuCert=&reloadQR=&sufijoURL=${req.body.sufijoURL}`);
    };

};

/********************************************************************************************/

const checkKey = async (req, res) => {    

    const { sufijo } = req.params;

    // console.log("Sufijo desde controller CHECKKEY gDinURL: ", gDinURL);   
    // console.log("body Sufijo dentro CHECKKEY sufijo: ", sufijo);     

    if (gDinURL === undefined || !req.body?.sufijoURL || req.body.sufijoURL == "") {
        return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
    }  else if (sufijo !== req.body.sufijoURL) {
        // console.log("estoy en error general CHECKKEY");        
        return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
    };    

    const fechaActual = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fechaAc = fechaActual.toLocaleDateString('es-ES', opciones);
    
    // console.log("req.body: ", req.body);    

    const correcto = await bcrypt.compare(req.body.nombreKey, req.body.dinamic);       

    if (correcto) {

        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Enero es 0
        const dd = String(hoy.getDate()).padStart(2, '0');
        const fechaStringID = `${yyyy}${mm}${dd}`;
        const fechaStringDate = `${yyyy}-${mm}-${dd}`;
        let markToDay;

        try {
            const query = await modelMark.lastMark();
            if (query.length !== 0) {
                let lastFecha = query[0].date;
                lastFecha = new Date(lastFecha);

                const sonMismoDia =
                    hoy.getFullYear() === lastFecha.getFullYear() &&
                    hoy.getMonth() === lastFecha.getMonth() &&
                    hoy.getDate() === lastFecha.getDate();                

                if (sonMismoDia) {
                    const markToDayInt = query[0].id;
                    markForStr = markToDayInt.toString().slice(8);
                    markForInt = parseInt(markForStr, 10);
                    markForInt++;
                    markToDay = markForInt.toString().padStart(4, '0');
                } else {
                    markToDay = "0001";
                };

            } else {
                markToDay = "0001";
            };
        } catch (error) {
            console.error("Error al recuperar el último fichaje:", error);
            return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
        }

        const idStr = fechaStringID + markToDay;
        const idInt = parseInt(idStr, 10);

        const nuevoMarcaje = {
            id: idInt,
            dni: req.body.dniUser,            
            date: fechaStringDate,
            time: req.body.hora
        };

        // console.log(nuevoMarcaje);

        try {
            const result = await modelMark.store(nuevoMarcaje);

        } catch (error) {
            console.error("Error guardar el fichaje:", error);
            return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
        } 
        return res.redirect(`/codigosQR/urlTemporal/${req.body.sufijoURL}?incorrecto=true&error=&noExiste=&escondido=true&escondidoBT=true&escondidoFkey=true&dni=${req.body.dniUser}&nombre=${req.body.nombre}&apellidos=${req.body.apellidos}&fecha=${fechaAc}&hora=${req.body.hora}&fichajeOK=true&noUsuCert=&sufijoURL=${req.body.sufijoURL}&dinamic=&reloadQR=`);
    } else {

        return res.render('codigosQR/urlTemporal', { title: "Fichaje Erróneo", layout: "./layouts/layout-codigosQR", incorrecto: "true", error: "", noExiste: "", escondido: "true", escondidoBT: "true", escondidoFkey: "false", dni: req.body.dniUser, nombre: req.body.nombre, apellidos: req.body.apellidos, fecha: fechaAc, hora: req.body.hora, fichajeOK: "false", noUsuCert: "", sufijoURL: req.body.sufijoURL, dinamic: req.body.dinamic, reloadQR: "" });

    };

};

/********************************************************************************************/

const urlTemporalCert = async (req, res) => {

    const { sufijo } = req.params;

    // console.log("Sufijo desde controller urlTemporalCert gDinURL: ", gDinURL);   
    // console.log("query Sufijo dentro urlTemporalCert sufijoURL: ", req.query.sufijoURL);  

    if (gDinURL === undefined) {
        return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
    }  else if (sufijo !== req.query.sufijoURL) {
        // console.log("estoy en error general urlTemporalCert");
        return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
    };    

    if (req.user.datos.tag == "NoHayCertificado") {
        return res.status(401).render('codigosQR/cert_Empty', { title: "Certificado no proporcionado", layout: "./layouts/layout-codigosQR" });
    };
    
    if (req.user.datos.tag == "NoHayOCSP") {
        console.error('Error al procesar el certificado (OCSP):', req.user.datos.error);
        return res.status(400).render('codigosQR/cert_Error', { title: "Error al procesar el certificado", layout: "./layouts/layout-codigosQR", mensajeOCSP: req.user.datos.error });
    };

    if (req.user.datos.tag == "ErrorProceso") {
        console.error('Error al procesar el certificado:', req.user.datos.error);
        return res.status(400).render('codigosQR/cert_Error', { title: "Error al procesar el certificado", layout: "./layouts/layout-codigosQR" });
    };    

    const usuarioAuth = {
        dni: req.user.userCert.dni,
        nombre: req.user.userCert.nombreC,
        resultOCSP: req.user.userCert.resultOCSP
    };

    const fechaActual = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fechaAc = fechaActual.toLocaleDateString('es-ES', opciones);

    if (usuarioAuth.resultOCSP.valido) {

        try {

            const query = await model.findByDniTrab(usuarioAuth.dni);

            if (query) {

                const hoy = new Date();
                const yyyy = hoy.getFullYear();
                const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Enero es 0
                const dd = String(hoy.getDate()).padStart(2, '0');
                const fechaStringID = `${yyyy}${mm}${dd}`;
                const fechaStringDate = `${yyyy}-${mm}-${dd}`;
                let markToDay;

                try {
                    const query = await modelMark.lastMark();
                    if (query.length !== 0) {
                        let lastFecha = query[0].date;
                        lastFecha = new Date(lastFecha);

                        const yyyyBBDD = lastFecha.getFullYear();
                        const mmBBDD = String(lastFecha.getMonth() + 1).padStart(2, '0'); // Enero es 0
                        const ddBBDD = String(lastFecha.getDate()).padStart(2, '0');

                        const fechaBBDD = `${yyyyBBDD}-${mmBBDD}-${ddBBDD}`;

                        const sonMismoDia =
                            hoy.getFullYear() === lastFecha.getFullYear() &&
                            hoy.getMonth() === lastFecha.getMonth() &&
                            hoy.getDate() === lastFecha.getDate();

                        if (sonMismoDia) {
                            const markToDayInt = query[0].id;
                            markForStr = markToDayInt.toString().slice(8);
                            markForInt = parseInt(markForStr, 10);
                            markForInt++;
                            markToDay = markForInt.toString().padStart(4, '0');
                        } else {
                            markToDay = "0001";
                        };

                    } else {
                        markToDay = "0001";
                    };
                } catch (error) {
                    console.error("Error al recuperar el último fichaje:", error);
                    return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
                }

                const idStr = fechaStringID + markToDay;
                const idInt = parseInt(idStr, 10);

                const nuevoMarcaje = {
                    id: idInt,
                    dni: query.dni,
                    user: query.user,
                    date: fechaStringDate,
                    time: req.query.hora
                };

                // console.log(nuevoMarcaje);

                try {
                    const result = await modelMark.store(nuevoMarcaje);

                } catch (error) {
                    console.error("Error guardar el fichaje:", error);
                    return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
                }
                return res.redirect(`/codigosQR/urlTemporal/${req.query.sufijoURL}?incorrecto=true&error=&noExiste=&escondido=true&escondidoBT=true&escondidoFkey=true&nombre=&dni=&user=&fecha=${fechaAc}&hora=${req.query.hora}&fichajeOK=&noUsuCert=true&sufijoURL=${req.query.sufijoURL}&dinamic=&reloadQR=`);
            } else {
                return res.render('codigosQR/urlTemporal', { title: "Fichaje Erróneo", layout: "./layouts/layout-codigosQR", incorrecto: "true", error: "", noExiste: "True", escondido: "true", escondidoBT: "true", escondidoFkey: "true", nombre: "", dni: "", user: "", fecha: fechaAc, hora: req.query.hora, fichajeOK: "", noUsuCert: "false", sufijoURL: req.query.sufijoURL, dinamic: "", reloadQR: "" });

            };

        } catch (error) {
            console.error("Error general de acceso:", error);
            return res.render('codigosQR/errorGeneral', { title: "Fichajes: Error General", layout: "./layouts/layout-codigosQR" });
        };

    } else {
        console.error('Error al procesar el certificado (OCSP):', error);
        return res.status(400).render('codigosQR/cert_Error', { title: "Error al procesar el certificado", layout: "./layouts/layout-codigosQR", mensajeOCSP: usuarioAuth.resultOCSP.mensaje });
    };

};

/********************************************************************************************/

module.exports = {
    authQR,
    index,
    actualTime,
    urlTemporal,
    auth,
    checkKey,
    urlTemporalCert
};