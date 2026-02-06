const express = require("express");
const router = express.Router();
const controller = require('../controllers/adminPanel.controller');

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

router.post("/", rules, controller.auth);
router.get("/", vToken.verifyTokenAdmin, controller.adminPage);
router.get("/logout", controller.logout);

module.exports = router;  //para poder exportar la ruta a otros códigos