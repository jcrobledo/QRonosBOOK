const pool = require('./mysql');

/********************************************************************************************/

const store = async (marcaje) => {    
    const sql = 'INSERT INTO marks (id, dni, user, date, time) VALUES (?, ?, ?, ?, ?)';
    try {
        const [result] = await pool.execute(sql, [marcaje.id, marcaje.dni, marcaje.user, marcaje.date, marcaje.time]);
        return result.insertId;        
    } catch (error) {
        throw error;
    };    
};

/********************************************************************************************/

const lastMark = async () => {
    const sql = 'SELECT * FROM marks ORDER BY id DESC LIMIT 1';
    try {
        const [result] = await pool.execute(sql);        
        return result;        
    } catch (error) {
        throw error;
    }; 
};

/********************************************************************************************/

module.exports = {
    store,   
    lastMark     
};