const express = require("express");
const router = express.Router();
const controller = require('../controllers/adminPanel.controller');

const { body } = require('express-validator');

const rulesAuth = [
  body('dni')
    .trim()
    .escape()
    .notEmpty()
    .isLength({min: 9, max: 9})
    .matches('.{8}[A-Z]'),
  body('password')
  .trim()
  .escape()
  .notEmpty()   
];

const rulesAlta = [
  body('dni')
    .trim()
    .escape()
    .notEmpty()
    .isLength({min: 9, max: 9})
    .matches('.{8}[A-Z]'),
  body('nombre')
    .trim()
    .escape()
    .notEmpty()
    .isLength({max: 25})
    .isAlpha('es-ES', {ignore: ' -'}),
  body('apellidos')
    .trim()
    .escape()
    .notEmpty()
    .isLength({max: 50})
    .isAlpha('es-ES', {ignore: ' -'}),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()    
    .isLength({max: 50}),
  body('departamento')
    .trim()
    .escape()
    .notEmpty(),
  body('password')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 8, max: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*+])[a-zA-Z\d!@#$%^&*+]{8}$/)    
];

const vToken = require("../middlewares/verify-token");

router.post("/", rulesAuth, controller.auth);
router.get("/", vToken.verifyTokenAdmin, controller.adminPage);
router.get("/trabajadores", vToken.verifyTokenAdmin, controller.listTrabajadores);
router.get("/trabajadores/alta", vToken.verifyTokenAdmin, controller.altaTrabajadores);
router.post("/trabajadores/alta", vToken.verifyTokenAdmin, rulesAlta, controller.createTrabajador);
router.get("/trabajadores/editar/:dni", vToken.verifyTokenAdmin, controller.editarTrabajador);
router.put("/trabajadores/editar/:dni", vToken.verifyTokenAdmin, rulesAlta, controller.updateTrabajador);
router.get("/trabajadores/eliminar/:dni", vToken.verifyTokenAdmin, controller.eliminarTrabajador);
router.delete("/trabajadores/eliminar/:dni", vToken.verifyTokenAdmin, controller.deleteTrabajador);
router.get("/trabajadores/cambiarPass/:dni", vToken.verifyTokenAdmin, controller.cambiarPass);
router.put("/trabajadores/cambiarPass/:dni", vToken.verifyTokenAdmin, controller.changePass);
router.get("/logout", controller.logout);

module.exports = router;  //para poder exportar la ruta a otros códigos