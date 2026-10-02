// main.js
// Hash router: replaces store/urls.py. Hash URLs (#/cart/) are used because
// GitHub Pages cannot rewrite /cart/ to index.html.

import * as backend from './backend.js';
import { html, url } from './html.js';
import { layout, mountLayout, showIntroOnce } from './layout.js';
import * as shop from './views/shop.js';
import * as account from './views/account.js';
import * as cart from './views/cart.js';
import * as payment from './views/payment.js';
import * as admin from './views/admin.js';

const routes = [
    [/^\/$/, shop.home],
    [/^\/register\/?$/, account.register],
    [/^\/login\/?$/, account.login],
    [/^\/logout\/?$/, account.logout],
    [/^\/profile\/?$/, account.profile],
    [/^\/orders\/?$/, account.orders],
    [/^\/orders\/(\d+)\/?$/, account.orderDetail],
    [/^\/wishlist\/?$/, shop.wishlist],
    [/^\/cart\/?$/, cart.cart],
    [/^\/checkout\/?$/, cart.checkout],
    [/^\/search\/?$/, shop.search],
    [/^\/category\/([^/]+)\/product\/(\d+)\/?$/, shop.productView],
    [/^\/category\/([^/]+)\/?$/, shop.category],
    [/^\/payment\/?$/, payment.paypalPayment],
    [/^\/payment\/paypal\/?$/, payment.paypalSandbox],
    [/^\/payment\/success\/?$/, payment.paymentSuccess],
    [/^\/payment\/error\/?$/, payment.paymentError],
    [/^\/credit_card\/?$/, payment.creditCard],
    [/^\/transfer\/(\d+)\/?$/, payment.transfer],
    [/^\/admin\/?$/, admin.adminPanel],
];

const app = document.getElementById('app');
let lastHash = null;

function parseHash() {
    const hash = window.location.hash.replace(/^#/, '') || '/';
    const [path, queryString = ''] = hash.split('?');
    return { path, query: new URLSearchParams(queryString) };
}

export function navigate(hash, { force = false } = {}) {
    if (window.location.hash === hash && !force) return;
    if (window.location.hash === hash) {
        render();
    } else {
        window.location.hash = hash;
    }
}

function errorPage(error) {
    return {
        content: html`
            <div class="container text-center" style="margin-top: 50px;">
                <h1>Oops! Something went wrong.</h1><br><br>
                <p style="margin: 20px auto;">${error}</p><br><br>
                <a href="${url.home()}" class="btn btn-outline-secondary btn-sm return-home">Return Home</a>
            </div>`,
    };
}

function render() {
    const { path, query } = parseHash();
    let view = null;
    let params = [];
    for (const [pattern, handler] of routes) {
        const match = pattern.exec(path);
        if (match) {
            view = handler;
            params = match.slice(1).map(decodeURIComponent);
            break;
        }
    }

    const ctx = {
        params,
        query,
        navigate,
        rerender: () => render(),
        loginRequired() {
            if (backend.currentUser()) return null;
            return { redirect: `${url.login()}?next=${encodeURIComponent('#' + path)}` };
        },
    };

    let page;
    try {
        page = view ? view(ctx) : errorPage('No specific error provided.');
    } catch (error) {
        console.error(error);
        page = errorPage(error.message);
    }

    if (page.redirect) {
        window.location.replace(page.redirect);
        return;
    }

    document.querySelectorAll('.carousel').forEach(el => bootstrap.Carousel.getInstance(el)?.dispose());
    bootstrap.Modal.getInstance(document.getElementById('demoInfoModal'))?.dispose();
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');

    app.innerHTML = layout(page.content);
    mountLayout(navigate);
    if (page.mount) page.mount(ctx);

    const hash = window.location.hash;
    if (hash !== lastHash) window.scrollTo(0, 0);
    lastHash = hash;
}

async function start() {
    try {
        await backend.init();
    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="container text-center" style="margin-top: 50px;">
            <h1>Oops! Something went wrong.</h1><p class="mt-4">The store data could not be loaded. Please reload the page.</p></div>`;
        return;
    }
    window.addEventListener('hashchange', render);
    render();
    showIntroOnce();
}

start();
