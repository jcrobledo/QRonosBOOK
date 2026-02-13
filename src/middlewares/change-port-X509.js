const changePortX509 = (req, res, next) => {

const PORTSSL_X509 = process.env.PORTSSL_X509;
  
  const isStandardPort = req.socket.localPort === 443 || req.socket.localPort === 3000; // Verificamos si la petición viene por el puerto 443 (o el puerto por defecto)

  if (isStandardPort) {    
    const UrlReqCert = `https://${req.hostname}:${PORTSSL_X509}${req.originalUrl}`; // Construimos la nueva URL con el puerto 4443    
    return res.redirect(302, UrlReqCert); // Redirige al cliente al puerto con requestCert: true
  }  

  next();

};

module.exports = {
  changePortX509,   
};
