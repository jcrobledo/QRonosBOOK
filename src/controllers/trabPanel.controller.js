const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const modelMark = require("../models/mark");
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
  const isHTMX = req.headers['hx-request'];

  if (isHTMX) {
    return res.render("partials/adminTrab/menu_inicio", {
      title: "Panel de Trabajadores",
      layout: false,
      userTrab
    });
  }

  return res.render("partials/adminTrab/menu_inicio", {
    title: "Panel de Trabajadores",
    layout: "./layouts/layout-trabPanel",
    userTrab
  });

};

/********************************************************************************************/

const listFichajesTrab = async (req, res) => {

  const userTrab = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const dniTrabajador = req.user.dni;
  const { dir, page } = req.query;

  const mesActual = new Date().toISOString().slice(0, 7); // mes actual YYYY-MM    
  let mesConsulta = req.query.fecha || mesActual;

  const [year, month] = mesConsulta.split('-').map(Number);
  const fechaAux = new Date(year, month - 1, 15);

  const fechaAnt = new Date(fechaAux);
  fechaAnt.setMonth(fechaAnt.getMonth() - 1);
  const mesAnterior = fechaAnt.toISOString().slice(0, 7);

  const fechaSig = new Date(fechaAux);
  fechaSig.setMonth(fechaSig.getMonth() + 1);
  const mesSiguiente = fechaSig.toISOString().slice(0, 7);

  const currentDir = dir || 'DESC';
  const currentPage = parseInt(page) || 1;
  const limit = 150;

  try {

    const trabajador = await model.findByDniTrab(dniTrabajador);
    const { fichajes, totalCount } = await modelMark.findMarkTrabMes({
      dni: dniTrabajador,
      mes: mesConsulta,
      dir: currentDir,
      limit: limit,
      offset: (currentPage - 1) * limit
    });

    const desde = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
    const hasta = Math.min(currentPage * limit, totalCount);

    const marcajesPorDia = fichajes.reduce((grupoPorFecha, fichaje) => {

      if (!grupoPorFecha[fichaje.date]) {
        grupoPorFecha[fichaje.date] = { fecha: fichaje.date, detalles: [] };
      }
      grupoPorFecha[fichaje.date].detalles.push({
        id: fichaje.id,
        dni: fichaje.dni,
        hora: fichaje.time,
        incidencia: fichaje.incidencia || ''
      });

      return grupoPorFecha;

    }, {});

    const fichajesFinales = Object.values(marcajesPorDia).map(dia => {

      const parejas = [];
      let totalMinutosDia = 0;

      for (let i = 0; i < dia.detalles.length; i += 2) {

        const entrada = dia.detalles[i];
        const salida = dia.detalles[i + 1] || { hora: '--:--', incidencia: '' };

        parejas.push({
          entrada: entrada,
          salida: salida
        });

        if (salida.hora !== '--:--') {
          const [hE, mE] = entrada.hora.split(':').map(Number);
          const [hS, mS] = salida.hora.split(':').map(Number);
          totalMinutosDia += (hS * 60 + mS) - (hE * 60 + mE);
        };

      };

      // Jornada de 7h = 420 min
      const diff = totalMinutosDia - 420;
      const horas = Math.floor(Math.abs(diff) / 60);
      const mins = Math.abs(diff) % 60;

      // Formato final: +00:15 o -01:30
      const saldoFormateado = `${diff >= 0 ? '+' : '-'}${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

      return {
        fecha: dia.fecha,
        parejas: parejas,
        saldo: saldoFormateado,
        esPositivo: diff >= 0,
        minutosPuros: diff // Guardamos esto para sumar el total luego
      };

    });

    // --- CÁLCULO DEL SALDO TOTAL DEL MES ---
    const totalMinutosMes = fichajesFinales.reduce((acc, dia) => acc + dia.minutosPuros, 0);
    const hT = Math.floor(Math.abs(totalMinutosMes) / 60);
    const mT = Math.abs(totalMinutosMes) % 60;
    const saldoTotalMes = `${totalMinutosMes >= 0 ? '+' : '-'}${String(hT).padStart(2, '0')}:${String(mT).padStart(2, '0')}`;

    if (isHTMX) {
      return res.render("partials/adminTrab/listaFichajesTrabMes", {
        title: "Listado Mensual de Fichajes",
        layout: false,
        userTrab,
        fichajes: fichajesFinales,
        saldoTotalMes,
        esTotalPositivo: totalMinutosMes >= 0,
        currentDir,
        currentPage,
        desde,
        hasta,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        dniTrabajador,
        trabajador,
        mesActual,
        mesAnterior,
        mesSiguiente,
        esMesActual: mesConsulta === mesActual,
        mesConsulta
      });
    }

    return res.render("partials/adminTrab/listaFichajesTrabMes", {
      title: "Listado Mensual de Fichajes",
      layout: "./layouts/layout-trabPanel",
      userTrab,
      fichajes: fichajesFinales,
      saldoTotalMes,
      esTotalPositivo: totalMinutosMes >= 0,
      currentDir,
      currentPage,
      desde,
      hasta,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      dniTrabajador,
      trabajador,
      mesActual,
      mesAnterior,
      mesSiguiente,
      esMesActual: mesConsulta === mesActual,
      mesConsulta
    });

  } catch (error) {
    console.error("Error general de acceso a BBDD:", error);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('trabPanel/errorGeneral', {
        title: "Error General",
        layout: false,
        userTrab
      });
    }
    return res.render("trabPanel/errorGeneral", {
      title: "Error General",
      layout: "./layouts/layout-trabPanel",
      userTrab
    });
  };

};

/********************************************************************************************/

const perfilTrab = async (req, res) => {

  const userTrab = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const dniTrabajador = req.user.dni;

  try {

    const trabajador = await model.findByDniTrab(dniTrabajador);
    const departamento = await model.findDepById(trabajador.departamento);
    const departamentoNombre = departamento[0].nombre;

    if (isHTMX) {
      return res.render("partials/adminTrab/perfilTrab", {
        title: "Perfil del Trabajador",
        layout: false,
        userTrab,
        trabajador,
        departamentoNombre
      });
    }

    return res.render("partials/adminTrab/perfilTrab", {
      title: "Perfil del Trabajador",
      layout: "./layouts/layout-trabPanel",
      userTrab,
      trabajador,
      departamentoNombre
    });

  } catch (error) {
    console.error("Error general de acceso a BBDD:", error);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('trabPanel/errorGeneral', {
        title: "Error General",
        layout: false,
        userTrab
      });
    }
    return res.render("trabPanel/errorGeneral", {
      title: "Error General",
      layout: "./layouts/layout-trabPanel",
      userTrab
    });
  };

};

/********************************************************************************************/

const cambiarPass = (req, res) => {

  const userTrab = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  if (isHTMX) {
    return res.render("partials/adminTrab/cambiarPass", {
      title: "Cambiar Contraseña",
      layout: false,
      userTrab
    });
  }

  return res.render("partials/adminTrab/cambiarPass", {
    title: "Cambiar Contraseña",
    layout: "./layouts/layout-trabPanel",
    userTrab
  });

};

/********************************************************************************************/

const changePass = async (req, res) => {

  const userTrab = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const dniTrabajador = req.user.dni;

  const passActual = req.body.passActual;
  const passNueva = req.body.passNueva;
  const passRepetir = req.body.passRepetir;

  try {

    const queryTrab = await model.findByDniTrab(dniTrabajador);
    const passOK = await bcrypt.compare(passActual, queryTrab.password);
    const passNuevaOK = passNueva === passRepetir;
    let mensajeERROR = "";
    let mensajeOK = "";    

    if (!passNuevaOK) {
      mensajeERROR = "Las contraseñas nuevas NO coinciden entre sí";
    };

    if (!mensajeERROR) {
      if (!passOK) {
        mensajeERROR = "La contraseña actual NO es correcta";
      }
    };

    if (mensajeERROR == "") {
      const hashedPass = await bcrypt.hash(passNueva, 10);
      await model.updatePassTrab(dniTrabajador, hashedPass);
      mensajeOK = "Contraseña CAMBIADA correctamente";
    };

    if (isHTMX) {
      return res.render("partials/adminTrab/cambiarPass", {
        title: "Cambiar Contraseña",
        layout: false,
        userTrab,
        mensajeERROR,
        mensajeOK,
        passActual,
        passNueva, 
        passRepetir
      });
    }

    return res.render("partials/adminTrab/cambiarPass", {
      title: "Cambiar Contraseña",
      layout: "./layouts/layout-trabPanel",
      userTrab,
      mensajeERROR,
      mensajeOK,
      passActual,
      passNueva, 
      passRepetir
    });

  } catch (error) {
    console.error("Error general de acceso a BBDD:", error);
    if (isHTMX) {
      res.setHeader('HX-Retarget', '#secContenido');
      return res.render('trabPanel/errorGeneral', {
        title: "Error General",
        layout: false,
        userTrab
      });
    }
    return res.render("trabPanel/errorGeneral", {
      title: "Error General",
      layout: "./layouts/layout-trabPanel",
      userTrab
    });
  };

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
  logout,
  listFichajesTrab,
  perfilTrab,
  cambiarPass,
  changePass
};