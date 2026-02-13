async function actualizarReloj() {
    try {
        const response = await fetch('/codigosQR/api/actualTime'); 
        const data = await response.json();        
        document.getElementById('reloj').innerText = data.hora;        
    } catch (error) {
        console.error("Error al obtener la hora:", error);
    }
};

setInterval(actualizarReloj, 1000); // Llama a actualizarReloj cada segundo (1000 ms)
actualizarReloj(); // Llama una vez al cargar la página para evitar retraso inicial