// layout.js
// Port of store/templates/store/layout.html plus the GitHub Pages demo notice.

import * as backend from './backend.js';
import { html, money, url } from './html.js';

const ORIGINAL_REPO = 'https://github.com/RaulEstevezA/Duckyware_Store';
const DEMO_REPO = 'https://github.com/RaulEstevezA/duckyware_store_demo';
const INTRO_SEEN_KEY = 'duckyware-demo-intro-seen';

// The original template renders three levels; the README promises up to six
// nested levels, so the demo renders the tree recursively.
function categoryMenu(parentId, depth) {
    const children = backend.childrenOf(parentId);
    if (!children.length || depth > 6) return '';
    return html`
        <ul class="submenu">
            ${children.map(c => html`
                <li>
                    <a href="${url.category(c.name)}">${c.name}</a>
                    ${categoryMenu(c.id, depth + 1)}
                </li>`)}
        </ul>`;
}

// The original menus only open on hover; touch screens get a toggle button
// next to each entry (hidden on desktop, see demo.css)
function menuToggle(label) {
    return html`<button type="button" class="menu-toggle" aria-expanded="false" aria-label="${label}"></button>`;
}

function navbar() {
    const roots = backend.categories().filter(c => !c.parent);
    return html`
        <nav>
            <ul class="nav-menu">
                ${roots.map(c => html`
                    <li class="nav-item">
                        <a href="${url.category(c.name)}">${c.name}</a>
                        ${backend.childrenOf(c.id).length ? menuToggle(`Show subcategories of ${c.name}`) : ''}
                        ${categoryMenu(c.id, 2)}
                    </li>`)}
            </ul>
        </nav>`;
}

function userArea(user) {
    if (!user) {
        return html`
            <a href="${url.login()}">
                <img src="static/store/images/user-icon.svg" alt="Sign In">
                <span class="sign-in-register">Sign In / Register</span>
            </a>`;
    }
    return html`
        <div class="user-icon-container">
            <a href="${url.profile()}">
                <img src="static/store/images/user-icon.svg" alt="Profile">
                <span class="user-name">${user.username}</span>
            </a>
            ${menuToggle('Account menu')}
            <div class="user-dropdown">
                <a href="${url.profile()}">Profile</a>
                <a href="${url.wishlist()}">Wishlist</a>
                <a href="${url.orders()}">Orders</a>
                <a href="${url.logout()}">Logout</a>
                ${user.is_staff ? html`<a href="${url.admin()}">Admin Panel</a>` : ''}
            </div>
        </div>`;
}

function demoBanner() {
    return html`
        <div class="demo-banner" role="note">
            <span><strong>GitHub Pages demo:</strong> the Django backend, database and payment gateways are simulated in your browser.</span>
            <button type="button" class="demo-banner-button" data-bs-toggle="modal" data-bs-target="#demoInfoModal">About this demo</button>
        </div>`;
}

function demoModal() {
    return html`
        <div class="modal fade" id="demoInfoModal" tabindex="-1" aria-labelledby="demoInfoTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title fs-4" id="demoInfoTitle">About this demo</h2>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body demo-modal-body">
                        <p>
                            DuckyWare is a <strong>Python / Django</strong> online store (final project of CS50W).
                            GitHub Pages can only serve static files and cannot run Python, a database or
                            a payment backend, so <strong>this version has been adapted to run entirely in the browser</strong>:
                        </p>
                        <ul class="demo-list">
                            <li>The catalogue (categories, products, images and specifications) was exported from the original SQLite database.</li>
                            <li>Users, sessions, cart, wishlist, orders, stock and the admin panel are simulated with JavaScript and saved in <em>your</em> browser (localStorage). Nobody else sees your changes.</li>
                            <li>PayPal, credit card and bank transfer payments are simulated: no real account or card is used and nothing is charged.</li>
                        </ul>
                        <p>
                            On a hosting service that supports a backend, the original Django project runs as it is and
                            none of these modifications are needed.
                        </p>
                        <h3 class="fs-5 mt-3">Demo accounts</h3>
                        <ul class="demo-list">
                            ${backend.DEMO_ACCOUNTS.map(a => html`<li><strong>${a.username}</strong> / <code>${a.password}</code> — ${a.role}</li>`)}
                        </ul>
                        <p class="mb-0">You can also register a new user. Use <em>Reset demo data</em> to start again from scratch.</p>
                        ${backend.isPersistent() ? '' : html`<p class="alert alert-warning mt-3 mb-0">Your browser does not allow local storage, so changes will be lost when you reload the page.</p>`}
                    </div>
                    <div class="modal-footer demo-modal-footer">
                        <a class="btn btn-outline-secondary" href="${ORIGINAL_REPO}" target="_blank" rel="noopener">Original Django project</a>
                        <a class="btn btn-outline-secondary" href="${DEMO_REPO}" target="_blank" rel="noopener">Demo source code</a>
                        <button type="button" class="btn btn-outline-danger" id="resetDemoButton">Reset demo data</button>
                    </div>
                </div>
            </div>
        </div>`;
}

