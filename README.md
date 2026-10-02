# CAPSTONE - DuckyWare

**Spanish version:** [README_es.md](README_es.md)

> [!IMPORTANT]
> **This is the GitHub Pages demo repository of DuckyWare.**
> The original Django project (the version that runs with a real backend) is in
> **[RaulEstevezA/Duckyware_Store](https://github.com/RaulEstevezA/Duckyware_Store)**.

**Live demo:** [raulesteveza.github.io/demos/Duckyware_Store](https://raulesteveza.github.io/demos/Duckyware_Store/)

## Final Project of the CS50W Course

**Author:** Raul Estevez  
**GitHub:** [RaulEstevezA](https://github.com/RaulEstevezA)  
**LinkedIn:** [Raul Estevez](https://www.linkedin.com/in/raul-estevez-abella-9a2a1687/)  
**Contact:** [r.estevezbella@gmail.com](mailto:r.estevezbella@gmail.com)  
**Demo video:** [YouTube](https://youtu.be/ckqKTbNd3lc)

## Web Demo (GitHub Pages)

DuckyWare is a Python/Django application: it needs a server to run the views, a SQLite database and the PayPal SDK. GitHub Pages only serves static files, so **the store had to be simulated to be published there**. This repository keeps the original Django project untouched and adds a static version in `web/` that reproduces all its features in the browser:

1. **No server and no database.** The catalogue (categories, products, images and technical specifications) is exported from `db.sqlite3` to `web/data/store.json` with the project's own Django models. Product images are converted to WebP (about 2 MB instead of 11 MB); the originals stay in `media/` for the Django project.
2. **Simulated backend.** `web/js/backend.js` ports the logic of `store/views.py` to JavaScript: authentication, anonymous and user carts (merged on login), discounts and stock limits, wishlist, profile and shipping address, orders, stock and units sold updates, and an admin panel. Everything is stored in each visitor's browser (`localStorage`), so nobody sees other visitors' changes.
3. **Simulated payments.** PayPal, credit card and bank transfer create real orders inside the demo, but no external service is contacted and nothing is charged.
4. **Same look.** The original CSS and icons from `store/static/store/` are reused unchanged, and the Django templates were ported one by one.

On a hosting service that supports a backend (for example a VPS, Render or PythonAnywhere), the original Django project runs as it is and **none of these modifications are needed**.

### Differences from the Original Project

| | Original project (Django) | GitHub Pages demo |
|---|---|---|
| Backend | Django views on a Python server | JavaScript in the browser (`web/js/backend.js`) |
| Database | SQLite (`db.sqlite3`) | Catalogue in `web/data/store.json` + `localStorage` per visitor |
| Users | Django auth, sample users in the database | Demo accounts `demo` / `demo1234` and `admin` / `admin1234`, or register your own |
| PayPal | Real PayPal sandbox through `paypalrestsdk` | Simulated approval step |
| Credit card / transfer | Simulated in the original too | Simulated |
| Admin | Django admin site (`/admin/`) | Admin Panel for staff users: products, orders, users and categories |
| URLs | `/category/CPUs/` | `#/category/CPUs/` (hash routing, GitHub Pages cannot rewrite URLs) |
| Category pages | Products of the exact category | Also products of its subcategories |

### Demo Structure

```text
web/                     # static demo (published)
├── index.html
├── css/demo.css         # demo-only styles (banner, simulated gateway, admin)
├── data/store.json      # catalogue exported from db.sqlite3
├── media/               # product images converted to WebP
└── js/
    ├── backend.js       # simulated Django backend (views.py + models)
    ├── main.js          # hash router (urls.py)
    ├── layout.js        # layout.html + demo notice
    ├── html.js          # template helpers with auto-escaping
    ├── messages.js      # django.contrib.messages equivalent
    └── views/           # ports of the templates and their JavaScript
tools/
├── export_data.py       # db.sqlite3 -> web/data/store.json + WebP images (needs Django and Pillow)
└── build_site.py        # assembles dist/ (standard library only)
.github/workflows/deploy-demo.yml
```

### Run the Demo Locally

```sh
python3 tools/build_site.py --serve
```

Then open `http://localhost:8000`. If the database changes, regenerate the catalogue first (with Django installed):

```sh
python tools/export_data.py
```

### Deployment

Every push to `main` that changes the demo runs `.github/workflows/deploy-demo.yml`, which builds `dist/` and copies it to `demos/Duckyware_Store/` in the [RaulEstevezA.github.io](https://github.com/RaulEstevezA/RaulEstevezA.github.io) repository. It needs the Actions secret `PORTFOLIO_DEPLOY_TOKEN`: a token with *Contents: Read and write* permission on that repository.

## Overview

DuckyWare is a Django-based e-commerce web application focused on computer hardware and peripherals. The project was built as the final capstone for CS50W, with the goal of creating a more realistic online store than the course's earlier auction-style commerce project.

The application includes a dynamic storefront, product categories, product detail pages, user registration and authentication, profile management, shipping addresses, wishlist functionality, shopping cart behavior for both anonymous and logged-in users, checkout, order history, and several payment flows including PayPal sandbox integration.

The name and visual identity are inspired by the rubber duck often seen in CS50 material. That is why the interface uses a yellow-centered visual theme and the name DuckyWare, a mix of "duck" and "hardware."

## Screenshots

<h3 align="center">Home Page</h3>

<p align="center">
  <img src="img/home1.png" alt="DuckyWare home page" width="600">
</p>

<h3 align="center">Category Menu</h3>

<p align="center">
  <img src="img/menu.png" alt="Category navigation menu" width="600">
</p>

<h3 align="center">Product Listing</h3>

<p align="center">
  <img src="img/cpuProducts.png" alt="CPU product listing" width="600">
</p>

<h3 align="center">Product Detail</h3>

<p align="center">
  <img src="img/productDetail1.png" alt="Product detail page" width="600">
</p>

<h3 align="center">Profile Panel</h3>

<p align="center">
  <img src="img/profilePanel.png" alt="User profile panel" width="600">
</p>

<h3 align="center">Payment Flow</h3>

<p align="center">
  <img src="img/payment.png" alt="Payment selection page" width="600">
</p>

<h3 align="center">PayPal Sandbox</h3>

<p align="center">
  <img src="img/paypalPayment.png" alt="PayPal sandbox payment" width="600">
</p>

<h3 align="center">Orders</h3>

<p align="center">
  <img src="img/orders.png" alt="Orders page" width="600">
</p>

<h3 align="center">Admin Panel</h3>

<p align="center">
  <img src="img/adminPanel.png" alt="Django admin panel" width="600">
</p>

## Distinctiveness and Complexity

DuckyWare is designed as a full online store with product inventory, shopping cart behavior, order creation, profile and shipping data, detailed product specifications, discounts, and multiple checkout flows.

The project uses a modular architecture where product categories are represented by different Django models. This allows each type of hardware product to store its own technical specifications while still sharing common store behavior such as images, reviews, cart items, wishlists, and orders. The navigation bar is also dynamic: categories and subcategories are loaded from the database, and the menu supports up to 6 nested child levels. If new categories or subcategories are created, they are automatically added to the navbar without hardcoding new menu links.

## Main Features

- **Dynamic home page:** shows discounted products, best-selling products, and products with the lowest stock.
- **Dynamic category and subcategory system:** products are organized through database-driven categories, and the navbar automatically reflects category changes with support for up to 6 nested child levels.
- **Multiple product models:** supports CPUs, computer cases, power supplies, case fans, motherboards, graphics cards, RAM, storage, monitors, keyboards, headsets, mice, webcams, and cooling products.
- **Detailed product pages:** each product can show multiple images and category-specific technical fields.
- **Search:** users can search products by title and view matching results with images and prices.
- **Wishlist:** authenticated users can add or remove products from their wishlist.
- **Shopping cart:** supports anonymous session carts and authenticated user carts.
- **Cart merge on login/register:** items added before authentication are merged into the user's cart after login or registration.
- **Discount and stock logic:** discounted units, stock limits, price calculation, and units sold are handled in the backend.
- **Checkout:** users can review cart items and select a payment method.
- **Payment methods:** includes PayPal sandbox flow, credit card simulation, and bank transfer flow.
- **Orders:** completed payments create orders and order items with price-at-purchase values.
- **Profile management:** users can update email, phone, password, and shipping address data.
- **Admin management:** Django admin is configured to manage products, product images, categories, users, orders, reviews, and related store data.
- **Responsive interface:** Bootstrap, CSS, and JavaScript are used to provide a cleaner responsive shopping experience.

## Data Included

The repository includes a SQLite database (`db.sqlite3`) with sample data. At the time of review, the database contains users, product categories, product images, orders, wishlists, shipping addresses, and sample products.

The catalogue has 49 products and every category has products: CPUs, computer cases, power supplies, case fans, RAM, motherboards, graphics cards, CPU air and liquid coolers, sound cards, hard drives, SSDs, monitors, keyboards, headsets, mice and webcams. Specifications, images and prices are taken from Newegg product pages (prices as of October 2026); stock, units sold and discounts are sample values. Product images are stored in the `media/` directory, while project screenshots are stored in `img/`.

## Technologies Used

- Python
- Django
- SQLite
- JavaScript
- Bootstrap
- HTML
- CSS
- Pillow
- paypalrestsdk

## Project Structure

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

## Important Files

- `store/models/base_models.py`: shared store models such as categories, profiles, shipping addresses, cart items, orders, product images, and reviews.
- `store/models/product_models.py`: concrete product models with hardware-specific fields.
- `store/product_types.py`: maps category names to the correct product model.
- `store/views.py`: contains the main storefront, authentication, cart, checkout, payment, wishlist, profile, and order logic.
- `store/urls.py`: defines all application routes.
- `store/admin.py`: registers product and store models in Django admin.
- `store/static/store/js/`: contains JavaScript for cart, checkout, product detail, profile, and layout behavior.
- `store/static/store/css/`: contains page-specific and general styles.

## Application Routes

Some of the main routes are:

- `/`: home page
- `/register/`: user registration
- `/login/`: user login
- `/logout`: user logout
- `/profile/`: account and profile panel
- `/orders/`: order history
- `/orders/<order_id>/`: order detail
- `/wishlist/`: wishlist page
- `/cart/`: shopping cart
- `/checkout/`: checkout page
- `/search/`: product search
- `/category/<category_name>/`: category listing
- `/category/<category_name>/product/<product_id>/`: product detail page
- `/payment/`: PayPal payment flow
- `/credit_card/`: credit card payment simulation
- `/transfer/`: bank transfer payment flow
- `/admin/`: Django admin panel

## How to Run Locally

Create and activate a virtual environment:

```sh
python3 -m venv .venv
source .venv/bin/activate
```

Install the required packages:

```sh
pip install Django Pillow paypalrestsdk
```

Apply migrations if needed:

```sh
python manage.py migrate
```

Run the development server:

```sh
python manage.py runserver
```

Open the project in the browser:

```text
http://127.0.0.1:8000/
```

If the autoreloader causes issues in your environment, run:

```sh
python manage.py runserver 127.0.0.1:8000 --noreload
```

## Admin Access

The project includes sample users in the SQLite database. If you do not know an existing admin password, create a new admin user with:

```sh
python manage.py createsuperuser
```

Then open:

```text
http://127.0.0.1:8000/admin/
```

## PayPal Sandbox

The project includes PayPal sandbox payment integration through `paypalrestsdk`. PayPal credentials and sandbox mode are configured in `duckyware/settings.py`.

The README previously included this example sandbox buyer account:

```text
Account: sb-9we9k30933294@personal.example.com
Password: 4tP&j^$8
```

## Notes

- This project is configured for local development with `DEBUG = True`.
- The included SQLite database is useful for demonstration and testing.
- Product images used by the application are located in `media/`.
- Screenshots used in this README are located in `img/`.
- For production deployment, the Django secret key, PayPal credentials, `DEBUG`, `ALLOWED_HOSTS`, static files, media handling, and database configuration should be moved to a safer production setup.
