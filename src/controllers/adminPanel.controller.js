const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const model = require("../models/user");
const nodemailer = require("nodemailer");
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

      const queryAdmin = await model.findByDniAdmin(usuarioAuth.dni);

      if (queryAdmin) {

        const queryTrab = await model.findByDniTrab(usuarioAuth.dni);

        const loginCorrecto = await bcrypt.compare(usuarioAuth.password, queryTrab.password);

        if (loginCorrecto) {

          const token = jwt.sign(
            { dni: queryTrab.dni, nombre: queryTrab.nombre, apellidos: queryTrab.apellidos, admin: true },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
          );

          const cookieOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo HTTP en === 'development'
            maxAge: 1000 * 60 * 60, // Tiempo de vida de la cookie (1 hora) 1ms *60*60
            path: "/",
          };

          res.cookie('authTokenAdmin', token, cookieOption);
          return res.redirect('/adminPanel');

        } else {
          res.cookie('flash_msg', 'Usuario o Contraseña INCORRECTOS', {
            signed: true,
            httpOnly: true,
            maxAge: 5000
          });
          return res.redirect('/?callerForm=Fadmin');
        };
      } else {
        res.cookie('flash_msg', 'El usuario NO existe o No tiene permisos de Administración', {
          signed: true,
          httpOnly: true,
          maxAge: 5000
        });
        return res.redirect('/?callerForm=Fadmin');
      };

    } catch (error) {
      console.error("Error general de acceso a BBDD:", error);
      res.cookie('flash_msg', 'Error de acceso a la Base de Datos. Inténtelo más tarde', {
        signed: true,
        httpOnly: true,
        maxAge: 5000
      });
      return res.redirect('/?callerForm=Fadmin');
    }
  } else {
    console.error("Error general Express-validator:", result);
    res.cookie('flash_msg', 'Credenciales NO válidas según formatos establecidos', {
      signed: true,
      httpOnly: true,
      maxAge: 5000
    });
    return res.redirect('/?callerForm=Fadmin');
  };

};

/********************************************************************************************/

const adminPage = (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  if (isHTMX) {
    return res.render("partials/adminPanel/menu_inicio", {
      layout: false,
      userAdmin
    });
  }

  return res.render("partials/adminPanel/menu_inicio", {
    title: "Panel de Administración",
    layout: "./layouts/layout-adminPanel",
    userAdmin
  });

};

/********************************************************************************************/

const listTrabajadores = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  const { dni, nombre, apellidos, departamento, sort, dir, page } = req.query;
  const filtros = {
    dni: dni || '',
    nombre: nombre || '',
    apellidos: apellidos || '',
    departamento: departamento || ''
  };
  const currentSort = sort || 'dni';
  const currentDir = dir || 'ASC';
  const currentPage = parseInt(page) || 1;
  const limit = 8;

  try {
    const { trabajadores, totalCount } = await model.findAllTrab({
      filtros,
      sort: currentSort,
      dir: currentDir,
      limit: limit,
      offset: (currentPage - 1) * limit
    });
    const departamentos = await model.findAllDep();

    const departamentoMap = {};
    departamentos.forEach((departamento) => {
      departamentoMap[departamento.id] = departamento.nombre;
    });

    const desde = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
    const hasta = Math.min(currentPage * limit, totalCount);

    if (isHTMX) {
      return res.render("partials/adminPanel/listaTrabajadores", {
        layout: false,
        userAdmin,
        trabajadores,
        departamentoMap,
        filtros,
        currentSort,
        currentDir,
        currentPage,
        desde,
        hasta,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      });
    }

    return res.render("partials/adminPanel/listaTrabajadores", {
      title: "Gestión de Trabajadores",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      trabajadores,
      departamentoMap,
      filtros,
      currentSort,
      currentDir,
      currentPage,
      desde,
      hasta,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    console.error("Error general de acceso a BBDD:", error);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('adminPanel/errorGeneral', {
        title: "Error General",
        layout: false,
        userAdmin
      });
    }
    return res.render("adminPanel/errorGeneral", {
      title: "Error General",
      layout: "./layouts/layout-adminPanel",
      userAdmin
    });
  };

};

/********************************************************************************************/

const altaTrabajadores = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  try {

    const departamentos = await model.findAllDep();

    const departamentoMap = {};
    departamentos.forEach((departamento) => {
      departamentoMap[departamento.id] = departamento.nombre;
    });

    if (isHTMX) {
      return res.render("partials/adminPanel/altaTrabajadores", {
        layout: false,
        userAdmin,
        departamentoMap
      });
    }

    return res.render("partials/adminPanel/altaTrabajadores", {
      title: "Alta de Trabajadores",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      departamentoMap
    });

  } catch (error) {
    console.error("Error general de acceso a BBDD:", error);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('adminPanel/errorGeneral', {
        title: "Error General",
        layout: false,
        userAdmin
      });
    }
    return res.render("adminPanel/errorGeneral", {
      title: "Error General",
      layout: "./layouts/layout-adminPanel",
      userAdmin
    });
  };

};