export function layout(content) {
    const user = backend.currentUser();
    const cart = backend.cartData();
    return html`
        ${demoBanner()}
        <header>
            <div class="top-bar">
                <form class="search-container" id="searchForm" role="search">
                    <input type="text" name="query" placeholder="Search..." aria-label="Search products" required>
                    <button type="submit"><img src="static/store/images/search-icon.svg" alt="Search"></button>
                </form>
                <div class="icon-container">
                    ${userArea(user)}
                </div>
                <div class="cart-container">
                    <a href="${url.cart()}">
                        <img src="static/store/images/cart-icon.svg" alt="Cart">
                        <span class="cart-text">${cart.cart_items} items - $${money(cart.cart_total)}</span>
                    </a>
                </div>
            </div>
            <h1 class="title"><a href="${url.home()}" class="site-title">DUCKYWARE</a></h1>
        </header>

        ${navbar()}

        <main>${content}</main>

        <footer>
            <div class="footer-content">
                <p>&copy; 2024 Duckyware. All rights reserved.</p>
                <p>This project is created by Raúl Estevez for the final project of <br>"CS50's Web Programming with Python and JavaScript" offered by HarvardX.</p>
                <p>Find me on <a href="https://www.linkedin.com/in/raulesteveza/" target="_blank" rel="noopener">LinkedIn</a>.</p>
                <p class="demo-footer-note">
                    Static demo for GitHub Pages with a simulated backend.
                    <a href="${ORIGINAL_REPO}" target="_blank" rel="noopener">Original Django project</a>
                </p>
            </div>
        </footer>
        ${demoModal()}`;
}

let outsideTapRegistered = false;

function closeMenus(except) {
    document.querySelectorAll('.nav-item.open, .user-icon-container.open').forEach(menu => {
        if (menu === except) return;
        menu.classList.remove('open');
        menu.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
    });
}

function mountMenuToggles() {
    document.querySelectorAll('.menu-toggle').forEach(toggle => {
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            const menu = toggle.parentElement;
            closeMenus(menu);
            const open = menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
        });
    });
    if (!outsideTapRegistered) {
        outsideTapRegistered = true;
        document.addEventListener('click', event => {
            if (!event.target.closest('.nav-item, .user-icon-container')) closeMenus();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenus();
        });
    }
}

export function mountLayout(navigate) {
    mountMenuToggles();

    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', event => {
        event.preventDefault();
        const query = searchForm.query.value.trim();
        if (query) navigate(url.search(query));
    });

    document.getElementById('resetDemoButton').addEventListener('click', () => {
        Swal.fire({
            title: 'Reset demo data?',
            text: 'Users, carts, wishlists, orders and stock changes made in this browser will be deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, reset it!',
        }).then(result => {
            if (!result.isConfirmed) return;
            backend.resetDemo();
            // re-render only once the modal has finished closing
            const modalElement = document.getElementById('demoInfoModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            const goHome = () => navigate(url.home(), { force: true });
            if (modal && modalElement.classList.contains('show')) {
                modalElement.addEventListener('hidden.bs.modal', goHome, { once: true });
                modal.hide();
            } else {
                goHome();
            }
        });
    });
}

export function showIntroOnce() {
    let seen = true;
    try {
        seen = localStorage.getItem(INTRO_SEEN_KEY) === '1';
        localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
        seen = false;
    }
    if (!seen) {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('demoInfoModal')).show();
    }
}
