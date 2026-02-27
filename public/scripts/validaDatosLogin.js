const myForm = document.getElementById("myForm");
const myFormKey = document.getElementById("myFormKey"); 
const dni = document.getElementById("dni");
const password = document.getElementById("password");
const nombreKey = document.getElementById("nombreKey");

function validar() {
    if (!dni || !password) return;

    if (dni.value !== "" && dni.value === password.value) {
        password.setCustomValidity("Usuario y contraseña no pueden coincidir");        
    } else {
        password.setCustomValidity("");
    }    
};

function validarDNI() {
    if (!dni) return true; 
    
    const dniInput = dni.value;    
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

    // 2. Extraer número y letra
    const numero = Number(dniInput.substring(0, 8));
    const letraIntroducida = dniInput.substring(8);

    if (numero !== "" && Number.isNaN(numero)) {
        dni.setCustomValidity("Los primeros 8 caracteres deben ser números");
        return false;
    };

    const esLetraValida = /^[A-Z]$/.test(letraIntroducida);    

    if (letraIntroducida !== "" && !esLetraValida) {
        dni.setCustomValidity("El último carácter debe ser una letra en mayúsculas");        
        return false;
    };

    // 3. Calcular la letra correcta
    const resto = numero % 23;
    const letraCorrecta = letras[resto];

    // 4. Comparar y mostrar resultado
    if (dniInput !== "" && dniInput.length < 9) {
        dni.setCustomValidity("DNI incompleto. 8 números y una letra mayúscula");        
        return false;
    }
    if ((letraIntroducida == letraCorrecta) || (letraIntroducida == "undefined")) {
        dni.setCustomValidity("");
        return true;
    } else {
        dni.setCustomValidity("DNI inválido. La letra correcta sería " + letraCorrecta + " mayúscula");        
        return false;
    }    
}

function validarKEY() {
    if (!nombreKey) return true;       
    
    const patron = /^\d{6}$/;

    if (!patron.test(nombreKey.value)) {
        nombreKey.setCustomValidity("6 números consecutivos y sin espacios");
        return false;
    } else {
        nombreKey.setCustomValidity("");
        return true;
    };      
};

if (dni) {
    dni.addEventListener("blur", validarDNI);
    dni.addEventListener("input", function() { dni.setCustomValidity(""); });
}

if (nombreKey) {
    nombreKey.addEventListener("blur", validarKEY);
    nombreKey.addEventListener("input", function() { validarKEY.setCustomValidity(""); });
}

if (password) {
    password.addEventListener("blur", validar);
    password.addEventListener("input", function() { password.setCustomValidity(""); });
}

if (myForm) {
    myForm.addEventListener('submit', function(e) {        
        var esDniValido = validarDNI(); 
        if (esDniValido === false) {
            e.preventDefault(); 
            dni.reportValidity(); 
        } else {            
            var loader = document.getElementById('loader-overlay');
            if (loader) {
                const loaderTexto = document.getElementById('mensaje-loader');    
                loaderTexto.innerText = "Enviando correo";
                loader.style.display = 'flex';
            }            
        }
    });
}

if (myFormKey) {
    myFormKey.addEventListener('submit', function(e) {        
        var esKeyValido = validarKEY(); 
        if (esKeyValido === false) {
            e.preventDefault(); 
            nombreKey.reportValidity(); 
        } else {            
            var loader = document.getElementById('loader-overlay');
            if (loader) {
                const loaderTexto = document.getElementById('mensaje-loader');    
                loaderTexto.innerText = "Guardando Fichaje...";
                loader.style.display = 'flex';
            }            
        }
    });
}