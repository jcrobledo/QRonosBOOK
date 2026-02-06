const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const model = require("../models/user");
const { validationResult } = require('express-validator');

/********************************************************************************************/

const auth = async (req, res) => {

  const result = validationResult(req);  

  if (result.isEmpty()) {

    const usuarioAuth = {
      dni: req.body.dni,
      password: req.body.password,
    };

    try {

      const queryTrab = await model.findByDniTrab(usuarioAuth.dni);

      if (queryTrab) {        

        const loginCorrecto = await bcrypt.compare(usuarioAuth.password, queryTrab.password);

        if (loginCorrecto) {          

          const token = jwt.sign(
            { dni: queryTrab.dni, nombre: queryTrab.nombre, apellidos: queryTrab.apellidos, trab: true },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
          );

          const cookieOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo HTTP en === 'development'
            maxAge: 1000 * 60 * 60, // Tiempo de vida de la cookie (1 hora) 1ms *60*60
            path: "/",
          };

          res.cookie('authTokenTrab', token, cookieOption);
          return res.redirect('/trabPanel');

        } else {
          res.cookie('flash_msg', 'Usuario o Contraseña INCORRECTOS', {
            signed: true,
            httpOnly: true,
            maxAge: 5000
          });          
          return res.redirect('/?callerForm=Ftrab');
        };
      } else {
        res.cookie('flash_msg', 'El usuario NO existe en QRonosBOOK', {
          signed: true,
          httpOnly: true,
          maxAge: 5000
        });        
        return res.redirect('/?callerForm=Ftrab');
      };

    } catch (error) {
      console.error("Error general de acceso a BBDD:", error);
      res.cookie('flash_msg', 'Error de acceso a la Base de Datos. Inténtelo más tarde', {
        signed: true,
        httpOnly: true,
        maxAge: 5000
      });      
      return res.redirect('/?callerForm=Ftrab');
    }
  } else {
    console.error("Error general Express-validator:", result);
    res.cookie('flash_msg', 'Credenciales NO válidas según formatos establecidos', {
      signed: true,
      httpOnly: true,
      maxAge: 5000
    });    
    return res.redirect('/?callerForm=Ftrab');
  };

};

/********************************************************************************************/

const trabPage = (req, res) => {  

  const userTrab = req.user.nombre + " " + req.user.apellidos;

  return res.render("trabPanel/trabPanel", { title: "Panel de Trabajadores", 
    layout: "./layouts/layout-trabPanel", userTrab  });

};

/********************************************************************************************/

const logout = (req, res) => {  

  const token = req.cookies.authTokenTrab;

  if (token) {

    res.clearCookie('authTokenTrab', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo HTTP en === 'development'
      maxAge: 1000 * 60 * 60, // Tiempo de vida de la cookie (1 hora) 1ms *60*60
      path: "/",
    });

    delete req.session; // Destruye la sesión

    res.cookie('flash_logout', 'Sesión cerrada CORRECTAMENTE', {
        signed: true,
        httpOnly: true,
        maxAge: 5000
    }); 

    return res.redirect('/');

  } else {
    delete req.session; // Destruye la sesión
    return res.redirect('/');
  };

};

/********************************************************************************************/

module.exports = {
  auth,
  trabPage,
  logout
};