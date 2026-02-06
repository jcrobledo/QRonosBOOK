const dni = document.getElementById("dni");
const password = document.getElementById("password");

function validar() {
    if (dni.value !== "" && dni.value === password.value) {
        password.setCustomValidity("Usuario y contraseña no pueden coincidir");        
    } else {
        password.setCustomValidity("");
    }    
};

function validarDNI() {
    const dniInput = dni.value;    
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

    // 2. Extraer número y letra
    const numero = Number(dniInput.substring(0, 8));
    const letraIntroducida = dniInput.substring(8);

    if (numero !== "" && Number.isNaN(numero)) {
        dni.setCustomValidity("Los primeros 8 caracteres deben ser números");
        return;
    };

    const esLetraValida = /^[A-Z]$/.test(letraIntroducida);    

    if (letraIntroducida !== "" && !esLetraValida) {
        dni.setCustomValidity("El último carácter debe ser una letra en mayúsculas");        
        return;
    };

    // 3. Calcular la letra correcta
    const resto = numero % 23;
    const letraCorrecta = letras[resto];

    // 4. Comparar y mostrar resultado
    if (dniInput !== "" && dniInput.length < 9) {
        dni.setCustomValidity("DNI incompleto. 8 números y una letra mayúscula");        
        return;
    }
    if ((letraIntroducida == letraCorrecta) || (letraIntroducida == "undefined")) {
        dni.setCustomValidity("");
        return;
    } else {
        dni.setCustomValidity("DNI inválido. La letra correcta sería " + letraCorrecta + " mayúscula");        
        return;
    }
}

dni.addEventListener("blur", validarDNI);
password.addEventListener("blur", validar);

dni.addEventListener("input", () => dni.setCustomValidity(""));
password.addEventListener("input", () => password.setCustomValidity(""));

