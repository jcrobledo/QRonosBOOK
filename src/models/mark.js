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

module.exports = {
    store,
    lastMark,
    findAllMark
};