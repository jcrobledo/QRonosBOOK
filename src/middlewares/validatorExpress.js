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

const rulesAlta = [
    body('dni')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 9, max: 9 })
        .matches('.{8}[A-Z]'),
    body('nombre')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ max: 25 })
        .isAlpha('es-ES', { ignore: ' -' }),
    body('apellidos')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ max: 50 })
        .isAlpha('es-ES', { ignore: ' -' }),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 50 }),
    body('departamento')
        .trim()
        .escape()
        .notEmpty(),
    body('password')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 8, max: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*+])[a-zA-Z\d!@#$%&*+]{8}$/)
];

const rulesPass = [
    body('password')
        .trim()
        .isLength({ min: 8, max: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*+])[a-zA-Z\d!@#$%&*+]{8}$/)
];

const rulesDNI = [
    body('dni')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 9, max: 9 })
        .matches('.{8}[A-Z]')
];

const rulesAdmin = [
    body('dni')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ min: 9, max: 9 })
        .matches('.{8}[A-Z]'),
    body('nombre')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ max: 25 })
        .isAlpha('es-ES', { ignore: ' -' }),
    body('apellidos')
        .trim()
        .escape()
        .notEmpty()
        .isLength({ max: 50 })
        .isAlpha('es-ES', { ignore: ' -' }),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .isLength({ max: 50 })
];

/********************************************************************************************/

const validate = (req, res, next) => {

    const result = validationResult(req);

    if (result.isEmpty()) {
        return next();
    } else {

        const userAdmin = req.user.nombre + " " + req.user.apellidos;
        const isHTMX = req.headers['hx-request'];

        console.error("Error general Express-validator:", result);
        if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('adminPanel/errorValidacionDatos', {
                title: "Error de Validación",
                layout: false,
                userAdmin
            });
        }
        return res.render("adminPanel/errorValidacionDatos", {
            title: "Error de Validación",
            layout: "./layouts/layout-adminPanel",
            userAdmin
        });
    };

};

/********************************************************************************************/


module.exports = {
    rulesAuth,
    rulesAlta,
    rulesPass,
    rulesDNI,
    rulesAdmin, 
    validate
};