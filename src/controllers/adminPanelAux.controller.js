const model = require("../models/user");

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
                title: "Gestión de Administradores",
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
            title: "Alta de Administradores",
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
        email: req.body.email
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

const listDepartamentos = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];

    const { sort, dir, page } = req.query;

    const currentSort = sort || 'nombre';
    const currentDir = dir || 'ASC';
    const currentPage = parseInt(page) || 1;
    const limit = 8;

    try {
        const { departamentos, totalCount } = await model.findAllDepTrabCount({
            sort: currentSort,
            dir: currentDir,
            limit: limit,
            offset: (currentPage - 1) * limit
        });

        const desde = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
        const hasta = Math.min(currentPage * limit, totalCount);

        if (isHTMX) {
            return res.render("partials/adminPanelAux/listaDepart", {
                title: "Gestión de Departamentos",
                layout: false,                
                userAdmin,
                departamentos,
                currentSort,
                currentDir,
                currentPage,
                desde,
                hasta,
                totalPages: Math.ceil(totalCount / limit),
                totalCount
            });
        }

        return res.render("partials/adminPanelAux/listaDepart", {
            title: "Gestión de Departamentos",
            layout: "./layouts/layout-adminPanel",            
            userAdmin,
            departamentos,
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

const altaDepartamentos = (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];

    if (isHTMX) {
        return res.render("partials/adminPanelAux/altaDepartamentos", {
            title: "Alta de Departamentos",
            layout: false,
            userAdmin
        });
    }

    return res.render("partials/adminPanelAux/altaDepartamentos", {
        title: "Alta de Departamentos",
        layout: "./layouts/layout-adminPanel",
        userAdmin
    });

};

/********************************************************************************************/

const createDepart = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];
    const nombreDep = req.body.nombre;

    try {

        let mensajeOK = null;
        let mensajeKO = null;
        const depExiste = await model.findDepByName(nombreDep);

        if (depExiste.length > 0) {
            mensajeKO = "Departamento NO CREADO. Ya hay uno con ese nombre"
        } else {
            mensajeOK = "Departamento dado de Alta CORRECTAMENTE"
            departamento = await model.createDep(nombreDep);
        };

        if (isHTMX) {
            return res.render('partials/adminPanelAux/confirmAltaDep', {
                title: "Alta de Departamentos",
                layout: false,
                nombreDep,
                mensajeOK,
                mensajeKO,
                userAdmin
            });
        }
        return res.render("partials/adminPanelAux/confirmAltaDep", {
            title: "Alta de Departamentos",
            layout: "./layouts/layout-adminPanel",
            nombreDep,
            mensajeOK,
            mensajeKO,
            userAdmin
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

const editarDepartamentos = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];
    const idDepartamento = req.params.id;

    try {

        const departamentoArray = await model.findDepById(idDepartamento);
        const departamento = departamentoArray[0];

        if (isHTMX) {
            return res.render('partials/adminPanelAux/editarDepartamentos', {
                title: "Editar Departamento",
                layout: false,
                departamento,
                userAdmin
            });
        };

        return res.render("partials/adminPanelAux/editarDepartamentos", {
            title: "Editar Departamento",
            layout: "./layouts/layout-adminPanel",
            departamento,
            userAdmin
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
        };

        return res.render("adminPanel/errorGeneral", {
            title: "Error General",
            layout: "./layouts/layout-adminPanel",
            userAdmin
        });
    };
};

/********************************************************************************************/

const updateDepart = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];
    const idDepartamento = req.params.id;
    const nombreDep = req.body.nombre;

    try {

        let mensajeOK = null;
        let mensajeKO = null;
        const depExiste = await model.findDepByName(nombreDep);

        if (depExiste.length > 0) {
            mensajeKO = "Departamento NO MODIFICADO. Ya hay uno con ese nombre"
        } else {
            mensajeOK = "Departamento Modificado CORRECTAMENTE"
            const result = await model.updateDep(idDepartamento, nombreDep);
        };

        if (isHTMX) {
            return res.render('partials/adminPanelAux/confirmEditDep', {
                title: "Editar Departamento",
                layout: false,
                nombreDep,
                mensajeOK,
                mensajeKO,
                userAdmin
            });
        }
        return res.render("partials/adminPanelAux/confirmEditDep", {
            title: "Editar Departamento",
            layout: "./layouts/layout-adminPanel",
            nombreDep,
            mensajeOK,
            mensajeKO,
            userAdmin
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
        };

        return res.render("adminPanel/errorGeneral", {
            title: "Error General",
            layout: "./layouts/layout-adminPanel",
            userAdmin
        });
    };
};

/********************************************************************************************/

const deleteDepart = async (req, res) => {

    const userAdmin = req.user.nombre + " " + req.user.apellidos;
    const isHTMX = req.headers['hx-request'];
    const id = req.params.id;

    try {

        const result = await model.deleteDepart(id);

        if (isHTMX) {
            return res.set('HX-Redirect', '/adminPanel/departamentos').send();
        }
        return res.redirect('/adminPanel/departamentos');

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
    deleteAdministradores,
    listDepartamentos,
    altaDepartamentos,
    createDepart,
    editarDepartamentos,
    updateDepart,    
    deleteDepart
};