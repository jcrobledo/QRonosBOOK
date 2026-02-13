const express = require("express");
const router = express.Router();
const controller = require('../controllers/codigosQR.controller');

const changePortX509 = require("../middlewares/change-port-X509");
const vTokenCert = require("../middlewares/verify-cert");
const prefixDin = require("../middlewares/dinamicURL");
const dinKEY = require("../middlewares/dinamicKEY");

const { body } = require('express-validator');

const rules = [
  body('nombre')
    .trim()
    .escape()
    .notEmpty()
    .isLength({ min: 8 })
    .matches('(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+'),
  body('password')
    .trim()
    .escape()
    .notEmpty()
    .isLength({ min: 8 })
    .matches('(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+')
];

router.get("/", prefixDin.prefixDinamicUrl, controller.index);
router.get("/api/actualTime", controller.actualTime);

module.exports = router;  //para poder exportar la ruta a otros códigos