/********************************************************************************************/

const createTrabajador = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  const result = validationResult(req);

  if (result.isEmpty()) {
    let nuevoTrabajador = {
      dni: req.body.dni,
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      departamento: req.body.departamento,
      email: req.body.email,
      password: req.body.password
    };

    try {

      const existeDni = await model.findByDniTrab(nuevoTrabajador.dni);

      if (!existeDni) {

        const passwordSendEmail = nuevoTrabajador.password;
        const departamento = await model.findDepById(nuevoTrabajador.departamento);
        const departamentoNombre = departamento[0].nombre;

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });   

        try {
          const textoEmail = "QronosBOOK - Nueva Alta en el Sistema Como Trabajador - Credenciales de Acceso DNI y Contraseña: " + passwordSendEmail;
          const info = await transporter.sendMail({
            from: "jcrm-costero@alwaysdata.net",
            to: nuevoTrabajador.email,
            subject: "QRonosBOOK - Nueva Alta en el Sistema Como Trabajador",
            text: textoEmail,
            html: `<div style="width: 100%; text-align: center; margin-bottom: 20px;">
                      <img src="https://jcrm-costero.alwaysdata.net//images/logo04.png" style="display: block; margin: 0 auto; max-width: 200px; height: auto;">        
                    </div>
                    <div style="text-align: center; width: 100%;">
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">${nuevoTrabajador.dni} - ${nuevoTrabajador.nombre} ${nuevoTrabajador.apellidos}</p>
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">Email: ${nuevoTrabajador.email}</p>
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">DEPARTAMENTO: ${departamentoNombre}</p>
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">CONTRASEÑA: ${passwordSendEmail}</p>
                    </div>`
          });
          // console.info(info); // información del envío del correo. Descomentar si hay error
        } catch (error) {
          console.error("Error Enviando Datos por Email al Trabajador: ", error);
          if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('adminPanel/errorSendMail', {
              title: "Error Enviando Email",
              layout: false,
              userAdmin
            });
          };
          return res.render("adminPanel/errorSendMail", {
            title: "Error Enviando Email",
            layout: "./layouts/layout-adminPanel",
            userAdmin
          });
        };

        nuevoTrabajador.password = await bcrypt.hash(nuevoTrabajador.password, 10);
        const trabajador = await model.createTrab(nuevoTrabajador);        

        const mensajeExito = `Trabajador creado correctamente.<br>Contraseña enviada a:<br>${nuevoTrabajador.email}`;             

        if (isHTMX) {
          return res.render('partials/adminPanel/confirmAltaTrab', {
            title: "Alta Trabajador",
            layout: false,
            userAdmin,
            nuevoTrabajador,
            departamentoNombre,
            mensajeExito
          });
        };

        return res.render("partials/adminPanel/confirmAltaTrab", {
          title: "Alta Trabajador",
          layout: "./layouts/layout-adminPanel",
          userAdmin,
          nuevoTrabajador,
          departamentoNombre,
          mensajeExito
        });

      } else {

        const departamento = await model.findDepById(existeDni.departamento);
        const departamentoNombre = departamento[0].nombre;
        nuevoTrabajador = existeDni;

        const mensajeError = "El DNI ya existe en QRonosBOOK.<br>Trabajador NO creado";

        if (isHTMX) {
          return res.render('partials/adminPanel/confirmAltaTrab', {
            title: "Error DNI Existente",
            layout: false,
            userAdmin,
            nuevoTrabajador,
            departamentoNombre,
            mensajeError
          });
        };
        return res.render("partials/adminPanel/confirmAltaTrab", {
          title: "Error DNI Existente",
          layout: "./layouts/layout-adminPanel",
          userAdmin,
          nuevoTrabajador,
          departamentoNombre,
          mensajeError
        });
      };

    } catch (error) {
      console.error("Error general de acceso a BBDD:", error);
      if (isHTMX) {
        res.setHeader('HX-Retarget', '#secContenido');
        return res.render('adminPanel/errorGeneral', {
          title: "Error General",
          layout: false,
          userAdmin
        });
      };
      return res.render("adminPanel/errorGeneral", {
        title: "Error General",
        layout: "./layouts/layout-adminPanel",
        userAdmin
      });
    };
  } else {
    console.error("Error general Express-validator:", result);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('adminPanel/errorValidacionDatos', {
        title: "Error de Validación",
        layout: false,
        userAdmin
      });
    }
    return res.render("adminPanel/errorValidacionDatos", {
      title: "Error de Validación",
      layout: "./layouts/layout-adminPanel",
      userAdmin
    });
  };

};

/********************************************************************************************/

