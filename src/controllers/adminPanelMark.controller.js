const model = require("../models/mark");

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

module.exports = {
    listFichajes
};