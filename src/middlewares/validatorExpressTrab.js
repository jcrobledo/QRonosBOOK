const { body, validationResult } = require('express-validator');

/********************************************************************************************/

const rulesAuth = [
    body('dni')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 9, max: 9 })
        .matches('.{8}[A-Z]'),
    body('password')
        .trim()
        .notEmpty()
];

const rulesPass = [    
    body('passActual')
        .trim()
        .notEmpty(),
    body('passNueva')
        .trim()
        .notEmpty(),
    body('passRepetir')
        .trim()
        .notEmpty()
];

const rulesIncNewFich = [
    body('fechaInc')
        .trim()
        .escape()
        .notEmpty()
        .isISO8601(),
    body('horaInc')
        .trim()
        .escape()
        .notEmpty()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
];

const rulesIncUpdateFich = [
    body('idMarcaje')        
        .trim()
        .escape()  
        .notEmpty()      
        .isLength({ min: 12, max: 12 })
        .isNumeric(),
    body('fechaFich')
        .optional({ checkFalsy: true })
        .trim()
        .escape()        
        .isISO8601(),
    body('horaFich')
        .optional({ checkFalsy: true })
        .trim()
        .escape()        
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body('horaNewFich')
        .optional({ checkFalsy: true })
        .trim()
        .escape()        
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
];

/********************************************************************************************/

const validate = (req, res, next) => {

    const result = validationResult(req);

    if (result.isEmpty()) {
        return next();
    } else {

        const userTrab = req.user.nombre + " " + req.user.apellidos;
        const isHTMX = req.headers['hx-request'];

        console.error("Error general Express-validator:", result);
        if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('trabPanel/errorValidacionDatos', {
                title: "Error de Validación",
                layout: false,
                userTrab
            });
        }
        return res.render("trabPanel/errorValidacionDatos", {
            title: "Error de Validación",
            layout: "./layouts/layout-trabPanel",
            userTrab
        });
    };

};

/********************************************************************************************/


module.exports = {
    rulesAuth,
    rulesPass,
    rulesIncNewFich,
    rulesIncUpdateFich,
    validate
};