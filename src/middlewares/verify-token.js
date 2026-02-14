const jwt = require('jsonwebtoken');

/********************************************************************************************/

const verifyTokenAdmin = (req, res, next) => {
    
    const token = req.cookies.authTokenAdmin;        

    if (!token) {
        return res.render('adminPanel/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        if (!verified.admin) {
            return res.render('adminPanel/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
        }

        req.user = verified; // Adjunta el payload al request           
        next();
    } catch (err) {
        return res.render('adminPanel/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
    }

};

/********************************************************************************************/

const verifyTokenQR = (req, res, next) => {
    
    const token = req.cookies.authTokenQR;        

    if (!token) {
        return res.render('codigosQR/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        if (!verified.QRs) {
            return res.render('codigosQR/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
        }

        req.user = verified; // Adjunta el payload al request           
        next();
    } catch (err) {
        return res.render('codigosQR/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
    }

};

/********************************************************************************************/

const verifyTokenTrab = (req, res, next) => {
    
    const token = req.cookies.authTokenTrab;        

    if (!token) {
        return res.render('trabPanel/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        if (!verified.trab) {
            return res.render('trabPanel/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
        }

        req.user = verified; // Adjunta el payload al request           
        next();
    } catch (err) {
        return res.render('trabPanel/login_No_JWT', { title: "Acceso Denegado", layout: "./layouts/layout-public" });
    }

};

/********************************************************************************************/

module.exports = {
  verifyTokenAdmin,
  verifyTokenQR,
  verifyTokenTrab
};