// Estado de la aplicación
let currentUser = null;
let isAdmin = false;
let authToken = null;

// Elementos del DOM
const loginModal = document.getElementById('loginModal');
const mainContent = document.getElementById('mainContent');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const modalContainer = document.getElementById('modalContainer');

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Templates de modales
const modalTemplates = {
    laminado: `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Registrar Laminado</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="laminadoForm">
                    <div class="form-group">
                        <label class="form-label">Nombre del Cliente</label>
                        <input type="text" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Peso</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo de Laminado</label>
                        <select class="form-select" required>
                            <option value="">Seleccione...</option>
                            <option value="fino">Fino</option>
                            <option value="medio">Medio</option>
                            <option value="grueso">Grueso</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <button type="submit" class="btn-primary">Guardar</button>
                </form>
            </div>
        </div>
    `,
    estampado: `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Registrar Estampado</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="estampadoForm">
                    <div class="form-group">
                        <label class="form-label">Nombre del Cliente</label>
                        <input type="text" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tiempo (minutos)</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <button type="submit" class="btn-primary">Guardar</button>
                </form>
            </div>
        </div>
    `,
    venta: `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Registrar Venta de Plata</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="ventaForm">
                    <div class="form-group">
                        <label class="form-label">Nombre del Cliente</label>
                        <input type="text" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Peso</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <button type="submit" class="btn-primary">Guardar</button>
                </form>
            </div>
        </div>
    `,
    compra: `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Registrar Compra</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="compraForm">
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <input type="text" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cantidad</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Costo Total</label>
                        <input type="number" class="form-input" required>
                    </div>
                    <button type="submit" class="btn-primary">Guardar</button>
                </form>
            </div>
        </div>
    `,
    resumen: `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Resumen de Operaciones</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="filters">
                    <div class="filter-group">
                        <label class="filter-label">Tipo de Servicio</label>
                        <select class="form-select">
                            <option value="">Todos</option>
                            <option value="laminado">Laminado</option>
                            <option value="estampado">Estampado</option>
                            <option value="venta">Venta de Plata</option>
                            <option value="compra">Compra</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Cliente</label>
                        <input type="text" class="form-input">
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Fecha Desde</label>
                        <input type="date" class="form-input">
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Fecha Hasta</label>
                        <input type="date" class="form-input">
                    </div>
                </div>
                <table class="resumen-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Cliente</th>
                            <th>Detalles</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Los datos se cargarán dinámicamente -->
                    </tbody>
                </table>
            </div>
        </div>
    `
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay una sesión activa
    const session = localStorage.getItem('session');
    if (session) {
        const { user, admin, token } = JSON.parse(session);
        handleLogin(user, admin, token);
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target[0].value;
        const password = e.target[1].value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                handleLogin(username, data.isAdmin, data.token);
            } else {
                alert(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            alert('Error de conexión con el servidor');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        handleLogout();
    });

    // Botones de acción
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalType = btn.dataset.modal;
            if (modalType) {
                showModal(modalType);
            }
        });
    });
});

// Funciones
function handleLogin(username, admin, token) {
    currentUser = username;
    isAdmin = admin;
    authToken = token;
    
    // Guardar sesión
    localStorage.setItem('session', JSON.stringify({
        user: username,
        admin: admin,
        token: token
    }));
    
    // Actualizar UI
    loginModal.classList.add('hidden');
    mainContent.classList.remove('hidden');
}

function handleLogout() {
    currentUser = null;
    isAdmin = false;
    authToken = null;
    localStorage.removeItem('session');
    
    // Actualizar UI
    mainContent.classList.add('hidden');
    loginModal.classList.remove('hidden');
}

async function showModal(type) {
    if (!modalTemplates[type]) return;
    
    modalContainer.innerHTML = modalTemplates[type];
    const modal = modalContainer.firstElementChild;
    
    // Cerrar modal
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modalContainer.innerHTML = '';
    });
    
    // Manejar submit del formulario
    const form = modal.querySelector('form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch(`${API_URL}/registrar-operacion`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        tipo: type,
                        datos: data
                    })
                });

                const result = await response.json();
                
                if (response.ok) {
                    alert('Operación registrada exitosamente');
                    modalContainer.innerHTML = '';
                } else {
                    alert(result.message || 'Error al registrar la operación');
                }
            } catch (error) {
                alert('Error de conexión con el servidor');
            }
        });
    }
}

// Función para descargar Excel
document.getElementById('downloadExcel').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/descargar-excel`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lamisa-reporte.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            const data = await response.json();
            alert(data.message || 'Error al descargar el Excel');
        }
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
}); 