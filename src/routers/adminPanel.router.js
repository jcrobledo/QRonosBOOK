const express = require("express");
const router = express.Router();
const controller = require('../controllers/adminPanel.controller');
const controllerAux = require('../controllers/adminPanelAux.controller');
const vToken = require('../middlewares/verify-token');
const { rulesAuth, rulesAlta, rulesPass, rulesDNI, rulesAdmin, validate } = require('../middlewares/validatorExpress');

/* Rutas para Acceso al Panel de Adminitración: Login y Logout */
router.post("/", rulesAuth, controller.auth);
router.get("/", vToken.verifyTokenAdmin, controller.adminPage);
router.get("/logout", controller.logout);

/* Rutas para la Gestión de Trabajadores */
router.get("/trabajadores", vToken.verifyTokenAdmin, controller.listTrabajadores);
router.get("/trabajadores/alta", vToken.verifyTokenAdmin, controller.altaTrabajadores);
router.post("/trabajadores/alta", vToken.verifyTokenAdmin, rulesAlta, validate, controller.createTrabajador);
router.get("/trabajadores/editar/:dni", vToken.verifyTokenAdmin, controller.editarTrabajador);
router.put("/trabajadores/editar/:dni", vToken.verifyTokenAdmin, rulesAlta, validate, controller.updateTrabajador);
router.get("/trabajadores/eliminar/:dni", vToken.verifyTokenAdmin, controller.eliminarTrabajador);
router.delete("/trabajadores/eliminar/:dni", vToken.verifyTokenAdmin, controller.deleteTrabajador);
router.get("/trabajadores/cambiarPass/:dni", vToken.verifyTokenAdmin, controller.cambiarPass);
router.put("/trabajadores/cambiarPass/:dni", vToken.verifyTokenAdmin, rulesPass, validate, controller.changePass);

/* Rutas para la Gestión de Administradores */
router.get("/administradores", vToken.verifyTokenAdmin, controllerAux.listAdministradores);
router.get("/administradores/buscar", vToken.verifyTokenAdmin, controllerAux.buscarAdministradores);
router.post("/administradores/buscar", vToken.verifyTokenAdmin, rulesDNI, validate, controllerAux.buscarAdministradores);
router.post("/administradores/alta", vToken.verifyTokenAdmin, rulesAdmin, validate, controllerAux.createAdministradores);
router.delete("/administradores/eliminar/:dni", vToken.verifyTokenAdmin, controllerAux.deleteAdministradores);

module.exports = router;  //para poder exportar la ruta a otros códigos