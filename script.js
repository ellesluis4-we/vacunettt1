// ============================================
// BUSCADOR
// ============================================
function normalizarTexto(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function paginaActual() {
  const partes = window.location.pathname.split('/');
  return partes[partes.length - 1] || 'index.html';
}

// Secciones del menú que el buscador puede encontrar y a las que puede redirigir
const SECCIONES_SITIO = [
  { claves: ['inicio', 'home', 'pagina principal'], url: 'index.html', etiqueta: 'Inicio' },
  { claves: ['vacunas disponibles', 'vacunas', 'catalogo', 'catalogo de vacunas'], url: 'vacunas.html', etiqueta: 'Vacunas Disponibles' },
  { claves: ['resultados', 'consultar resultados', 'mi resultado', 'mis vacunas'], url: 'resultados.html', etiqueta: 'Resultados' },
  { claves: ['conocenos', 'nosotros', 'quienes somos', 'sobre nosotros'], url: 'conocenos.html', etiqueta: 'Conócenos' }
];

function buscarSeccionesCoincidentes(texto) {
  if (!texto) return [];
  return SECCIONES_SITIO.filter(seccion =>
    seccion.claves.some(clave => {
      const claveNormalizada = normalizarTexto(clave);
      return claveNormalizada.includes(texto) || texto.includes(claveNormalizada);
    })
  );
}

function buscarVacunasCoincidentes(texto) {
  if (!texto) return [];
  return Array.from(document.querySelectorAll('.producto'))
    .filter(el => normalizarTexto(el.dataset.nombre).includes(texto))
    .map(el => {
      const titulo = el.querySelector('h3');
      return { etiqueta: titulo ? titulo.textContent : el.dataset.nombre, elemento: el };
    });
}

function crearContenedorSugerencias() {
  const buscadorDiv = document.querySelector('.buscador');
  if (!buscadorDiv) return null;

  let contenedor = document.getElementById('buscadorSugerencias');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'buscadorSugerencias';
    contenedor.className = 'buscador-sugerencias';
    buscadorDiv.appendChild(contenedor);
  }
  return contenedor;
}

function cerrarSugerencias() {
  const contenedor = document.getElementById('buscadorSugerencias');
  if (contenedor) contenedor.classList.remove('activo');
}

function actualizarSugerenciasBusqueda() {
  const input = document.getElementById('buscar-input');
  const contenedor = crearContenedorSugerencias();
  if (!input || !contenedor) return;

  const texto = normalizarTexto(input.value);

  if (!texto) {
    contenedor.innerHTML = '';
    contenedor.classList.remove('activo');
    return;
  }

  const secciones = buscarSeccionesCoincidentes(texto);
  const enVacunas = paginaActual() === 'vacunas.html';
  const vacunas = buscarVacunasCoincidentes(texto);

  if (secciones.length === 0 && vacunas.length === 0) {
    contenedor.innerHTML = '<p class="sugerencia-vacia">Sin coincidencias en el menú ni en las vacunas.</p>';
    contenedor.classList.add('activo');
    return;
  }

  let html = '';

  secciones.forEach(seccion => {
    html += `
      <button type="button" class="sugerencia-item" data-url="${seccion.url}">
        <span class="sugerencia-icono">📄</span> ${seccion.etiqueta}
      </button>`;
  });

  // Si ya estamos viendo el catálogo, las vacunas se filtran solas en la grilla;
  // no hace falta duplicarlas también en la lista de sugerencias.
  if (!enVacunas) {
    vacunas.forEach(v => {
      html += `
        <button type="button" class="sugerencia-item" data-url="vacunas.html?buscar=${encodeURIComponent(v.etiqueta)}">
          <span class="sugerencia-icono">💉</span> ${v.etiqueta}
        </button>`;
    });
  }

  contenedor.innerHTML = html;
  contenedor.classList.add('activo');

  contenedor.querySelectorAll('.sugerencia-item[data-url]').forEach(boton => {
    boton.addEventListener('click', function () {
      window.location.href = this.dataset.url;
    });
  });
}

