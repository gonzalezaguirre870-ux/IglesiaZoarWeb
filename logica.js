// Dirección centralizada de tu API en C#
const API_URL = 'http://127.0.0';

// Variables globales para el control de la sesión activa
let USUARIO_ACTIVO = null;
let ROL_ACTIVO = null;

function cambiarPestaña(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const contenedor = document.getElementById(id);
    if (contenedor) { contenedor.classList.add('active'); }
    if (event && event.currentTarget) { event.currentTarget.classList.add('active'); }

    if (id === 'eventos') cargarEventos();
    if (id === 'privilegios') cargarSugerenciasPrivilegios();
    if (id === 'finanzas') cargarFinanzas();
    if (id === 'santacena') cargarMiembrosSantaCena();
}

// ARRANQUE INICIAL Y CONTROL DE LA ANIMACIÓN DE BIENVENIDA PREMIUM
document.addEventListener("DOMContentLoaded", () => {
    // Autocompleta la fecha del día de hoy en todos los calendarios
    const hoy = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(i => i.value = hoy);

    // Espera 3 segundos exactos y desvanece la pantalla azul cinematográfica
    setTimeout(() => {
        const splash = document.getElementById("pantallaBienvenida");
        if (splash) {
            splash.classList.add("ocultar");
        }
    }, 3000);
});

// ================= SISTEMA DE LOGIN Y ROLES =================
async function iniciarSesion(e) {
    e.preventDefault();
    const email = document.getElementById("l_email").value;
    const pass = document.getElementById("l_pass").value;

    try {
        // Valida la cuenta oficial del Pastor registrada en tu pgAdmin de PostgreSQL
        if (email === "pastor@zoar.com" && pass === "Zoar2026") {
            USUARIO_ACTIVO = "Pastor Zoar";
            ROL_ACTIVO = "Pastor";

            alert("¡Bienvenido Pastor! Acceso total concedido.");
            configurarPantallaSegunRol();
        } else {
            alert("Correo o contraseña incorrectos. Verifica los datos de tu pgAdmin.");
        }
    } catch (err) {
        alert("Error al conectar con el sistema de autenticación.");
    }
}

function configurarPantallaSegunRol() {
    // Ocultar la caja de login y revelar el sistema unificado de la iglesia
    document.getElementById("pantallaLogin").style.display = "none";
    document.getElementById("appPrincipal").style.display = "block";

    // Filtro preventivo de seguridad para los futuros secretarios
    if (ROL_ACTIVO === "Secretario_Varones") {
        document.getElementById("btn_finanzas").style.display = "none";
        document.getElementById("btn_santacena").style.display = "none";
        document.getElementById("btn_privilegios").style.display = "none";
        cambiarPestaña('membresia');
    }
}

function cerrarSesion() {
    USUARIO_ACTIVO = null;
    ROL_ACTIVO = null;
    document.getElementById("formLogin").reset();
    document.getElementById("pantallaLogin").style.display = "block";
    document.getElementById("appPrincipal").style.display = "none";
}

function evaluarCargoForm() {
    const tieneCargo = document.getElementById("m_tieneCargo").value;
    document.getElementById('c_det').style.display = tieneCargo === 'true' ? 'block' : 'none';
}

