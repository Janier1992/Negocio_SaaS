# Negocio SaaS - Sistema de Gestión para PyMES

## 📋 Descripción del Proyecto
**Negocio SaaS** es una plataforma tecnológica diseñada específicamente para **Pequeñas y Medianas Empresas (PyMES)** y tiendas de barrio. Su objetivo es democratizar el acceso a herramientas de gestión empresarial de alto nivel, permitiendo a los comerciantes administrar sus **Ventas, Inventario, Clientes, Gastos y Proveedores** de manera eficiente, segura y desde cualquier dispositivo.

El valor central es la **simplicidad y potencia**: una interfaz amigable que no requiere conocimientos técnicos, respaldada por una infraestructura robusta en la nube.

---

## 🛠️ Stack Tecnológico (Tecnologías Utilizadas)

El proyecto está construido con herramientas modernas que garantizan velocidad, seguridad y escalabilidad:

*   **Frontend (Interfaz de Usuario):**
    *   **React + Vite:** Biblioteca para construir interfaces rápidas y reactivas.
    *   **TypeScript:** Lenguaje que añade seguridad y tipado al código, reduciendo errores.
    *   **Tailwind CSS:** Framework de diseño para estilos modernos y responsivos (móvil/escritorio).
    *   **Shadcn/UI:** Librería de componentes visuales (botones, tablas, diálogos) profesionales y accesibles.
    *   **Lucide React:** Iconografía moderna y limpia.

*   **Backend & Base de Datos (Nube):**
    *   **Supabase:** Plataforma "Backend-as-a-Service" que provee:
        *   **Base de Datos PostgreSQL:** Potente motor de base de datos relacional.
        *   **Autenticación:** Gestión segura de usuarios y sesiones.
        *   **Almacenamiento (Storage):** Para guardar imágenes de productos y perfiles.
        *   **Edge Functions / RPC:** Funciones de lógica de negocio (ej. revertir ventas y stock) ejecutadas en el servidor.

*   **Herramientas Adicionales:**
    *   **React Query (TanStack Query):** Gestión eficiente de datos y caché (carga rápida de información).
    *   **React Router Dom:** Navegación fluida entre páginas sin recargar el navegador.
    *   **XLSX:** Funcionalidad para exportar reportes a Excel.

---

## 📂 Estructura del Proyecto (¿Qué hay en cada carpeta?)

Esta guía ayuda a entender dónde encontrar cada parte del código:

*   **`src/`**: Carpeta principal del código fuente.
    *   **`components/`**: Los "bloques de construcción" de la aplicación.
        *   **`ui/`**: Elementos base (Botones, Inputs, Tarjetas).
        *   **`layout/`**: Estructura de la página (Barra lateral, Encabezado, Navegación).
        *   **`ventas/`**, **`inventario/`**, **`customers/`**: Módulos específicos con la lógica de cada sección.
    *   **`hooks/`**: "Ganchos" o funciones reutilizables que conectan con la base de datos (ej. `useProducts` para traer productos, `useUserProfile` para saber quién está logueado).
    *   **`pages/`**: Las pantallas completas que ve el usuario (ej. `Dashboard.tsx`, `Ventas.tsx`, `Inventario.tsx`).
    *   **`services/`**: Funciones auxiliares para tareas específicas (ej. enviar correos, validar datos).
    *   **`context/`**: Manejo de estado global (ej. el Carrito de Compras que persiste mientras navegas).
    *   **`App.tsx`**: El punto de entrada principal que configura las rutas.
    *   **`main.tsx`**: El archivo que "monta" la aplicación en el navegador.

---

## 💰 Modelo de Negocio (SaaS)

El proyecto opera bajo un modelo de **Software as a Service (SaaS)** por suscripción.

### Estrategia de Precios (Pricing)
El objetivo es ofrecer planes accesibles que escalen con el crecimiento del negocio del cliente.

*   **Moneda:** Pesos Colombianos (COP).
*   **Frecuencia:** Pagos Mensuales o Anuales (con descuento).

#### Propuesta de Planes (Ejemplo):
1.  **Plan Emprendedor (Básico):**
    *   Ideal para: Pequeñas tiendas o vendedores individuales.
    *   Funciones: Venta POS, Inventario (hasta 100 productos), Clientes básicos.
    *   Precio sugerido: **$40,000 - $60,000 COP / mes**.

2.  **Plan Pyme (Pro):**
    *   Ideal para: Supermercados medianos, ferreterías, papelerías.
    *   Funciones: Inventario ilimitado, Múltiples usuarios, Reportes de Excel, Gestión de Proveedores y Gastos.
    *   Precio sugerido: **$80,000 - $120,000 COP / mes**.

3.  **Plan Empresarial:**
    *   Ideal para: Cadenas o negocios con múltiples sucursales.
    *   Funciones: Multi-sucursal, API personalizada, Soporte prioritario.
    *   Precio: **A convenir / Personalizado**.

---

## 🚀 Estrategia de Marketing y Ventas

Para captar el mercado de PyMES, se sugiere una estrategia híbrida (Digital y Terreno):

1.  **Marketing de Contenidos y SEO:**
    *   Crear tutoriales sobre "Cómo administrar tu inventario" o "Cómo evitar robos hormiga" que lleven a la app.
    *   Posicionamiento local en Google Maps y búsquedas relacionadas con "software contable pymes colombia".

2.  **Venta Consultiva (Terreno):**
    *   Visita directa a zonas comerciales.
    *   **Demo en vivo:** Mostrar al dueño cómo registrar una venta en 10 segundos desde su celular.
    *   **Prueba Gratuita:** Ofrecer 14 días gratis sin tarjeta de crédito para generar confianza.

3.  **Alianzas Estratégicas:**
    *   Asociarse con contadores que recomienden el software a sus clientes para facilitarles la contabilidad.

4.  **Retención:**
    *   Soporte técnico vía WhatsApp (vital en LATAM).
    *   Actualizaciones constantes basadas en feedback real.

---

## ⚙️ Instalación y Despliegue

### Requisitos Previos
*   Node.js instalado.
*   Cuenta en Supabase configurada.

### Pasos
1.  **Clonar repositorio:** `git clone ...`
2.  **Instalar dependencias:** `npm install`
3.  **Configurar entorno:** Crear archivo `.env` con las llaves de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4.  **Correr localmente:** `npm run dev`

---

*Documentación generada automáticamente por tu Asistente de IA de Google DeepMind.*