function irAMejorCoincidencia() {
  const input = document.getElementById('buscar-input');
  if (!input) return;

  const texto = normalizarTexto(input.value);
  if (!texto) return;

  const secciones = buscarSeccionesCoincidentes(texto);
  if (secciones.length > 0) {
    window.location.href = secciones[0].url;
    return;
  }

  if (paginaActual() !== 'vacunas.html') {
    const vacunas = buscarVacunasCoincidentes(texto);
    if (vacunas.length > 0) {
      window.location.href = 'vacunas.html?buscar=' + encodeURIComponent(input.value.trim());
    }
  }
}

function mostrarProducto(producto) {
  const yaVisible = producto.style.display !== 'none' && !producto.classList.contains('oculto');
  if (yaVisible) return;

  producto.style.display = '';
  producto.classList.add('oculto');
  // Forzamos un reflow para que el navegador registre el estado "oculto"
  // antes de quitarlo, y así la transición de aparición se reproduzca.
  void producto.offsetWidth;
  producto.classList.remove('oculto');
}

function ocultarProducto(producto) {
  if (producto.style.display === 'none') return;

  producto.classList.add('oculto');
  window.setTimeout(() => {
    if (producto.classList.contains('oculto')) {
      producto.style.display = 'none';
    }
  }, 300);
}

function filtrarProductos() {
  const inputBuscar = document.getElementById('buscar-input');
  if (!inputBuscar) return;

  actualizarSugerenciasBusqueda();

  const productos = document.querySelectorAll('.producto');
  if (productos.length === 0) return;

  const texto = normalizarTexto(inputBuscar.value);
  let visibles = 0;

  productos.forEach(producto => {
    const nombre = normalizarTexto(producto.dataset.nombre);
    const coincide = nombre.includes(texto);

    if (coincide) {
      visibles++;
      mostrarProducto(producto);
    } else {
      ocultarProducto(producto);
    }
  });

  mostrarMensajeSinResultados(texto !== '' && visibles === 0);
}

function mostrarMensajeSinResultados(mostrar) {
  const grid = document.querySelector('.vacunas-grid');
  if (!grid) return;

  let mensaje = document.getElementById('sin-resultados');

  if (mostrar) {
    if (!mensaje) {
      mensaje = document.createElement('p');
      mensaje.id = 'sin-resultados';
      mensaje.className = 'sin-resultados';
      mensaje.textContent = 'Vacuna no disponible.';
      grid.appendChild(mensaje);
    }
    mensaje.style.display = 'block';
  } else if (mensaje) {
    mensaje.style.display = 'none';
  }
}

// Conecta el Enter, el cierre al hacer clic afuera, y aplica una búsqueda
// que llegó por la URL (?buscar=...) al entrar a vacunas.html desde otra página.
document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('buscar-input');
  if (!input) return;

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      irAMejorCoincidencia();
    }
  });

  input.addEventListener('focus', actualizarSugerenciasBusqueda);

  document.addEventListener('click', function (e) {
    const buscadorDiv = document.querySelector('.buscador');
    if (buscadorDiv && !buscadorDiv.contains(e.target)) {
      cerrarSugerencias();
    }
  });

  const parametros = new URLSearchParams(window.location.search);
  const consulta = parametros.get('buscar');
  if (consulta) {
    input.value = consulta;
    filtrarProductos();
  }
});

// ============================================
// MENÚ DESPLEGABLE (nav)
// ============================================
function toggleMenu() {
  const menu = document.getElementById('menuDropdown');
  menu.classList.toggle('abierto');
}

// Cierra el menú si se hace clic fuera de él
document.addEventListener('click', (e) => {
  const menu = document.getElementById('menuDropdown');
  const container = document.querySelector('.menu-container');
  if (menu && container && !container.contains(e.target)) {
    menu.classList.remove('abierto');
  }
});

// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const formRegistro = document.getElementById('form-registro');

  if (formRegistro) {
    formRegistro.addEventListener('submit', function (e) {
      e.preventDefault();

      const password = document.getElementById('password').value;
      const confirmarPassword = document.getElementById('confirmar-password').value;

      if (password !== confirmarPassword) {
        alert('Las contraseñas no coinciden. Por favor verifica.');
        return;
      }

      const usuario = {
        nombre: document.getElementById('nombre').value,
        tipoDocumento: document.getElementById('tipo-documento').value,
        numeroDocumento: document.getElementById('numero-documento').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        password: password
      };

      localStorage.setItem('vacunet_usuario', JSON.stringify(usuario));
      localStorage.setItem('vacunet_sesion', 'activa');

      alert('¡Cuenta creada exitosamente! Bienvenido a VacuNet.');
      window.location.href = 'index.html';
    });
  }
});

// ============================================
// CUENTA DE USUARIO (avatar en el nav)
// ============================================
function obtenerIniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function renderCuenta() {
  const contenedor = document.getElementById('cuentaContainer');
  if (!contenedor) return;

  const sesionActiva = localStorage.getItem('vacunet_sesion') === 'activa';
  const usuario = JSON.parse(localStorage.getItem('vacunet_usuario') || 'null');

  if (sesionActiva && usuario) {
    const iniciales = obtenerIniciales(usuario.nombre);
    const foto = usuario.foto;

    contenedor.innerHTML = `
      <div class="avatar-container">
        <button class="avatar-toggle" onclick="toggleAvatarMenu()">
          ${foto
            ? `<img src="${foto}" class="avatar-img" alt="Foto de perfil" onerror="this.outerHTML='<span class=&quot;avatar-iniciales&quot;>${iniciales}</span>'">`
            : `<span class="avatar-iniciales">${iniciales}</span>`}
        </button>
        <div class="avatar-dropdown" id="avatarDropdown">
          <div class="avatar-perfil">
            ${foto
              ? `<img src="${foto}" class="avatar-img-grande" alt="Foto de perfil" onerror="this.outerHTML='<span class=&quot;avatar-iniciales-grande&quot;>${iniciales}</span>'">`
              : `<span class="avatar-iniciales-grande">${iniciales}</span>`}
            <label for="input-foto-perfil" class="cambiar-foto-label">Cambiar foto</label>
            <input type="file" id="input-foto-perfil" accept="image/*" style="display:none;">
          </div>

          <div class="avatar-datos" id="avatarDatosVista">
            <p><strong>Nombre:</strong> ${usuario.nombre || ''}</p>
            <p><strong>Documento:</strong> ${usuario.tipoDocumento || ''} ${usuario.numeroDocumento || ''}</p>
            <p><strong>Correo:</strong> ${usuario.correo || ''}</p>
            <p><strong>Teléfono:</strong> ${usuario.telefono || ''}</p>
          </div>

          <form class="avatar-editar-form" id="avatarEditarForm" style="display:none;">
            <label for="editar-nombre">Nombre completo</label>
            <input type="text" id="editar-nombre" value="${usuario.nombre || ''}" required>

            <label for="editar-correo">Correo electrónico</label>
            <input type="email" id="editar-correo" value="${usuario.correo || ''}" required>

            <label for="editar-telefono">Teléfono</label>
            <input type="tel" id="editar-telefono" value="${usuario.telefono || ''}" inputmode="numeric" pattern="[0-9]*" maxlength="10" required>

            <div class="avatar-editar-acciones">
              <button type="button" class="btn-cancelar-datos" onclick="cancelarEdicionPerfil()">Cancelar</button>
              <button type="submit" class="btn-guardar-datos">Guardar</button>
            </div>
          </form>

          <div class="avatar-acciones" id="avatarAcciones">
            <button class="btn-editar-datos" onclick="editarPerfil()">Actualizar datos</button>
            <button class="btn-cerrar-sesion" onclick="cerrarSesion()">Cerrar sesión</button>
          </div>
        </div>
      </div>
    `;

    const inputFoto = document.getElementById('input-foto-perfil');
    inputFoto.addEventListener('change', function (e) {
      const archivo = e.target.files[0];
      if (archivo) {
        const lector = new FileReader();
        lector.onload = function (evento) {
          usuario.foto = evento.target.result;
          localStorage.setItem('vacunet_usuario', JSON.stringify(usuario));
          renderCuenta();
          const dropdown = document.getElementById('avatarDropdown');
          if (dropdown) dropdown.classList.add('activo');
        };
        lector.readAsDataURL(archivo);
      }
    });

    const formEditarPerfil = document.getElementById('avatarEditarForm');
    formEditarPerfil.addEventListener('submit', function (e) {
      e.preventDefault();

      const nuevoNombre = document.getElementById('editar-nombre').value.trim();
      const nuevoCorreo = document.getElementById('editar-correo').value.trim();
      const nuevoTelefono = document.getElementById('editar-telefono').value.trim();

      if (!nuevoNombre || !nuevoCorreo || !nuevoTelefono) {
        alert('Por favor completa todos los campos.');
        return;
      }

      usuario.nombre = nuevoNombre;
      usuario.correo = nuevoCorreo;
      usuario.telefono = nuevoTelefono;
      localStorage.setItem('vacunet_usuario', JSON.stringify(usuario));

      // Si el correo guardado para "Recordarme" era el anterior, lo actualizamos también
      if (localStorage.getItem('vacunet_correo')) {
        localStorage.setItem('vacunet_correo', nuevoCorreo);
      }

      renderCuenta();
      const dropdown = document.getElementById('avatarDropdown');
      if (dropdown) dropdown.classList.add('activo');
    });
  } else {
    contenedor.innerHTML = `<a href="iniciar-sesion.html" class="btn">Iniciar sesion</a>`;
  }
}