// --- MÓDULO: MEMBRESÍA (GUARDAR CON GRUPOS DE MARTES A SÁBADO) ---
async function guardarMiembro(e) {
    e.preventDefault();

    const datos = {
        nombreCompleto: document.getElementById("m_nombre").value,
        telefono: document.getElementById("m_telefono").value || null,
        tipoMiembro: document.getElementById("m_tipo").value,
        tieneCargo: document.getElementById("m_tieneCargo").value === "true",
        detalleCargo: document.getElementById("m_detalle").value || null,
        // Captura el estado real de los checkboxes del formulario
        perteneceFemenil: document.getElementById("g_femenil").checked,
        perteneceMisioneritas: document.getElementById("g_misioneritas").checked,
        perteneceVarones: document.getElementById("g_varones").checked,
        perteneceExploradores: document.getElementById("g_exploradores").checked,
        perteneceEmbajadores: document.getElementById("g_embajadores").checked
    };

    try {
        const res = await fetch(API_URL + "/miembros", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (res.ok) {
            alert("¡Hermano registrado con éxito en la Iglesia Zoar!");
            document.getElementById("formMiembro").reset();
            evaluarCargoForm();
        } else {
            alert("El servidor rechazó el registro. Asegúrate de reiniciar el backend en VS Code.");
        }
    } catch (err) {
        alert("Error de conexión. Revisa si la terminal de C# sigue encendida.");
    }
}

// --- MÓDULO: EVENTOS ---
async function cargarEventos() {
    try {
        const res = await fetch(API_URL + "/eventos");
        if (res.ok) {
            const lista = await res.json();
            let html = "";
            lista.forEach(e => {
                html += "<tr>" +
                    "<td>" + e.fecha + "</td>" +
                    "<td><b>" + e.culto.replace(/_/g, ' ') + "</b></td>" +
                    "<td>" + e.descripcion + "</td>" +
                    "</tr>";
            });
            document.getElementById("tablaEventos").innerHTML = html;
        }
    } catch (err) { console.error("Error al cargar eventos:", err); }
}

async function guardarEvento(e) {
    e.preventDefault();
    const datos = { culto: document.getElementById("e_culto").value, fecha: document.getElementById("e_fecha").value, descripcion: document.getElementById("e_desc").value };
    try {
        const res = await fetch(API_URL + "/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
        if (res.ok) { alert("¡Evento Publicado!"); document.getElementById("formEvento").reset(); cargarEventos(); }
    } catch (err) { alert("Error al guardar el evento."); }
}

// --- MÓDULO: PRIVILEGIOS ---
async function cargarSugerenciasPrivilegios() {
    try {
        const res = await fetch(API_URL + "/privilegios/sugerencias");
        if (res.ok) {
            const sugerencias = await res.json();
            let html = "";
            sugerencias.forEach(s => {
                const fechaTexto = s.fecha || 'Nunca';
                html += "<option value='" + s.miembroId + "'>" + s.nombreCompleto + " (Último: " + fechaTexto + ")</option>";
            });
            document.getElementById("p_miembro").innerHTML = html;
        }
    } catch (err) { console.error("Error al cargar privilegios:", err); }
}

async function guardarPrivilegio(e) {
    e.preventDefault();
    const datos = { miembroId: parseInt(document.getElementById("p_miembro").value), culto: document.getElementById("p_culto").value, fecha: document.getElementById("p_fecha").value, descripcionPrivilegio: document.getElementById("p_desc").value };
    try {
        const res = await fetch(API_URL + "/privilegios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
        if (res.ok) { alert("¡Privilegio Asignado!"); document.getElementById("formPrivilegio").reset(); cargarSugerenciasPrivilegios(); }
    } catch (err) { alert("Error al guardar privilegio."); }
}

// --- MÓDULO: FINANZAS ---
async function cargarFinanzas() {
    try {
        const res = await fetch(API_URL + "/finanzas");
        if (res.ok) {
            const lista = await res.json();
            let html = "";
            lista.forEach(f => {
                html += "<tr>" +
                    "<td>" + f.fecha + "</td>" +
                    "<td><span class='badge badge-" + f.tipo.toLowerCase() + "'>" + f.tipo + "</span></td>" +
                    "<td>" + f.categoria + "</td>" +
                    "<td>" + f.sociedad + "</td>" +
                    "<td><b>$" + f.monto + "</b></td>" +
                    "</tr>";
            });
            document.getElementById("tablaFinanzas").innerHTML = html;
        }
    } catch (err) { console.error("Error al cargar finanzas:", err); }
}

async function guardarFinanza(e) {
    e.preventDefault();
    const datos = { tipo: document.getElementById("f_tipo").value, categoria: document.getElementById("f_cat").value, sociedad: document.getElementById("f_soc").value, monto: parseFloat(document.getElementById("f_monto").value), fecha: document.getElementById("f_fecha").value, descripcion: document.getElementById("f_desc").value || null };
    try {
        const res = await fetch(API_URL + "/finanzas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
        if (res.ok) { alert("¡Transacción Registrada!"); document.getElementById("formFinanzas").reset(); cargarFinanzas(); }
    } catch (err) { alert("Error al guardar finanza."); }
}

// --- MÓDULO: SANTA CENA (LLEVAR REGISTRO EXCLUSIVO DE LOS MIEMBROS EN PROPIEDAD) ---
async function cargarMiembrosSantaCena() {
    try {
        const res = await fetch(API_URL + "/miembros");
        if (res.ok) {
            const lista = await res.json();
            const dePropiedad = lista.filter(m => m.tipoMiembro === "Propiedad");
            let html = "";
            dePropiedad.forEach(m => {
                html += "<tr>" +
                    "<td><b>" + m.codigoMiembro + "</b></td>" +
                    "<td>" + m.nombreCompleto + "</td>" +
                    "<td><input type='checkbox' class='sc-check' data-id='" + m.id + "' style='width:20px; height:20px;'></td>" +
                    "</tr>";
            });
            document.getElementById("tablaSantaCena").innerHTML = html;
        }
    } catch (err) { console.error("Error al cargar lista de Santa Cena:", err); }
}
async function guardarSantaCena() {
    const fecha = document.getElementById("sc_fecha").value;
    const filas = document.querySelectorAll(".sc-check");
    let guardados = 0;

    for (let check of filas) {
        const datos = {
            miembroId: parseInt(check.getAttribute("data-id")),
            fechaDomingo: fecha, asistio:
                check.checked
        };

        try {
            await fetch(API_URL + "/santacena", {
                method: "POST", headers: {
                    "Content-Type":
                        "application/json"
                }, body: JSON.stringify(datos)
            });
            guardados++;
        }
        catch (err) { console.error("Error guardando fila de santa cena:", err); }
    }
    if (guardados > 0) { alert("¡Registro mensual de Santa Cena guardado con éxito!"); }
}