# Sistema de Gestión LAMISA

Sistema de gestión interno para el control de ventas y compras de LAMISA.

## Características

- Registro de ventas con diferentes tipos de servicios (Laminado, Estampado, Venta de Material)
- Registro de compras y gastos
- Exportación automática a Excel
- Sistema de autenticación de usuarios
- Interfaz moderna y responsiva

## Requisitos

- Node.js (versión 12 o superior)
- NPM (Node Package Manager)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/lamisa-gestion.git
cd lamisa-gestion
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar el servidor:
```bash
node server.js
```

4. Acceder a la aplicación:
Abrir el navegador y visitar `http://localhost:3000`

## Credenciales de Acceso

- Usuario: `admin`
- Contraseña: `admin123`

## Estructura del Proyecto

```
lamisa-gestion/
├── public/              # Archivos estáticos
│   ├── index.html      # Página de inicio/login
│   ├── dashboard.html  # Panel de control
│   ├── venta.html     # Formulario de ventas
│   └── styles.css     # Estilos CSS
├── registros/          # Archivos Excel (generados automáticamente)
├── server.js          # Servidor Express
├── package.json       # Dependencias del proyecto
└── README.md         # Documentación
```

## Dependencias Principales

- Express.js - Framework web
- ExcelJS - Generación de archivos Excel
- JWT - Autenticación de usuarios
- Body-parser - Procesamiento de datos POST
- CORS - Manejo de solicitudes cross-origin

## Funcionalidades

### Ventas
- Registro de diferentes tipos de servicios
- Cálculo automático de totales
- Campos opcionales para información del cliente
- Exportación automática a Excel

### Compras
- Registro de gastos y compras
- Documentación de facturas/boletas
- Exportación automática a Excel

## Contribución

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 