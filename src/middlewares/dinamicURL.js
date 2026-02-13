const prefixDinamicUrl = (req, res, next) => {

    let sufijo = '';
    const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';    

    for (let i = 0; i < 15; i++) {
        sufijo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
       
    req.user = sufijo;
    next();

};

module.exports = {
  prefixDinamicUrl,   
};