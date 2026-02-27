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
  logout
};