function toggleAvatarMenu() {
  document.getElementById('avatarDropdown').classList.toggle('activo');
}

// ============================================
// ACTUALIZAR DATOS DEL USUARIO
// ============================================
function editarPerfil() {
  document.getElementById('avatarDatosVista').style.display = 'none';
  document.getElementById('avatarAcciones').style.display = 'none';
  document.getElementById('avatarEditarForm').style.display = 'flex';
}

function cancelarEdicionPerfil() {
  document.getElementById('avatarEditarForm').style.display = 'none';
  document.getElementById('avatarDatosVista').style.display = 'flex';
  document.getElementById('avatarAcciones').style.display = 'flex';
}

function cerrarSesion() {
  localStorage.removeItem('vacunet_sesion');
  window.location.href = 'index.html';
}

document.addEventListener('click', function (e) {
  const dropdown = document.getElementById('avatarDropdown');
  const toggle = document.querySelector('.avatar-toggle');
  if (dropdown && toggle && !dropdown.contains(e.target) && !toggle.contains(e.target)) {
    dropdown.classList.remove('activo');
  }
});

document.addEventListener('DOMContentLoaded', renderCuenta);

// ============================================
// ANIMACIONES: SCROLL REVEAL + RIPPLE EN BOTONES
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observador.observe(el));

  document.querySelectorAll('.btn, .btn-hero').forEach(boton => {
    boton.addEventListener('click', function (e) {
      const onda = document.createElement('span');
      onda.classList.add('ripple');
      const rect = this.getBoundingClientRect();
      onda.style.left = (e.clientX - rect.left) + 'px';
      onda.style.top = (e.clientY - rect.top) + 'px';
      this.appendChild(onda);
      setTimeout(() => onda.remove(), 600);
    });
  });
});