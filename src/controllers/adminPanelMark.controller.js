const model = require("../models/mark");
const modelTrab = require("../models/user");

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

  const origen = req.query.from || 'fichajes';
  const urlVolver = origen === 'trabajadores' ? '/adminPanel/trabajadores' : '/adminPanel/fichajes';

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
        origen
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
      origen
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

module.exports = {
  listFichajes,
  listFichajesTrab
};