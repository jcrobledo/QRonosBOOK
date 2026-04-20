const pool = require('./mysql');

/********************************************************************************************/

const store = async (marcaje) => {

    const sql = 'INSERT INTO marcajes (id, dni, date, time) VALUES (?, ?, ?, ?)';

    try {

        const [result] = await pool.execute(sql, [marcaje.id, marcaje.dni, marcaje.date, marcaje.time]);
        return result.insertId;

    } catch (error) {
        throw error;
    };

};

/********************************************************************************************/

const lastMark = async () => {

    const sql = 'SELECT * FROM marcajes ORDER BY id DESC LIMIT 1';

    try {

        const [result] = await pool.execute(sql);
        return result;

    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const lastMarkDay = async (fecha) => {

    const sql = 'SELECT * FROM marcajes WHERE date = ? ORDER BY id DESC LIMIT 1';

    try {

        const [result] = await pool.execute(sql, [fecha]);
        return result;

    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const findAllMark = async ({ filtros = {}, sort, dir, limit, offset }) => {

    let query = `
        SELECT m.id, m.dni, 
            DATE_FORMAT(m.date, '%d-%m-%Y') as date, 
            TIME_FORMAT(m.time, '%H:%i') as time, 
            LPAD(m.incidencia, 5, '0') as incidencia, 
            t.nombre, t.apellidos 
        FROM marcajes m
        LEFT JOIN trabajadores t ON m.dni = t.dni`;

    let countQuery = `
        SELECT COUNT(*) as total FROM marcajes m
        LEFT JOIN trabajadores t ON m.dni = t.dni`;

    let queryParams = [];
    let whereClauses = [];

    if (filtros.id) {
        whereClauses.push("m.id LIKE ?");
        queryParams.push(`%${filtros.id}%`); 
    }

    if (filtros.dni) {
        whereClauses.push("m.dni LIKE ?");
        queryParams.push(`%${filtros.dni}%`);
    }
    if (filtros.nombre) {
        whereClauses.push("t.nombre LIKE ?");
        queryParams.push(`%${filtros.nombre}%`);
    }

    if (filtros.apellidos) {
        whereClauses.push("t.apellidos LIKE ?");
        queryParams.push(`%${filtros.apellidos}%`);
    }

    if (filtros.incidencia !== undefined && filtros.incidencia !== null && filtros.incidencia !== '') {
        whereClauses.push("CAST(m.incidencia AS CHAR) LIKE ?");  // Convertimos el INT a CHAR para que LIKE funcione con los números
        queryParams.push(`%${filtros.incidencia}%`);
    }

    if (filtros.fecha) {
        whereClauses.push("m.date = ?");
        queryParams.push(filtros.fecha); // Recibe el YYYY-MM-DD del controlador
    }

    if (whereClauses.length > 0) {
        const whereString = " WHERE " + whereClauses.join(" AND ");
        query += whereString;
        countQuery += whereString;
    }

    const validColumns = ['id', 'dni', 'date', 'time', 'incidencia', 'nombre', 'apellidos'];
    let orderBy = validColumns.includes(sort) ? `m.${sort}` : 'm.id';

    if (sort === 'nombre') orderBy = 't.nombre';
    if (sort === 'apellidos') orderBy = 't.apellidos';
    if (sort === 'date') orderBy = 'm.date';
    if (sort === 'time') orderBy = 'm.time';
    if (sort === 'incidencia') orderBy = 'm.incidencia IS NULL, m.incidencia'; // todas las incidencias primero y ordenadas ASC o DESC

    const orderDir = (dir && dir.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    query += ` ORDER BY ${orderBy} ${orderDir}, m.id LIMIT ? OFFSET ?`;

    try {
        const [rows] = await pool.execute(query, [...queryParams, String(limit), String(offset)]);
        const [[{ total }]] = await pool.execute(countQuery, queryParams);

        return {
            fichajes: rows,
            totalCount: total
        };
    } catch (error) {
        throw error;
    }
};

/********************************************************************************************/

const findMarkTrabMes = async ({ dni, mes, dir, limit, offset }) => {

    let query = `
        SELECT m.id, m.dni, 
            DATE_FORMAT(m.date, '%d-%m-%Y') as date, 
            TIME_FORMAT(m.time, '%H:%i') as time, 
            LPAD(m.incidencia, 5, '0') as incidencia
        FROM marcajes m
        WHERE m.dni = ? AND m.date LIKE ?`;

    let countQuery = `
        SELECT COUNT(*) as total 
        FROM marcajes m 
        WHERE m.dni = ? AND m.date LIKE ?`;
    
    const queryParams = [dni, `${mes}%`];
    
    const orderDir = (dir && dir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';    
    query += ` ORDER BY m.date ${orderDir}, m.time ASC LIMIT ? OFFSET ?`;

    try {        
        const [rows] = await pool.execute(query, [...queryParams, String(limit), String(offset)]);
        const [[{ total }]] = await pool.execute(countQuery, queryParams);

        return {
            fichajes: rows,
            totalCount: total
        };
    } catch (error) {
        throw error;
    }
};

/********************************************************************************************/

const findMarkTrabAll = async (dni) => {

    const query = 'SELECT * FROM marcajes WHERE dni = ?';    

    try {        
        const [rows] = await pool.execute(query, [dni]);       

        return rows;
    } catch (error) {
        throw error;
    }
};

/********************************************************************************************/

const storeIncidencia = async (incidencia) => {

    const sql = 'INSERT INTO incidencias (dni, idMarcaje, date, time, timeChange, tipoInc, resolucion) VALUES (?, ?, ?, ?, ?, ?, ?)';

    try {

        const [result] = await pool.execute(sql, [incidencia.dniTrabajador, incidencia.idMarcaje,
                                                incidencia.fecha, incidencia.hora, incidencia.horaNueva, 
                                                incidencia.tipo, incidencia.resolucion]);
        return result.insertId;

    } catch (error) {
        throw error;
    }

};

/********************************************************************************************/

const findAllIncTrab = async ({ dni, filtros = {}, sort, dir, limit, offset }) => {

    let query = `
        SELECT 
            LPAD(i.id, 5, '0') as id, 
            i.idMarcaje, 
            DATE_FORMAT(i.date, '%d-%m-%Y') as date, 
            TIME_FORMAT(i.time, '%H:%i') as time, 
            TIME_FORMAT(i.timeChange, '%H:%i') as timeChange, 
            i.tipoInc, 
            i.resolucion
        FROM incidencias i
        WHERE i.dni = ?`;

    let countQuery = `
        SELECT COUNT(*) as total
        FROM incidencias i
        WHERE i.dni = ?`;

    let queryParams = [dni];
    let whereClauses = [];

    if (filtros.estado && filtros.estado !== 'todas') {
        whereClauses.push("i.resolucion = ?");
        queryParams.push(filtros.estado);
    };

    if (whereClauses.length > 0) {
        const extraWhere = " AND " + whereClauses.join(" AND ");
        query += extraWhere;
        countQuery += extraWhere;
    };

    const validColumns = ['id', 'idMarcaje', 'date', 'time', 'timeChange', 'tipoInc', 'resolucion'];
    let orderBy = validColumns.includes(sort) ? `i.${sort}` : 'i.id';

    if (sort === 'date') orderBy = 'i.date'; 
    if (sort === 'time') orderBy = 'i.time';
    if (sort === 'timeChange') orderBy = 'i.timeChange';

    const orderDir = (dir && dir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC'; 
    
    query += ` ORDER BY ${orderBy} ${orderDir}, i.id ${orderDir} LIMIT ? OFFSET ?`;

    try {
        const [rows] = await pool.execute(query, [...queryParams, String(limit), String(offset)]);
        const [[{ total }]] = await pool.execute(countQuery, queryParams);
        
        return {
            incidencias: rows,
            totalCount: total
        };

    } catch (error) {
        throw error;
    };

};

/********************************************************************************************/

const findAllTiposInc = async () => {

    const sql = 'SELECT * FROM incidenciaTipo';

    try {
        const [rows] = await pool.execute(sql);
        return rows;
    } catch (error) {
        throw error;
    };

};

/********************************************************************************************/

const findMarkTrabByIdInc = async (idMarcaje, dniTrabajador) => {

    const sql = 'SELECT * FROM incidencias WHERE idMarcaje = ? AND dni = ?';

    try {
        const [rows] = await pool.execute(sql, [idMarcaje, dniTrabajador]);
        return rows; 
    } catch (error) {
        throw error;
    }

};

/********************************************************************************************/

const findMarkByIdTrab = async (idMarcaje, dniTrabajador) => {

    const sql = 'SELECT * FROM marcajes WHERE id = ? AND dni = ?';

    try {
        const [rows] = await pool.execute(sql, [idMarcaje, dniTrabajador]);
        return rows[0]; 
    } catch (error) {
        throw error;
    }

};

/********************************************************************************************/

const deleteRegInc = async (idIncidencia) => {

    const sql = 'DELETE FROM incidencias WHERE id = ?';

    try {
        const [rows] = await pool.execute(sql, [idIncidencia]);
        return rows;
    } catch (error) {
        throw error;
    }

};

/********************************************************************************************/

const findIncidenciaByIdTrab = async (idIncidencia, dniTrabajador) => {

    const sql = 'SELECT * FROM incidencias WHERE id = ? AND dni = ?';

    try {
        const [rows] = await pool.execute(sql, [idIncidencia, dniTrabajador]);
        return rows[0];
    } catch (error) {
        throw error;
    }

};

/********************************************************************************************/

const findAllTipoInc = async () => {

    const sql = 'SELECT * FROM incidenciaTipo';

    try {
        const [rows] = await pool.execute(sql);
        return rows;
    } catch (error) {
        throw error;
    }

};

/********************************************************************************************/

module.exports = {
    store,
    lastMark,
    lastMarkDay,
    findAllMark,
    findMarkTrabMes,
    findMarkTrabAll,
    storeIncidencia,
    findAllIncTrab,
    findAllTiposInc,
    findMarkTrabByIdInc,
    findMarkByIdTrab,
    deleteRegInc,   
    findIncidenciaByIdTrab,
    findAllTipoInc
};