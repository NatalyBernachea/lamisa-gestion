const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

// Base de datos en memoria
let ventas = [];
let compras = [];
const usuarios = [
    { username: 'admin', password: 'admin123' }
];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Ruta para ventas
app.post('/api/ventas', autenticarToken, (req, res) => {
    try {
        const venta = {
            id: Date.now(),
            ...req.body,
            fechaRegistro: new Date()
        };
        ventas.push(venta);
        res.status(201).json(venta);
    } catch (error) {
        console.error('Error al registrar venta:', error);
        res.status(500).json({ message: 'Error al registrar la venta' });
    }
});

// Ruta para compras
app.post('/api/compras', autenticarToken, (req, res) => {
    try {
        const compra = {
            id: Date.now(),
            ...req.body,
            fechaRegistro: new Date()
        };
        compras.push(compra);
        res.status(201).json(compra);
    } catch (error) {
        console.error('Error al registrar compra:', error);
        res.status(500).json({ message: 'Error al registrar la compra' });
    }
});

// Ruta para obtener ventas
app.get('/api/ventas', autenticarToken, (req, res) => {
    try {
        let ventasFiltradas = [...ventas];
        
        // Si se proporciona fecha desde, filtrar las ventas
        if (req.query.desde) {
            const fechaDesde = new Date(req.query.desde);
            ventasFiltradas = ventas.filter(venta => {
                const fechaVenta = new Date(venta.fecha);
                return fechaVenta >= fechaDesde;
            });
        }
        
        // Ordenar por fecha descendente (más reciente primero)
        ventasFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        res.json(ventasFiltradas);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ message: 'Error al obtener las ventas' });
    }
});

// Obtener compras
app.get('/api/compras', autenticarToken, (req, res) => {
    try {
        let comprasFiltradas = [...compras];
        
        // Si se proporciona fecha desde, filtrar las compras
        if (req.query.desde) {
            const fechaDesde = new Date(req.query.desde);
            comprasFiltradas = compras.filter(compra => {
                const fechaCompra = new Date(compra.fecha);
                return fechaCompra >= fechaDesde;
            });
        }
        
        // Ordenar por fecha descendente (más reciente primero)
        comprasFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        res.json(comprasFiltradas);
    } catch (error) {
        console.error('Error al obtener compras:', error);
        res.status(500).json({ message: 'Error al obtener las compras' });
    }
});

// Obtener una compra específica
app.get('/api/compras/:id', autenticarToken, (req, res) => {
    try {
        const compra = compras.find(c => c.id === parseInt(req.params.id));
        if (!compra) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        res.json(compra);
    } catch (error) {
        console.error('Error al obtener compra:', error);
        res.status(500).json({ message: 'Error al obtener la compra' });
    }
});

// Ruta para obtener una venta específica
app.get('/api/ventas/:id', autenticarToken, (req, res) => {
    try {
        const venta = ventas.find(v => v.id === parseInt(req.params.id));
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        res.json(venta);
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ message: 'Error al obtener la venta' });
    }
});

// Ruta para actualizar una venta
app.put('/api/ventas/:id', autenticarToken, (req, res) => {
    try {
        const index = ventas.findIndex(v => v.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        
        ventas[index] = {
            ...ventas[index],
            ...req.body,
            id: ventas[index].id, // Mantener el ID original
            fechaActualizacion: new Date()
        };
        
        res.json(ventas[index]);
    } catch (error) {
        console.error('Error al actualizar venta:', error);
        res.status(500).json({ message: 'Error al actualizar la venta' });
    }
});

// Ruta para eliminar una venta
app.delete('/api/ventas/:id', autenticarToken, (req, res) => {
    try {
        const index = ventas.findIndex(v => v.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        
        ventas.splice(index, 1);
        res.json({ message: 'Venta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar venta:', error);
        res.status(500).json({ message: 'Error al eliminar la venta' });
    }
});

// Actualizar una compra
app.put('/api/compras/:id', autenticarToken, (req, res) => {
    try {
        const index = compras.findIndex(c => c.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        
        compras[index] = {
            ...compras[index],
            ...req.body,
            id: compras[index].id, // Mantener el ID original
            fechaActualizacion: new Date()
        };
        
        res.json(compras[index]);
    } catch (error) {
        console.error('Error al actualizar compra:', error);
        res.status(500).json({ message: 'Error al actualizar la compra' });
    }
});

// Eliminar una compra
app.delete('/api/compras/:id', autenticarToken, (req, res) => {
    try {
        const index = compras.findIndex(c => c.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }
        
        compras.splice(index, 1);
        res.json({ message: 'Compra eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar compra:', error);
        res.status(500).json({ message: 'Error al eliminar la compra' });
    }
});

// Descargar Excel de ventas
app.get('/api/ventas/excel', autenticarToken, async (req, res) => {
    try {
        // Ordenar todas las ventas por fecha descendente
        const ventasOrdenadas = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ventas');
        
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha' },
            { header: 'Tipo de Servicio', key: 'tipoServicio' },
            { header: 'Cliente', key: 'cliente' },
            { header: 'Teléfono', key: 'telefono' },
            { header: 'Peso (g)', key: 'peso' },
            { header: 'Total', key: 'total' },
            { header: 'Método de Pago', key: 'metodoPago' }
        ];
        
        ventasOrdenadas.forEach(venta => worksheet.addRow(venta));
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ventas.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar Excel:', error);
        res.status(500).json({ message: 'Error al generar el archivo Excel' });
    }
});

// Descargar Excel de compras
app.get('/api/compras/excel', autenticarToken, async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Compras');
        
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha' },
            { header: 'Descripción', key: 'descripcion' },
            { header: 'Total', key: 'total' },
            { header: 'Documento', key: 'documento' }
        ];
        
        compras.forEach(compra => worksheet.addRow(compra));
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=compras.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar Excel:', error);
        res.status(500).json({ message: 'Error al generar el archivo Excel' });
    }
});

// Servir archivos estáticos y manejar rutas del frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
