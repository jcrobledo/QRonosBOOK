const model = require("../models/mark");
const modelTrab = require("../models/user");
const nodemailer = require("nodemailer");

/********************************************************************************************/

const listFichajes = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD y sin desfases zona horaria, útil para SQL

  const fechaQuery = req.query.fecha;
  let fechConsulta = Array.isArray(fechaQuery) ? fechaQuery[0] : (fechaQuery || hoy); // porque fecha viene por req.query y req.body para filtros y ordenación  
  if (!fechConsulta || fechConsulta === "") {  // si el picker Calendar viene vacío porque se borra con el bóton estándar
    fechConsulta = hoy;
  }
  const fechActual = new Date(fechConsulta + 'T00:00:00'); // T00:00:00 para evitar desfases zona horaria

  const fechAnt = new Date(fechActual);
  fechAnt.setDate(fechAnt.getDate() - 1);
  const diaAnterior = fechAnt.toLocaleDateString('en-CA'); // Mantiene día correcto del SERVIDOR y evita desfases zona horaria

  const fechSig = new Date(fechActual);
  fechSig.setDate(fechSig.getDate() - 1 + 2); // +1 día
  const diaSiguiente = fechSig.toLocaleDateString('en-CA'); // Mantiene día correcto del SERVIDOR y evita desfases zona horaria

  const fechaVisible = fechActual.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  const { id, dni, nombre, apellidos, incidencia, sort, dir, page } = req.query;

  const filtros = {
    id: id || '',
    dni: dni || '',
    nombre: nombre || '',
    apellidos: apellidos || '',
    incidencia: incidencia || '',
    fecha: fechConsulta
  };

  const currentSort = sort || 'id';
  const currentDir = dir || 'ASC';
  const currentPage = parseInt(page) || 1;
  const limit = 25;

  try {
    const { fichajes, totalCount } = await model.findAllMark({
      filtros,
      sort: currentSort,
      dir: currentDir,
      limit: limit,
      offset: (currentPage - 1) * limit
    });

    const desde = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
    const hasta = Math.min(currentPage * limit, totalCount);

    if (isHTMX) {
      return res.render("partials/adminPanelMark/listaFichajes", {
        title: "Gestión de Fichajes",
        layout: false,
        userAdmin,
        fichajes,
        filtros,
        currentSort,
        currentDir,
        currentPage,
        desde,
        hasta,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hoy,
        fechaVisible,
        diaAnterior,
        diaSiguiente,
        esHoy: fechConsulta === hoy
      });
    }

    return res.render("partials/adminPanelMark/listaFichajes", {
      title: "Gestión de Fichajes",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      fichajes,
      filtros,
      currentSort,
      currentDir,
      currentPage,
      desde,
      hasta,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hoy,
      fechaVisible,
      diaAnterior,
      diaSiguiente,
      esHoy: fechConsulta === hoy
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

const listFichajesTrab = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const dniTrabajador = req.params.dni;
  const { dir, page } = req.query;

  const fechaVolver = req.query.fechaVolver;
  const origen = req.query.from || 'fichajes';
  const urlVolver = origen === 'trabajadores' ? '/adminPanel/trabajadores' : `/adminPanel/fichajes?fecha=${fechaVolver}`;

  const mesActual = new Date().toISOString().slice(0, 7); // mes actual YYYY-MM    
  let mesConsulta = req.query.fecha || (req.query.fechaVolver ? req.query.fechaVolver.slice(0, 7) : mesActual);

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

    const trabajador = await modelTrab.findByDniTrab(dniTrabajador);
    const { fichajes, totalCount } = await model.findMarkTrabMes({
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
      return res.render("partials/adminPanelMark/listaFichajesTrabMes", {
        title: "Listado Mensual de Fichajes",
        layout: false,
        userAdmin,
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
        mesConsulta,
        urlVolver,
        origen,
        fechaVolver
      });
    }

    return res.render("partials/adminPanelMark/listaFichajesTrabMes", {
      title: "Listado Mensual de Fichajes",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
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
      mesConsulta,
      urlVolver,
      origen,
      fechaVolver
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

const listIncidencias = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];

  const { idInc, idFich, dni, nombre, apellidos, tipoInc, estado, sort, dir, page } = req.query;

  const filtros = {
    idInc: idInc || '',
    idFich: idFich || '',
    dni: dni || '',
    nombre: nombre || '',
    apellidos: apellidos || '',
    tipoInc: tipoInc || '',
    estado: estado || 'pendiente'
  };

  const currentSort = sort || 'idInc';
  const currentDir = dir || 'DESC';
  const currentPage = parseInt(page) || 1;
  const limit = 25;

  try {

    const { incidencias, totalCount } = await model.findAllIncidencias({
      filtros,
      sort: currentSort,
      dir: currentDir,
      limit: limit,
      offset: (currentPage - 1) * limit
    });

    const desde = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
    const hasta = Math.min(currentPage * limit, totalCount);

    if (isHTMX) {
      return res.render("partials/adminPanelMark/listaIncidencias", {
        title: "Gestión de Incidencias",
        layout: false,
        userAdmin,
        incidencias,
        filtros,
        totalCount,
        desde,
        hasta,
        currentPage,
        totalPages: Math.ceil(totalCount / limit),
        currentSort,
        currentDir
      });
    }

    return res.render("partials/adminPanelMark/listaIncidencias", {
      title: "Gestión de Incidencias",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      incidencias,
      filtros,
      totalCount,
      desde,
      hasta,
      currentPage,
      totalPages: Math.ceil(totalCount / limit),
      currentSort,
      currentDir
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

const consultarIncidencia = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const idIncidencia = req.params.id;

  const origen = req.query.from || 'listIncidencias';
  const fromO = req.query.fromO;
  const dniTrab = req.query.dniTrab;
  const fecha = req.query.fecha;
  const fechaC = req.query.fechaC;
  const fechaVolver = req.query.fechaVolver;

  let urlVolver;

  switch (origen) {
    case 'listIncidencias':
      urlVolver = '/adminPanel/incidencias';
      break;
    case 'listFichajes':
      urlVolver = `/adminPanel/fichajes?fecha=${fecha}`;
      break;
    case 'listFichajesTrab':
      urlVolver = `/adminPanel/fichajes/${dniTrab}?fecha=${fechaC}&fechaVolver=${fechaVolver}&from=${fromO}`;
      break;
    default:
      urlVolver = '/adminPanel/incidencias';
  };

  try {

    const incidencia = await model.findIncidenciaById(idIncidencia);

    if (isHTMX) {
      return res.render("partials/adminPanelMark/consultarIncidencia", {
        title: "Consulta de Incidencia",
        layout: false,
        userAdmin,
        incidencia,
        urlVolver
      });
    }
    return res.render("partials/adminPanelMark/consultarIncidencia", {
      title: "Consulta de Incidencia",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      incidencia,
      urlVolver
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

const resolverIncidencia = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const idIncidencia = req.params.id;

  try {

    const incidencia = await model.findIncidenciaById(idIncidencia);

    if (isHTMX) {
      return res.render("partials/adminPanelMark/resolverIncidencia", {
        title: "Resolver Incidencia",
        layout: false,
        userAdmin,
        incidencia
      });
    }
    return res.render("partials/adminPanelMark/resolverIncidencia", {
      title: "Resolver Incidencia",
      layout: "./layouts/layout-adminPanel",
      userAdmin,
      incidencia
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

const rechazarIncidencia = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const idIncidencia = req.params.id;
  const incidencia = req.body;

  const fechaInc = incidencia.fechaFich;
  const fechaFormateada = fechaInc.split('-').reverse().join('-');

  try {

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const trabajador = await modelTrab.findByDniTrab(incidencia.dni);

    try {
      const textoEmail = "QronosBOOK - La INCIDENCIA ID " + idIncidencia + " de " + incidencia.tipoInc + " ha sido RECHAZADA";
      const info = await transporter.sendMail({
        from: "jcrm-costero@alwaysdata.net",
        to: trabajador.email,
        subject: "QRonosBOOK - Incidencia ID " + idIncidencia + " RECHAZADA",
        text: textoEmail,
        html: `<div style="width: 100%; text-align: center; margin-bottom: 20px;">
                          <img src="https://jcrm-costero.alwaysdata.net/images/logo04.png" style="display: block; margin: 0 auto; max-width: 200px; height: auto;">        
                        </div>
                        <div style="text-align: center; width: 100%;">
                          <p style="font-family: 'Arial Black', Arial, sans-serif; font-size: 24px; color: darkred; font-weight: 800;">RECHAZADA</p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              DNI: <span style="font-weight: normal;">${incidencia.dni}</span>
                          </p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Nombre y Apellidos: <span style="font-weight: normal;">${incidencia.nombre} ${incidencia.apellidos}</span>
                          </p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Tipo de Inc: <span style="font-weight: normal;">${incidencia.tipoInc}</span>
                          </p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Incidencia ID: <span style="font-weight: normal;">${incidencia.id}</span>
                          </p>
                          ${incidencia.idMarcaje ? `
                            <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Fichaje ID: <span style="font-weight: normal;">${incidencia.idMarcaje}</span>
                            </p>
                          ` : ''}
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Fecha: <span style="font-weight: normal;">${fechaFormateada}</span>
                          </p> 
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Hora Fichaje: <span style="font-weight: normal;">${incidencia.horaFich}</span>
                          </p>     
                          ${incidencia.horaNewFich ? `
                            <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Nueva Hora: <span style="font-weight: normal;">${incidencia.horaNewFich}</span>
                            </p>
                          ` : ''}                   
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

    await model.updateEstadoIncidencia(idIncidencia, 'Rechazada');

    if (incidencia.tipoInc !== "Crear Fichaje") {
      await model.updateMarkWithIncRecha(incidencia.idMarcaje, incidencia.id);
    };

    if (isHTMX) {
      return res.set('HX-Redirect', '/adminPanel/incidencias').send();
    };

    return res.redirect('/adminPanel/incidencias');

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

const aceptarIncidencia = async (req, res) => {

  const userAdmin = req.user.nombre + " " + req.user.apellidos;
  const isHTMX = req.headers['hx-request'];
  const idIncidencia = req.params.id;
  const incidencia = req.body;

  const fechaInc = incidencia.fechaFich;
  const fechaFormateada = fechaInc.split('-').reverse().join('-');  

  try {

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const trabajador = await modelTrab.findByDniTrab(incidencia.dni);

    try {
      const textoEmail = "QronosBOOK - La INCIDENCIA ID " + idIncidencia + " de " + incidencia.tipoInc + " ha sido ACEPTADA";
      const info = await transporter.sendMail({
        from: "jcrm-costero@alwaysdata.net",
        to: trabajador.email,
        subject: "QRonosBOOK - Incidencia ID " + idIncidencia + " ACEPTADA",
        text: textoEmail,
        html: `<div style="width: 100%; text-align: center; margin-bottom: 20px;">
                          <img src="https://jcrm-costero.alwaysdata.net/images/logo04.png" style="display: block; margin: 0 auto; max-width: 200px; height: auto;">        
                        </div>
                        <div style="text-align: center; width: 100%;">
                          <p style="font-family: 'Arial Black', Arial, sans-serif; font-size: 24px; color: darkgreen; font-weight: 800;">ACEPTADA</p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              DNI: <span style="font-weight: normal;">${incidencia.dni}</span>
                          </p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Nombre y Apellidos: <span style="font-weight: normal;">${incidencia.nombre} ${incidencia.apellidos}</span>
                          </p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Tipo de Inc: <span style="font-weight: normal;">${incidencia.tipoInc}</span>
                          </p>
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Incidencia ID: <span style="font-weight: normal;">${incidencia.id}</span>
                          </p>
                          ${incidencia.idMarcaje ? `
                            <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Fichaje ID: <span style="font-weight: normal;">${incidencia.idMarcaje}</span>
                            </p>
                          ` : ''}
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Fecha: <span style="font-weight: normal;">${fechaFormateada}</span>
                          </p> 
                          <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Hora Fichaje: <span style="font-weight: normal;">${incidencia.horaFich}</span>
                          </p>     
                          ${incidencia.horaNewFich ? `
                            <p style="font-family: Arial, sans-serif; font-size: 20px; color: darkblue; font-weight: bold;">
                              Nueva Hora: <span style="font-weight: normal;">${incidencia.horaNewFich}</span>
                            </p>
                          ` : ''}                   
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

    await model.updateEstadoIncidencia(idIncidencia, 'Aceptada');

    if (incidencia.tipoInc === "Crear Fichaje") {

      const lastMarkDay = await model.lastMarkDay(incidencia.fechaFich);      

      if (lastMarkDay.length > 0) {
        const markToDayInt = lastMarkDay[0].id;
        markForStr = markToDayInt.toString().slice(8);
        markForInt = parseInt(markForStr, 10);
        markForInt++;
        markToDay = markForInt.toString().padStart(4, '0');
      } else {
        markToDay = "0001";
      };

      const idStr = fechaInc.split('-').join('') + markToDay;
      const idInt = parseInt(idStr, 10);

      const nuevoFichaje = {
        id: idInt,
        dni: incidencia.dni,
        date: incidencia.fechaFich,
        time: incidencia.horaFich,
        incidencia: idIncidencia
      };

      await model.store(nuevoFichaje);
      await model.updateIncIdNewFich(idInt, idIncidencia);
    };

    if (incidencia.tipoInc === "Modificar Fichaje") {
      await model.updateMarkIncChangeTime(incidencia.idMarcaje, incidencia.horaNewFich, idIncidencia);
    };

    if (incidencia.tipoInc === "Eliminar Fichaje") {
      await model.deleteMarkInc(incidencia.idMarcaje);
    };

    if (isHTMX) {
      return res.set('HX-Redirect', '/adminPanel/incidencias').send();
    };

    return res.redirect('/adminPanel/incidencias');

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

module.exports = {
  listFichajes,
  listFichajesTrab,
  listIncidencias,
  consultarIncidencia,
  resolverIncidencia,
  rechazarIncidencia,
  aceptarIncidencia
};