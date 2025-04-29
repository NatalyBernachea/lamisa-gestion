require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const path = require('path');

const app = express();
// Usar el puerto de la variable de entorno PORT para servicios cloud
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_aqui';

// Base de datos en memoria
let ventas = [];
let compras = [];
const usuarios = [
    { username: 'admin', password: 'admin123' }
];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

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

// Ruta para descargar datos
app.get('/api/descargar-datos', autenticarToken, async (req, res) => {
    const { tipo } = req.query;
    const datos = tipo === 'ventas' ? ventas : compras;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tipo === 'ventas' ? 'Ventas' : 'Compras');
    
    if (tipo === 'ventas') {
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
    } else {
        worksheet.columns = [
            { header: 'ID', key: 'id' },
            { header: 'Fecha', key: 'fecha' },
            { header: 'Descripción', key: 'descripcion' },
            { header: 'Total', key: 'total' },
            { header: 'Documento', key: 'documento' },
            { header: 'Fecha de Registro', key: 'fechaRegistro' }
        ];
    }
    
    datos.forEach(item => worksheet.addRow(item));
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${tipo}.xlsx`);
    res.send(buffer);
});

// Servir archivos estáticos y manejar rutas del frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 