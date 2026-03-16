const express = require("express");
const router = express.Router();
const controller = require('../controllers/adminPanel.controller');
const controllerAux = require('../controllers/adminPanelAux.controller');
const controllerMark = require('../controllers/adminPanelMark.controller');
const vToken = require('../middlewares/verify-token');
const { rulesAuth, rulesAlta, rulesPass, rulesDNI, rulesAdmin, rulesDep, validate } = require('../middlewares/validatorExpress');

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

/* Rutas para la Gestión de Departamentos */
router.get("/departamentos", vToken.verifyTokenAdmin, controllerAux.listDepartamentos);
router.get("/departamentos/alta", vToken.verifyTokenAdmin, controllerAux.altaDepartamentos);
router.post("/departamentos/alta", vToken.verifyTokenAdmin, rulesDep, validate, controllerAux.createDepart);
router.get("/departamentos/editar/:id", vToken.verifyTokenAdmin, controllerAux.editarDepartamentos);
router.put("/departamentos/editar/:id", vToken.verifyTokenAdmin, rulesDep, validate, controllerAux.updateDepart);
router.delete("/departamentos/eliminar/:id", vToken.verifyTokenAdmin, controllerAux.deleteDepart);

/* Rutas para la Gestión de Fichajes e Incidencias */
router.get("/fichajes", vToken.verifyTokenAdmin, controllerMark.listFichajes);

module.exports = router;  //para poder exportar la ruta a otros códigos