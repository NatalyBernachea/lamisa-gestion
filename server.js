const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
// Usar el puerto de la variable de entorno PORT para servicios cloud
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_aqui';

// Configuración para Google Sheets
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SPREADSHEET_ID = 'TU_ID_DE_SPREADSHEET'; // Reemplazar con tu ID de Google Spreadsheet

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Base de datos simulada (en producción, usar una base de datos real)
let ventas = [];
let compras = [];
const usuarios = [
    { username: 'admin', password: 'admin123' }
];

// Función para inicializar el archivo Excel
async function initExcelFile() {
    const workbook = new ExcelJS.Workbook();
    const ventasPath = path.join(__dirname, 'registros', 'ventas.xlsx');
    const comprasPath = path.join(__dirname, 'registros', 'compras.xlsx');

    // Crear directorio si no existe
    if (!fs.existsSync(path.join(__dirname, 'registros'))) {
        fs.mkdirSync(path.join(__dirname, 'registros'));
    }

    // Inicializar archivo de ventas
    try {
        await workbook.xlsx.readFile(ventasPath);
    } catch (error) {
        const worksheet = workbook.addWorksheet('Ventas');
        worksheet.columns = [
            { header: 'ID', key: 'id' },
            { header: 'Fecha', key: 'fecha' },
            { header: 'Tipo de Servicio', key: 'tipoServicio' },
            { header: 'Cliente', key: 'nombreCliente' },
            { header: 'Teléfono', key: 'telefonoCliente' },
            { header: 'Peso (g)', key: 'peso' },
            { header: 'Precio por Gramo', key: 'precioUnitario' },
            { header: 'Total', key: 'total' },
            { header: 'Método de Pago', key: 'metodoPago' },
            { header: 'Fecha de Registro', key: 'fechaRegistro' }
        ];
        await workbook.xlsx.writeFile(ventasPath);
    }

    // Inicializar archivo de compras
    const workbookCompras = new ExcelJS.Workbook();
    try {
        await workbookCompras.xlsx.readFile(comprasPath);
    } catch (error) {
        const worksheet = workbookCompras.addWorksheet('Compras');
        worksheet.columns = [
            { header: 'ID', key: 'id' },
            { header: 'Fecha', key: 'fecha' },
            { header: 'Descripción', key: 'descripcion' },
            { header: 'Total', key: 'total' },
            { header: 'Documento', key: 'documento' },
            { header: 'Fecha de Registro', key: 'fechaRegistro' }
        ];
        await workbookCompras.xlsx.writeFile(comprasPath);
    }
}

// Función para guardar en Excel
async function guardarEnExcel(datos, tipo) {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, 'registros', `${tipo}.xlsx`);
    
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(tipo === 'ventas' ? 'Ventas' : 'Compras');
        
        if (tipo === 'ventas') {
            worksheet.addRow({
                id: datos.id,
                fecha: datos.fecha,
                tipoServicio: datos.tipoServicio,
                nombreCliente: datos.cliente.nombre,
                telefonoCliente: datos.cliente.telefono,
                peso: datos.peso,
                precioUnitario: datos.precioUnitario,
                total: datos.total,
                metodoPago: datos.metodoPago,
                fechaRegistro: datos.fechaRegistro
            });
        } else {
            worksheet.addRow({
                id: datos.id,
                fecha: datos.fecha,
                descripcion: datos.descripcion,
                total: datos.total,
                documento: datos.documento,
                fechaRegistro: datos.fechaRegistro
            });
        }
        
        await workbook.xlsx.writeFile(filePath);
    } catch (error) {
        console.error(`Error al guardar en Excel (${tipo}):`, error);
        throw error;
    }
}

// Middleware de autenticación
const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rutas
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const usuario = usuarios.find(u => u.username === username && u.password === password);

    if (!usuario) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
});

// Ruta para registrar ventas
app.post('/api/registrar-venta', autenticarToken, async (req, res) => {
    try {
        const venta = {
            id: Date.now(),
            ...req.body,
            fechaRegistro: new Date()
        };
        ventas.push(venta);
        
        // Guardar en Excel
        await guardarEnExcel(venta, 'ventas');
        
        res.status(201).json({ message: 'Venta registrada exitosamente', venta });
    } catch (error) {
        console.error('Error al registrar venta:', error);
        res.status(500).json({ message: 'Error al registrar la venta' });
    }
});

// Ruta para registrar compras
app.post('/api/registrar-compra', autenticarToken, async (req, res) => {
    try {
        const compra = {
            id: Date.now(),
            ...req.body,
            fechaRegistro: new Date()
        };
        compras.push(compra);
        
        // Guardar en Excel
        await guardarEnExcel(compra, 'compras');
        
        res.status(201).json({ message: 'Compra registrada exitosamente', compra });
    } catch (error) {
        console.error('Error al registrar compra:', error);
        res.status(500).json({ message: 'Error al registrar la compra' });
    }
});

// Ruta para obtener todas las ventas
app.get('/api/ventas', autenticarToken, (req, res) => {
    res.json(ventas);
});

// Ruta para obtener todas las compras
app.get('/api/compras', autenticarToken, (req, res) => {
    res.json(compras);
});

// Ruta para descargar Excel de ventas
app.get('/api/descargar-ventas', autenticarToken, (req, res) => {
    const filePath = path.join(__dirname, 'registros', 'ventas.xlsx');
    res.download(filePath, 'ventas.xlsx');
});

// Ruta para descargar Excel de compras
app.get('/api/descargar-compras', autenticarToken, (req, res) => {
    const filePath = path.join(__dirname, 'registros', 'compras.xlsx');
    res.download(filePath, 'compras.xlsx');
});

// Asegurarse de que todas las rutas no encontradas redirijan al index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar Excel y servidor
(async () => {
    try {
        await initExcelFile();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al inicializar el servidor:', error);
    }
})(); 