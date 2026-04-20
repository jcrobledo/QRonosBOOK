const express = require("express");
const router = express.Router();
const controller = require('../controllers/trabPanel.controller');
const vToken = require("../middlewares/verify-token");
const { rulesAuth, rulesPass, validate } = require('../middlewares/validatorExpressTrab');

/* Rutas para Acceso al Panel de Trabajadores: Login y Logout */
router.post("/", rulesAuth, controller.auth);
router.get("/", vToken.verifyTokenTrab, controller.trabPage);
router.get("/logout", controller.logout);

/* Rutas para las Consultas de los Trabajadores y cambio de PASS*/
router.get("/fichajes", vToken.verifyTokenTrab, controller.listFichajesTrab);
router.get("/miPerfil", vToken.verifyTokenTrab, controller.perfilTrab);
router.get("/changePass", vToken.verifyTokenTrab, controller.cambiarPass);
router.put("/changePass", vToken.verifyTokenTrab, rulesPass, validate, controller.changePass);

/* Rutas para la Gestión de las Incidencias*/
router.get("/incidencias", vToken.verifyTokenTrab, controller.listIncidenciasTrab);
router.get("/incidencias/crear", vToken.verifyTokenTrab, controller.crearIncidencia);
router.post("/incidencias/crear", vToken.verifyTokenTrab, controller.createIncidencia);
router.get("/incidencias/modificar", vToken.verifyTokenTrab, controller.modificarIncidencia);
router.post("/incidencias/modificar", vToken.verifyTokenTrab, controller.modificarIncidencia);
router.post("/incidencias/modificarReg", vToken.verifyTokenTrab, controller.updateIncidencia);
router.get("/incidencias/eliminar", vToken.verifyTokenTrab, controller.eliminarIncidencia);
router.post("/incidencias/eliminar", vToken.verifyTokenTrab, controller.eliminarIncidencia);
router.post("/incidencias/eliminarReg", vToken.verifyTokenTrab, controller.deleteIncidencia);
router.delete("/incidencias/deleteInc/:id", vToken.verifyTokenTrab, controller.deleteRegIncidencia);
router.get("/incidencias/consultar/:id", vToken.verifyTokenTrab, controller.consultarIncidencia);

module.exports = router;  //para poder exportar la ruta a otros códigos