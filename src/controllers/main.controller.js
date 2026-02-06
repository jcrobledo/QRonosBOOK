const index = (req, res) => {      

    const mgsGeneral = req.signedCookies.flash_msg;  
    const msgLogout = req.signedCookies.flash_logout;  

    if (mgsGeneral) res.clearCookie('flash_msg');
    if (msgLogout) res.clearCookie('flash_logout');
    
    return res.render("index", { title: "Inicio", 
            message: mgsGeneral || null,
            logoutMessage: msgLogout || null,
            callerForm: req.query.callerForm || null });        

};

/********************************************************************************************/

module.exports = {
    index,        
};
