const model = require("../models/user");
const { validationResult } = require('express-validator');

/********************************************************************************************/

const listAdministradores = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];

    const { sort, dir, page } = req.query;

    const currentSort = sort || 'dni';
    const currentDir = dir || 'ASC';
    const currentPage = parseInt(page) || 1;
    const limit = 8;

    try {
        const { administradores, totalCount } = await model.findAllAdmin({
            sort: currentSort,
            dir: currentDir,
            limit: limit,
            offset: (currentPage - 1) * limit
        });

        const desde = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
        const hasta = Math.min(currentPage * limit, totalCount);

        const adminsFormateados = administradores.map(admin => ({
            ...admin,
            createdAt: new Date(admin.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-')
        }));

        if (isHTMX) {
            return res.render("partials/adminPanelAux/listaAdmin", {
                layout: false,
                userAdmin,
                administradores: adminsFormateados,
                currentSort,
                currentDir,
                currentPage,
                desde,
                hasta,
                totalPages: Math.ceil(totalCount / limit),
                totalCount
            });
        }

        return res.render("partials/adminPanelAux/listaAdmin", {
            title: "Gestión de Administradores",
            layout: "./layouts/layout-adminPanel",
            userAdmin,
            administradores: adminsFormateados,
            currentSort,
            currentDir,
            currentPage,
            desde,
            hasta,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });

    } catch (error) {
        console.error("Error general de acceso a BBDD:", error);
        if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('adminPanel/errorGeneral', {
                title: "Error General",
                layout: false,
                userAdmin
            });
        }
        return res.render("adminPanel/errorGeneral", {
            title: "Error General",
            layout: "./layouts/layout-adminPanel",
            userAdmin
        });
    };

};

/********************************************************************************************/

const buscarAdministradores = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];

    let administrador = null;
    let trabajador = null;
    let mensajeError = null;
    let mensajeOK = null;

    if (req.method === 'POST') {
        const dni = req.body.dni;

        try {

            trabajador = await model.findByDniTrab(dni);
            administrador = await model.findByDniAdmin(dni);

            if (!trabajador) {
                mensajeError = "No EXISTE ningún Trabajador con ese DNI"
            } else if (administrador) {
                mensajeError = "Trabajador YA está dado de ALTA como Administrador";
            } else {
                mensajeOK = "OK";
                administrador = trabajador;
            };

        } catch (error) {
            console.error("Error general de acceso a BBDD:", error);
            if (isHTMX) {
                res.setHeader('HX-Retarget', '#secContenido');
                return res.render('adminPanel/errorGeneral', {
                    title: "Error General",
                    layout: false,
                    userAdmin
                });
            }
            return res.render("adminPanel/errorGeneral", {
                title: "Error General",
                layout: "./layouts/layout-adminPanel",
                userAdmin
            });
        };
    };

    if (isHTMX) {
        return res.render('partials/adminPanelAux/buscarAdmin', {
            layout: false,
            administrador,
            mensajeError,
            mensajeOK,
            userAdmin
        });
    }
    return res.render("partials/adminPanelAux/buscarAdmin", {
        title: "Alta de Administradores",
        layout: "./layouts/layout-adminPanel",
        administrador,
        mensajeError,
        mensajeOK,
        userAdmin
    });

};

/********************************************************************************************/

const createAdministradores = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];

    const administrador = {
        dni: req.body.dni,
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        email: req.body.apellidos
    };

    try {

        const creaAdmin = await model.createAdmin(administrador.dni);
        const mensajeExito = "Trabajador dado de ALTA como Administrador<br>CORRECTAMENTE";


        if (isHTMX) {
            res.setHeader('HX-Replace-Url', '/adminPanel/administradores');
            return res.render('partials/adminPanelAux/confirmAltaAdmin', {
                title: "Alta de Administradores",
                layout: false,
                userAdmin,
                administrador,
                mensajeExito
            });
        };

        return res.render("partials/adminPanelAux/confirmAltaAdmin", {
            title: "Alta de Administradores",
            layout: "./layouts/layout-adminPanel",
            userAdmin,
            administrador,
            mensajeExito
        });

    } catch (error) {
        console.error("Error general de acceso a BBDD:", error);
        if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('adminPanel/errorGeneral', {
                title: "Error General",
                layout: false,
                userAdmin
            });
        }
        return res.render("adminPanel/errorGeneral", {
            title: "Error General",
            layout: "./layouts/layout-adminPanel",
            userAdmin
        });
    };

};

/********************************************************************************************/

const deleteAdministradores = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];
    const dni = req.params.dni;

    try {

        const result = await model.deleteAdmin(dni);

        if (isHTMX) {
            return res.set('HX-Redirect', '/adminPanel/administradores').send();
        }
        return res.redirect('/adminPanel/administradores');

    } catch (error) {
        console.error("Error general de acceso a BBDD:", error);
        if (isHTMX) {
            res.setHeader('HX-Retarget', '#secContenido');
            return res.render('adminPanel/errorGeneral', {
                title: "Error General",
                layout: false,
                userAdmin
            });
        }
        return res.render("adminPanel/errorGeneral", {
            title: "Error General",
            layout: "./layouts/layout-adminPanel",
            userAdmin
        });
    };

};

/********************************************************************************************/

module.exports = {
    listAdministradores,
    buscarAdministradores,
    createAdministradores,
    deleteAdministradores
};