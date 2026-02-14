const express = require("express");
const router = express.Router();
const controller = require('../controllers/codigosQR.controller');

const changePortX509 = require("../middlewares/change-port-X509");
const vTokenCert = require("../middlewares/verify-cert");
const prefixDin = require("../middlewares/dinamicURL");
const dinKEY = require("../middlewares/dinamicKEY");

const { body } = require('express-validator');

const rules = [
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

const vToken = require("../middlewares/verify-token");

router.post("/", rules, controller.authQR);
router.get("/", vToken.verifyTokenQR, prefixDin.prefixDinamicUrl, controller.index);
router.get("/urlTemporal/:sufijo", controller.urlTemporal);
router.post("/urlTemporal/:sufijo", rules, dinKEY.generateKey, controller.auth);
router.get("/api/actualTime", controller.actualTime);

module.exports = router;  //para poder exportar la ruta a otros códigos