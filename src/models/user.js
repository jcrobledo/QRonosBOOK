const pool = require('./mysql');

/********************************************************************************************/

const findByDniAdmin = async (dni) => {
    const sql = 'SELECT * FROM administradores WHERE dni = ?';
    try {
        const [rows] = await pool.execute(sql, [dni]);
        return rows[0];      
    } catch (error) {
        throw error;
    };      
};

/********************************************************************************************/

const findAllAdmin = async ({ sort, dir, limit, offset }) => {
    
    const queryBase = `
        FROM administradores a
        INNER JOIN trabajadores t ON a.dni = t.dni`;
    
    const sortMapping = {
        'dni': 'a.dni',
        'nombre': 't.nombre',
        'apellidos': 't.apellidos',
        'createdAt': 'a.createdAt'
    };

    const orderBy = sortMapping[sort] || 'a.dni';
    const orderDir = (dir && dir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
    
    const selectQuery = `
        SELECT a.dni, a.createdAt, t.nombre, t.apellidos 
        ${queryBase} 
        ORDER BY ${orderBy} ${orderDir} 
        LIMIT ? OFFSET ?`;
        
    const countQuery = `SELECT COUNT(*) as total ${queryBase}`;

    try {
        const [rows] = await pool.execute(selectQuery, [String(limit), String(offset)]);
        const [[{ total }]] = await pool.execute(countQuery);

        return { 
            administradores: rows, 
            totalCount: total 
        };
    } catch (error) {
        console.error("Error al obtener administradores:", error);
        throw error;
    };   
};

/********************************************************************************************/

const findByDniTrab = async (dni) => {
    const sql = 'SELECT * FROM trabajadores WHERE dni = ?';
    try {
        const [rows] = await pool.execute(sql, [dni]);
        return rows[0];      
    } catch (error) {
        throw error;
    };      
};

/********************************************************************************************/

const findAllTrab = async ({ filtros = {}, sort, dir, limit, offset}) => {
    let query = `
        SELECT t.* FROM trabajadores t
        LEFT JOIN departamentos d ON t.departamento = d.id`;

    let countQuery = `
        SELECT COUNT(*) as total FROM trabajadores t
        LEFT JOIN departamentos d ON t.departamento = d.id`;

    let queryParams = [];
    let whereClauses = [];

    if (filtros.dni) {
        whereClauses.push("t.dni LIKE ?");
        queryParams.push(`%${filtros.dni}%`);
    };

    if (filtros.nombre) {
        whereClauses.push("t.nombre LIKE ?");
        queryParams.push(`%${filtros.nombre}%`);
    };

    if (filtros.apellidos) {
        whereClauses.push("t.apellidos LIKE ?");
        queryParams.push(`%${filtros.apellidos}%`);
    };

    if (filtros.departamento) {
        whereClauses.push("d.nombre LIKE ?");
        queryParams.push(`%${filtros.departamento}%`);
    };

    if (whereClauses.length > 0) {
        const whereString = " WHERE " + whereClauses.join(" AND ");
        query += whereString;
        countQuery += whereString;
    };

    const validColumns = ['dni', 'nombre', 'apellidos', 'email', 'departamento'];
    let orderBy = validColumns.includes(sort) ? `t.${sort}` : 't.dni';
    if (sort === 'departamento') orderBy = 'd.nombre';

    const orderDir = (dir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;

    try {
        const [rows] = await pool.execute(query, [...queryParams, String(limit), String(offset)]);
        const [[{ total }]] = await pool.execute(countQuery, queryParams);

        return { 
            trabajadores: rows, 
            totalCount: total 
        };

    } catch (error) {
        throw error;
    };      
};

/********************************************************************************************/

const findAllDep = async () => {
    const sql = 'SELECT * FROM departamentos';
    try {
        const [rows] = await pool.execute(sql);
        return rows;      
    } catch (error) {
        throw error;
    };      
};

/********************************************************************************************/

const findDepById = async (id) => {
    const sql = 'SELECT * FROM departamentos WHERE id = ?';
    try {
        const [rows] = await pool.execute(sql, [id]);
        return rows;      
    } catch (error) {
        throw error;
    };      
};

/********************************************************************************************/

const findDepByName = async (nombre) => {
    const sql = 'SELECT * FROM departamentos WHERE nombre = ?';
    try {
        const [rows] = await pool.execute(sql, [nombre]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const createTrab = async (trabajador) => {
    const sql = `
        INSERT INTO trabajadores (dni, nombre, apellidos, email, departamento, password)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        const [rows] = await pool.execute(sql, [
            trabajador.dni,
            trabajador.nombre,
            trabajador.apellidos,
            trabajador.email,
            trabajador.departamento,
            trabajador.password
        ]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const createAdmin = async (dni) => {
    const sql = `
        INSERT INTO administradores (dni)
        VALUES (?)
    `;

    try {
        const [rows] = await pool.execute(sql, [dni]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const createDep = async (nombre) => {
    const sql = `
        INSERT INTO departamentos (nombre)
        VALUES (?)
    `;

    try {
        const [rows] = await pool.execute(sql, [nombre]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const updateTrab = async (trabajador) => {

    let sql = "";
    let valores = [];

    if (trabajador.password) {  
        sql = `
        UPDATE trabajadores
        SET nombre = ?, apellidos = ?, email = ?, departamento = ?, password = ?
        WHERE dni = ?
        `;        
        valores = [
            trabajador.nombre,
            trabajador.apellidos,
            trabajador.email,
            trabajador.departamento,
            trabajador.password,
            trabajador.dni
        ];

    } else {
        sql = `
        UPDATE trabajadores
        SET nombre = ?, apellidos = ?, email = ?, departamento = ?
        WHERE dni = ?
        `;
        valores = [
            trabajador.nombre,
            trabajador.apellidos,
            trabajador.email,
            trabajador.departamento,            
            trabajador.dni
        ];
    };    

    try {
        const [rows] = await pool.execute(sql, valores);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const updateDep = async (id, nombre) => {      

    sql = 'UPDATE departamentos SET nombre = ? WHERE id = ?';   

    try {
        const [rows] = await pool.execute(sql, [nombre, id]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const deleteTrab = async (dni) => {

    const sql = 'DELETE FROM trabajadores WHERE dni = ?';
    
    try {
        const [rows] = await pool.execute(sql, [dni]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const deleteAdmin = async (dni) => {
 
    const sql = 'DELETE FROM administradores WHERE dni = ?';

    try {
        const [rows] = await pool.execute(sql, [dni]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const deleteDepart = async (id) => {
 
    const sql = 'DELETE FROM departamentos WHERE id = ?';

    try {
        const [rows] = await pool.execute(sql, [id]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const updatePassTrab = async (dni, password) => {

    const sql = 'UPDATE trabajadores SET password = ? WHERE dni = ?';

    try {
        const [rows] = await pool.execute(sql, [password, dni]);
        return rows;
    } catch (error) {
        throw error;
    };
};

/********************************************************************************************/

const findAllDepTrabCount = async ({ sort, dir, limit, offset }) => {
    
    const queryBase = `
        FROM departamentos d
        LEFT JOIN trabajadores t ON d.id = t.departamento
        GROUP BY d.id, d.nombre`;
    
    const sortMapping = {
        'nombre': 'd.nombre',
        'num_trab': 'num_trab'
    };

    const orderBy = sortMapping[sort] || 'd.nombre';
    const orderDir = (dir && dir.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
    
    const selectQuery = `
        SELECT d.id, d.nombre AS departamento, COUNT(t.dni) AS num_trab
        ${queryBase} 
        ORDER BY ${orderBy} ${orderDir} 
        LIMIT ? OFFSET ?`;        
    
    const countQuery = `SELECT COUNT(DISTINCT d.id) as total FROM departamentos d`;

    try {
        const [rows] = await pool.execute(selectQuery, [String(limit), String(offset)]);
        const [[{ total }]] = await pool.execute(countQuery);

        return { 
            departamentos: rows, 
            totalCount: total 
        };
    } catch (error) {        
        throw error;
    };     
};

/********************************************************************************************/

const countTrabDepById  = async (id) => {

    const sql = `
        SELECT 
            d.id, 
            d.nombre AS departamento, 
            COUNT(t.dni) AS num_trab
        FROM departamentos d
        LEFT JOIN trabajadores t ON d.id = t.departamento
        WHERE d.id = ?
        GROUP BY d.id, d.nombre`;

    try {        
        const [rows] = await pool.execute(sql, [id]);        
        return rows;

    } catch (error) {        
        throw error;
    };  
};

/********************************************************************************************/

module.exports = {      
    findByDniAdmin,
    findAllAdmin,
    findByDniTrab,
    findAllTrab,
    findAllDep,
    findDepById,    
    findDepByName,
    createTrab,
    createAdmin,
    createDep,
    updateTrab,
    updateDep,
    deleteTrab,
    deleteAdmin,
    deleteDepart,
    updatePassTrab,
    findAllDepTrabCount,
    countTrabDepById
};