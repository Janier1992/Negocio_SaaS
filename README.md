# 🚀 Mi Negocio ERP

[![CI](https://github.com/Janier1992/MiNegocio-ERP/actions/workflows/ci.yml/badge.svg)](https://github.com/Janier1992/MiNegocio-ERP/actions/workflows/ci.yml)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green)](https://supabase.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-blue)](https://react.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)

**Sistema de Gestión Empresarial (ERP) moderno, ligero y potente, diseñado para PyMEs y ferreterías.**  
Combina la flexibilidad de la web con la potencia de una aplicación nativa gracias a su arquitectura **PWA (Progressive Web App)**.

---

## 🎯 ¿A quién está dirigido?

Este ERP está optimizado para **Pequeñas y Medianas Empresas (PyMEs)** que necesitan digitalizar sus operaciones sin incurrir en costos elevados de infraestructura. Es ideal para:

*   🔨 **Ferreterías y Depósitos**: Gestión avanzada de inventario, stock crítico y múltiples proveedores.
*   🛍️ **Tiendas de Retail**: Punto de venta (POS) rápido, arqueo de caja y control de ventas.
*   📦 **Distribuidoras**: Control de compras, cuentas por pagar y reportes financieros.

---

## 🔥 Características Estrella (Marketing)

*   **📱 Mobile-First & PWA**: Instálala en tu celular, tablet o PC como una app nativa. Funciona offline y se actualiza automáticamente.
*   **⚡ Velocidad Extrema**: Construida con **Vite** y **React**, la navegación es instantánea.
*   **🔒 Seguridad de Grado Bancario**: Implementa **Row Level Security (RLS)** de PostgreSQL. Cada empresa ve estrictamente sus propios datos, garantizando privacidad total en un entorno multi-tenant.
*   **🎨 Experiencia de Usuario (UX) Premium**: Interfaz limpia, modo oscuro/claro, notificaciones en tiempo real y componentes visuales intuitivos (`shadcn/ui`).
*   **📊 Inteligencia de Negocios**: Dashboard con KPIs en tiempo real, alertas de stock bajo y reportes financieros detallados.

---

## 🛠️ Stack Tecnológico

La aplicación utiliza un stack moderno y mantenible:

*   **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI.
*   **Build Tool**: Vite (con plugin PWA).
*   **Backend & Base de Datos**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **Estado**: TanStack Query (React Query) para gestión eficiente de datos servidor-cliente.
*   **Despliegue**: Compatible con Vercel, Netlify o cualquier hosting estático.

---

## 📂 Estructura del Código

El proyecto sigue una arquitectura modular y escalable:

*   `src/components`: Componentes UI reutilizables (atomicos y moleculares).
*   `src/pages`: Vistas principales (Dashboard, Ventas, Inventario, etc.), cargadas mediante Lazy Loading.
*   `src/hooks`: Lógica de negocio encapsulada (e.g., `useUserProfile`, `useCart`).
*   `src/services`: Capa de comunicación con Supabase y APIs externas.
*   `src/integrations/supabase`: Configuración del cliente y tipos generados automáticamentes.
*   `supabase/migrations`: Scripts SQL que definen el esquema de la base de datos, funciones RPC y políticas RLS.

---

## ⚙️ Configuración e Instalación

### Requisitos Previos
*   Node.js (v18 o superior)
*   Cuenta en [Supabase](https://supabase.com/)

### 1. Clonar y Dependencias
```bash
git clone https://github.com/Janier1992/MiNegocio-ERP.git
cd MiNegocio-ERP
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz basado en el siguiente ejemplo:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
VITE_PUBLIC_SITE_URL=http://localhost:8080
```

### 3. Base de Datos
Ejecuta las migraciones incluidas en `supabase/migrations` en tu proyecto de Supabase para crear las tablas y políticas de seguridad.
> **Importante**: Asegúrate de ejecutar el script para el bucket de `avatars` si deseas habilitar la subida de fotos de perfil.

### 4. Correr en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:8080`.

---

## 🚀 Estrategias de Crecimiento (Roadmap)

1.  **Módulo de Facturación Electrónica**: Integración directa con proveedores de facturación.
2.  **App Móvil Nativa**: Uso de Capacitor para publicar en Play Store / App Store.
3.  **Marketplace B2B**: Conectar proveedores directamente con el inventario del negocio.
4.  **IA Predictiva**: Sugerencias de reabastecimiento basadas en histórico de ventas.

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor lee `CONTRIBUTING.md` (si existe) o abre un Issue para discutir cambios mayores.

---

Desarrollado con ❤️ para impulsar el comercio local.
