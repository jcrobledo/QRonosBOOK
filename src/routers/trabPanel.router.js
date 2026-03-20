const express = require("express");
const router = express.Router();
const controller = require('../controllers/trabPanel.controller');
const vToken = require("../middlewares/verify-token");
const { rulesAuth, rulesPass, validate } = require('../middlewares/validatorExpressTrab');

router.post("/", rulesAuth, controller.auth);
router.get("/", vToken.verifyTokenTrab, controller.trabPage);
router.get("/fichajes", vToken.verifyTokenTrab, controller.listFichajesTrab);
router.get("/miPerfil", vToken.verifyTokenTrab, controller.perfilTrab);
router.get("/changePass", vToken.verifyTokenTrab, controller.cambiarPass);
router.put("/changePass", vToken.verifyTokenTrab, rulesPass, validate, controller.changePass);
router.get("/logout", controller.logout);

module.exports = router;  //para poder exportar la ruta a otros códigos