const editarTrabajador = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const dniTrabajador = req.params.dni;

  try {

    const trabajador = await model.findByDniTrab(dniTrabajador);

    const departamentos = await model.findAllDep();
    const departamentoMap = {};
    departamentos.forEach((departamento) => {
    departamentoMap[departamento.id] = departamento.nombre;
    });

    if (isHTMX) {
      return res.render('partials/adminPanel/editarTrabajadores', {
        title: "Editar Trabajador",
        layout: false,
        userAdmin,
        trabajador,
        departamentoMap
      });
    };

    return res.render("partials/adminPanel/editarTrabajadores", {
      title: "Editar Trabajador",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      trabajador,
      departamentoMap
    });

  } catch (error) {

    console.error("Error general de acceso a BBDD:", error);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('adminPanel/errorGeneral', {
        title: "Error General",
        layout: false,
        userAdmin
      });
    };

    return res.render("adminPanel/errorGeneral", {
      title: "Error General",
      layout: "./layouts/layout-adminPanel",
      userAdmin
    });
  }
}

/********************************************************************************************/

const updateTrabajador = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  const result = validationResult(req);

  if (result.isEmpty()) {

    const dniTrabajador = req.params.dni;
    const trabajadorActualizado = {
      dni: dniTrabajador,
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      departamento: req.body.departamento,
      email: req.body.email,
      password: req.body.password
    };

    try {

      let mensajeExito = "Trabajador actualizado correctamente.";
      const departamento = await model.findDepById(trabajadorActualizado.departamento);
      const departamentoNombre = departamento[0].nombre;

      if (trabajadorActualizado.password) {

        trabajadorActualizado.password = await bcrypt.hash(trabajadorActualizado.password, 10);
        mensajeExito = `Trabajador actualizado correctamente.<br>Contraseña enviada a:<br>${trabajadorActualizado.email}`;       

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });  

        try {
          const textoEmail = "QronosBOOK - Modificación de Datos - Nueva Contraseña: " + req.body.password;
          const info = await transporter.sendMail({
            from: "jcrm-costero@alwaysdata.net",
            to: trabajadorActualizado.email,
            subject: "QRonosBOOK - Modificación de Datos - Contraseña Actualizada",
            text: textoEmail,
            html: `<div style="width: 100%; text-align: center; margin-bottom: 20px;">
                      <img src="https://jcrm-costero.alwaysdata.net//images/logo04.png" style="display: block; margin: 0 auto; max-width: 200px; height: auto;">        
                    </div>
                    <div style="text-align: center; width: 100%;">
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">${trabajadorActualizado.dni} - ${trabajadorActualizado.nombre} ${trabajadorActualizado.apellidos}</p>
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">Email: ${trabajadorActualizado.email}</p>
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">DEPARTAMENTO: ${departamentoNombre}</p>
                      <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">NUEVA CONTRASEÑA: ${req.body.password}</p>
                    </div>`
          });

          // console.info(info); // información del envío del correo. Descomentar si hay error
        } catch (error) {

          console.error("Error Enviando Datos por Email al Trabajador: ", error);
          if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('adminPanel/errorSendMail', {
              title: "Error Enviando Email",
              layout: false,
              userAdmin
            });
          };
          return res.render("adminPanel/errorSendMail", {
            title: "Error Enviando Email",
            layout: "./layouts/layout-adminPanel",
            userAdmin
          });
        };

      } else {
        delete trabajadorActualizado.password; 
      };      

      const trabajador = await model.updateTrab(trabajadorActualizado);      

      if (isHTMX) {    
        res.setHeader('HX-Replace-Url', '/adminPanel/trabajadores');     
        return res.render('partials/adminPanel/confirmEditTrab', {
          title: "Modificación Trabajador",
          layout: false,          
          userAdmin,
          trabajadorActualizado,      
          departamentoNombre,    
          mensajeExito
        });
      };

      return res.render("partials/adminPanel/confirmEditTrab", {
        title: "Modificación Trabajador",
        layout: "./layouts/layout-adminPanel",        
        userAdmin,
        trabajadorActualizado,     
        departamentoNombre,   
        mensajeExito
      });

    } catch (error) {
      console.error("Error general de acceso a BBDD:", error);
      if (isHTMX) {
        res.setHeader('HX-Retarget', '#secContenido');
        return res.render('adminPanel/errorGeneral', {
          title: "Error General",
          layout: false,
          userAdmin
        });
      }
      return res.render("adminPanel/errorGeneral", {
        title: "Error General",
        layout: "./layouts/layout-adminPanel",
        userAdmin
      });
    };

  } else {    
    console.error("Error general Express-validator:", result);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('adminPanel/errorValidacionDatos', {
        title: "Error de Validación",
        layout: false,
        userAdmin
      });
    }
    return res.render("adminPanel/errorValidacionDatos", {
      title: "Error de Validación",
      layout: "./layouts/layout-adminPanel",
      userAdmin
    });
  };

};

/********************************************************************************************/

const eliminarTrabajador = async (req, res) => {
};

/********************************************************************************************/

const deleteTrabajador = async (req, res) => {
};

/********************************************************************************************/

const logout = (req, res) => {

  const token = req.cookies.authTokenAdmin;

  if (token) {

    res.clearCookie('authTokenAdmin', {
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
  adminPage,
  listTrabajadores,
  altaTrabajadores,
  createTrabajador,
  editarTrabajador,
  updateTrabajador,
  eliminarTrabajador,
  deleteTrabajador,
  logout
};