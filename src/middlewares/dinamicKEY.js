const generateKey = (req, res, next) => {

    let key = '';
    const caracteres = '0123456789';    

    for (let i = 0; i < 6; i++) {
        key += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
     
    req.user = key;
    next();

};

module.exports = {
  generateKey,   
};