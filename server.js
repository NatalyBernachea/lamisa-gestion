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
