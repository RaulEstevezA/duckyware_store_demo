# CAPSTONE - DuckyWare

**Versión en inglés:** [README.md](README.md)

> [!IMPORTANT]
> **Este es el repositorio de la demo para GitHub Pages de DuckyWare.**
> El proyecto Django original (la versión que funciona con un backend real) está en
> **[RaulEstevezA/Duckyware_Store](https://github.com/RaulEstevezA/Duckyware_Store)**.

**Demo en vivo:** [raulesteveza.github.io/demos/Duckyware_Store](https://raulesteveza.github.io/demos/Duckyware_Store/)

## Proyecto final del curso CS50W

**Autor:** Raul Estevez  
**GitHub:** [RaulEstevezA](https://github.com/RaulEstevezA)  
**LinkedIn:** [Raul Estevez](https://www.linkedin.com/in/raul-estevez-abella-9a2a1687/)  
**Contacto:** [r.estevezbella@gmail.com](mailto:r.estevezbella@gmail.com)  
**Video demo:** [YouTube](https://youtu.be/ckqKTbNd3lc)

## Demo web (GitHub Pages)

DuckyWare es una aplicación Python/Django: necesita un servidor que ejecute las vistas, una base de datos SQLite y el SDK de PayPal. GitHub Pages solo sirve archivos estáticos, así que **la tienda ha tenido que ser simulada para poder publicarse allí**. Este repositorio conserva intacto el proyecto Django original y añade una versión estática en `web/` que reproduce todas sus funcionalidades en el navegador:

1. **Sin servidor ni base de datos.** El catálogo (categorías, productos, imágenes y especificaciones técnicas) se exporta de `db.sqlite3` a `web/data/store.json` usando los propios modelos de Django del proyecto. Las imágenes de producto se convierten a WebP (unos 2 MB en lugar de 11 MB); las originales se quedan en `media/` para el proyecto Django.
2. **Backend simulado.** `web/js/backend.js` traslada a JavaScript la lógica de `store/views.py`: autenticación, carrito anónimo y de usuario (que se fusionan al iniciar sesión), descuentos y límites de stock, lista de deseos, perfil y dirección de envío, pedidos, actualización de stock y unidades vendidas, y un panel de administración. Todo se guarda en el navegador de cada visitante (`localStorage`), así que nadie ve los cambios de otros visitantes.
3. **Pagos simulados.** PayPal, tarjeta de crédito y transferencia crean pedidos reales dentro de la demo, pero no se contacta con ningún servicio externo ni se cobra nada.
4. **Mismo aspecto.** Se reutilizan sin cambios el CSS y los iconos originales de `store/static/store/`, y las plantillas de Django se han portado una a una.

En un hosting que permita backend (por ejemplo un VPS, Render o PythonAnywhere), el proyecto Django original funciona tal cual y **no necesita ninguna de estas modificaciones**.

### Diferencias con el proyecto original

| | Proyecto original (Django) | Demo en GitHub Pages |
|---|---|---|
| Backend | Vistas de Django en un servidor Python | JavaScript en el navegador (`web/js/backend.js`) |
| Base de datos | SQLite (`db.sqlite3`) | Catálogo en `web/data/store.json` + `localStorage` por visitante |
| Usuarios | Autenticación de Django, usuarios de ejemplo en la base de datos | Cuentas de demo `demo` / `demo1234` y `admin` / `admin1234`, o registra la tuya |
| PayPal | Sandbox real de PayPal con `paypalrestsdk` | Paso de aprobación simulado |
| Tarjeta / transferencia | Ya simulados en el original | Simulados |
| Administración | Admin de Django (`/admin/`) | Admin Panel para usuarios staff: productos, pedidos, usuarios y categorías |
| URLs | `/category/CPUs/` | `#/category/CPUs/` (rutas con hash, GitHub Pages no puede reescribir URLs) |
| Páginas de categoría | Productos de la categoría exacta | También los productos de sus subcategorías |

### Estructura de la demo

```text
web/                     # demo estática (lo que se publica)
├── index.html
├── css/demo.css         # estilos propios de la demo (aviso, pasarela simulada, admin)
├── data/store.json      # catálogo exportado de db.sqlite3
├── media/               # imágenes de producto convertidas a WebP
└── js/
    ├── backend.js       # backend de Django simulado (views.py + modelos)
    ├── main.js          # router con hash (urls.py)
    ├── layout.js        # layout.html + aviso de demo
    ├── html.js          # helpers de plantillas con escapado automático
    ├── messages.js      # equivalente a django.contrib.messages
    └── views/           # plantillas portadas y su JavaScript
tools/
├── export_data.py       # db.sqlite3 -> web/data/store.json + imágenes WebP (necesita Django y Pillow)
└── build_site.py        # genera dist/ (solo biblioteca estándar)
.github/workflows/deploy-demo.yml
```

### Ejecutar la demo en local

```sh
python3 tools/build_site.py --serve
```

Y abre `http://localhost:8000`. Si cambia la base de datos, regenera antes el catálogo (con Django instalado):

```sh
python tools/export_data.py
```

### Despliegue

Cada push a `main` que modifica la demo ejecuta `.github/workflows/deploy-demo.yml`, que genera `dist/` y lo copia en `demos/Duckyware_Store/` del repositorio [RaulEstevezA.github.io](https://github.com/RaulEstevezA/RaulEstevezA.github.io). Necesita el secreto de Actions `PORTFOLIO_DEPLOY_TOKEN`: un token con permiso *Contents: Read and write* sobre ese repositorio.

## Descripción general

DuckyWare es una aplicación web de comercio electrónico desarrollada con Django y centrada en la venta de hardware y periféricos informáticos. El proyecto fue creado como capstone final de CS50W, con el objetivo de construir una tienda online más realista que el proyecto anterior de comercio basado en subastas.

La aplicación incluye una página principal dinámica, categorías de productos, páginas de detalle, registro e inicio de sesión, gestión de perfil, direcciones de envío, lista de deseos, carrito para usuarios anónimos y autenticados, checkout, historial de pedidos y varios flujos de pago, incluida una integración con PayPal en modo sandbox.

El nombre y la identidad visual están inspirados en el pato de goma que aparece con frecuencia en el material de CS50. Por eso la interfaz usa una temática amarilla y el nombre DuckyWare, una mezcla entre "duck" y "hardware".

## Capturas

<h3 align="center">Página principal</h3>

<p align="center">
  <img src="img/home1.png" alt="Página principal de DuckyWare" width="600">
</p>

<h3 align="center">Menú de categorías</h3>

<p align="center">
  <img src="img/menu.png" alt="Menú de navegación por categorías" width="600">
</p>

<h3 align="center">Listado de productos</h3>

<p align="center">
  <img src="img/cpuProducts.png" alt="Listado de productos CPU" width="600">
</p>

<h3 align="center">Detalle de producto</h3>

<p align="center">
  <img src="img/productDetail1.png" alt="Página de detalle de producto" width="600">
</p>

<h3 align="center">Panel de perfil</h3>

<p align="center">
  <img src="img/profilePanel.png" alt="Panel de perfil de usuario" width="600">
</p>

<h3 align="center">Flujo de pago</h3>

<p align="center">
  <img src="img/payment.png" alt="Página de selección de pago" width="600">
</p>

<h3 align="center">PayPal Sandbox</h3>

<p align="center">
  <img src="img/paypalPayment.png" alt="Pago con PayPal sandbox" width="600">
</p>

<h3 align="center">Pedidos</h3>

<p align="center">
  <img src="img/orders.png" alt="Página de pedidos" width="600">
</p>

<h3 align="center">Panel de administración</h3>

<p align="center">
  <img src="img/adminPanel.png" alt="Panel de administración de Django" width="600">
</p>

## Diferenciación y complejidad

DuckyWare está diseñado como una tienda online completa, con inventario de productos, carrito de compra, creación de pedidos, perfiles, direcciones de envío, especificaciones técnicas detalladas, descuentos y varios flujos de checkout.

El proyecto utiliza una arquitectura modular donde las categorías de producto están representadas por distintos modelos de Django. Esto permite que cada tipo de hardware tenga sus propias especificaciones técnicas sin perder comportamiento común de tienda, como imágenes, reviews, carrito, wishlist y pedidos. El navbar también es dinámico: las categorías y subcategorías se cargan desde la base de datos, y el menú soporta hasta 6 niveles de hijos anidados. Si se crean nuevas categorías o subcategorías, se añaden automáticamente al navbar sin tener que escribir nuevos enlaces a mano.

## Funcionalidades principales

- **Página principal dinámica:** muestra productos con descuento, productos más vendidos y productos con menos stock.
- **Sistema dinámico de categorías y subcategorías:** los productos se organizan mediante categorías cargadas desde la base de datos, y el navbar refleja automáticamente los cambios con soporte para hasta 6 niveles de hijos anidados.
- **Múltiples modelos de producto:** soporta CPUs, cajas, fuentes de alimentación, ventiladores, placas base, tarjetas gráficas, RAM, almacenamiento, monitores, teclados, auriculares, ratones, webcams y productos de refrigeración.
- **Páginas de detalle:** cada producto puede mostrar múltiples imágenes y campos técnicos específicos de su categoría.
- **Búsqueda:** los usuarios pueden buscar productos por título y ver resultados con imágenes y precios.
- **Lista de deseos:** los usuarios autenticados pueden añadir o eliminar productos de su wishlist.
- **Carrito de compra:** funciona con carrito de sesión para usuarios anónimos y carrito asociado al usuario para usuarios autenticados.
- **Fusión de carrito al iniciar sesión o registrarse:** los productos añadidos antes de autenticarse pasan al carrito del usuario.
- **Lógica de descuentos y stock:** el backend controla unidades con descuento, límites de stock, cálculo de precios y unidades vendidas.
- **Checkout:** los usuarios pueden revisar el carrito y escoger método de pago.
- **Métodos de pago:** incluye PayPal sandbox, simulación de tarjeta de crédito y pago por transferencia bancaria.
- **Pedidos:** los pagos completados crean pedidos y líneas de pedido con precio guardado en el momento de compra.
- **Gestión de perfil:** los usuarios pueden actualizar email, teléfono, contraseña y dirección de envío.
- **Panel de administración:** Django admin permite gestionar productos, imágenes, categorías, usuarios, pedidos, reviews y datos relacionados.
- **Interfaz responsive:** Bootstrap, CSS y JavaScript se usan para ofrecer una experiencia limpia y adaptable.

## Datos incluidos

El repositorio incluye una base de datos SQLite (`db.sqlite3`) con datos de ejemplo. En la revisión realizada, la base de datos contiene usuarios, categorías, imágenes de productos, pedidos, wishlists, direcciones de envío y productos de muestra.

Los productos de ejemplo actuales incluyen CPUs, cajas de ordenador, una fuente de alimentación y ventiladores. Las imágenes de productos están en el directorio `media/`, mientras que las capturas del proyecto están en `img/`.

## Tecnologías utilizadas

- Python
- Django
- SQLite
- JavaScript
- Bootstrap
- HTML
- CSS
- Pillow
- paypalrestsdk

## Estructura del proyecto

```text
.
├── duckyware/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── store/
│   ├── models/
│   │   ├── base_models.py
│   │   └── product_models.py
│   ├── templates/store/
│   ├── static/store/
│   ├── templatetags/
│   ├── admin.py
│   ├── forms.py
│   ├── product_types.py
│   ├── urls.py
│   └── views.py
├── media/
├── img/
├── db.sqlite3
├── manage.py
├── requirements.txt
└── README.md
```

## Archivos importantes

- `store/models/base_models.py`: modelos comunes como categorías, perfiles, direcciones de envío, carrito, pedidos, imágenes de producto y reviews.
- `store/models/product_models.py`: modelos concretos de producto con campos específicos para cada tipo de hardware.
- `store/product_types.py`: relaciona nombres de categorías con el modelo de producto correspondiente.
- `store/views.py`: contiene la lógica principal de tienda, autenticación, carrito, checkout, pagos, wishlist, perfil y pedidos.
- `store/urls.py`: define las rutas de la aplicación.
- `store/admin.py`: registra los modelos de tienda y producto en Django admin.
- `store/static/store/js/`: contiene JavaScript para carrito, checkout, detalle de producto, perfil y comportamiento general.
- `store/static/store/css/`: contiene estilos generales y estilos específicos por página.

## Rutas de la aplicación

Algunas de las rutas principales son:

- `/`: página principal
- `/register/`: registro de usuario
- `/login/`: inicio de sesión
- `/logout`: cierre de sesión
- `/profile/`: panel de cuenta y perfil
- `/orders/`: historial de pedidos
- `/orders/<order_id>/`: detalle de pedido
- `/wishlist/`: lista de deseos
- `/cart/`: carrito
- `/checkout/`: checkout
- `/search/`: búsqueda de productos
- `/category/<category_name>/`: listado por categoría
- `/category/<category_name>/product/<product_id>/`: detalle de producto
- `/payment/`: flujo de pago con PayPal
- `/credit_card/`: simulación de pago con tarjeta
- `/transfer/`: pago por transferencia bancaria
- `/admin/`: panel de administración de Django

## Cómo ejecutar el proyecto en local

Crea y activa un entorno virtual:

```sh
python3 -m venv .venv
source .venv/bin/activate
```

Instala los paquetes necesarios:

```sh
pip install Django Pillow paypalrestsdk
```

Aplica migraciones si es necesario:

```sh
python manage.py migrate
```

Arranca el servidor de desarrollo:

```sh
python manage.py runserver
```

Abre el proyecto en el navegador:

```text
http://127.0.0.1:8000/
```

Si el autoreloader da problemas en tu entorno, puedes ejecutar:

```sh
python manage.py runserver 127.0.0.1:8000 --noreload
```

## Acceso al panel de administración

El proyecto incluye usuarios de ejemplo en la base de datos SQLite. Si no conoces la contraseña de un administrador existente, puedes crear un nuevo superusuario con:

```sh
python manage.py createsuperuser
```

Después abre:

```text
http://127.0.0.1:8000/admin/
```

## PayPal Sandbox

El proyecto incluye integración de pago con PayPal sandbox mediante `paypalrestsdk`. Las credenciales y el modo sandbox están configurados en `duckyware/settings.py`.

El README anterior incluía esta cuenta compradora sandbox de ejemplo:

```text
Account: sb-9we9k30933294@personal.example.com
Password: 4tP&j^$8
```

## Notas

- Este proyecto está configurado para desarrollo local con `DEBUG = True`.
- La base de datos SQLite incluida es útil para demostración y pruebas.
- Las imágenes de producto usadas por la aplicación están en `media/`.
- Las capturas usadas en este README están en `img/`.
- Para desplegar en producción, la secret key de Django, las credenciales de PayPal, `DEBUG`, `ALLOWED_HOSTS`, los archivos estáticos, los archivos media y la base de datos deberían moverse a una configuración de producción más segura.
