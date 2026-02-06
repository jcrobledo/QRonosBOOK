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

module.exports = {      
    findByDniAdmin,
    findByDniTrab,
};