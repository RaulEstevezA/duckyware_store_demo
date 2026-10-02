// admin.js
// Replacement for the Django admin site (store/admin.py), which needs a server.
// Staff users can edit products, change order status, manage users' staff
// flag and create categories, which appear in the navbar automatically.

import * as backend from '../backend.js';
import { html, money, formatDateTime, url } from '../html.js';
import { flash, renderMessages } from '../messages.js';

const TABS = [
    ['products', 'Products'],
    ['orders', 'Orders'],
    ['users', 'Users'],
    ['categories', 'Categories'],
];

function productsTab(products) {
    return html`
        <p class="text-muted">Changes to price, discount and stock are reflected immediately in the store (home page, listings, cart and checkout).</p>
        <div class="table-responsive">
            <table class="table table-striped align-middle admin-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price ($)</th>
                        <th>Discount (%)</th>
                        <th>Discounted units</th>
                        <th>Stock</th>
                        <th>Units sold</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => html`
                    <tr data-key="${p.key}">
                        <td><a href="${url.product(p.category, p.id)}" class="product-link">${p.title}</a></td>
                        <td>${p.category}</td>
                        <td><input type="number" class="form-control form-control-sm" name="price" value="${p.price}" min="0" step="0.01" aria-label="Price"></td>
                        <td><input type="number" class="form-control form-control-sm" name="discount" value="${p.discount}" min="0" max="100" step="0.01" aria-label="Discount"></td>
                        <td><input type="number" class="form-control form-control-sm" name="discounted_units" value="${p.discounted_units}" min="0" step="1" aria-label="Discounted units"></td>
                        <td><input type="number" class="form-control form-control-sm" name="stock_quantity" value="${p.stock_quantity}" min="0" step="1" aria-label="Stock"></td>
                        <td>${p.units_sold}</td>
                        <td><button type="button" class="btn btn-outline-secondary btn-sm save-product-button">Save</button></td>
                    </tr>`)}
                </tbody>
            </table>
        </div>`;
}

function ordersTab(orders) {
    if (!orders.length) return html`<p>No orders yet.</p>`;
    return html`
        <div class="table-responsive">
            <table class="table table-striped align-middle admin-table">
                <thead>
                    <tr>
                        <th>Order</th>
                        <th>User</th>
                        <th>Date</th>
                        <th>Payment Method</th>
                        <th>Shipping</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => html`
                    <tr>
                        <td>${o.id}</td>
                        <td>${o.username}</td>
                        <td>${formatDateTime(o.created_at)}</td>
                        <td>${backend.PAYMENT_METHOD[o.payment_method]}</td>
                        <td>${o.shipping_address}, ${o.shipping_city}</td>
                        <td>${o.items.map(i => html`<div>${i.product ? i.product.title : i.key} x${i.quantity}</div>`)}</td>
                        <td>$${money(backend.orderTotal(o))}</td>
                        <td>
                            <select class="form-select form-select-sm order-status-select" data-order-id="${o.id}" aria-label="Order status">
                                ${Object.entries(backend.ORDER_STATUS).map(([value, label]) => html`
                                <option value="${value}" ${value === o.status ? 'selected' : ''}>${label}</option>`)}
                            </select>
                        </td>
                    </tr>`)}
                </tbody>
            </table>
        </div>`;
}

function usersTab(users) {
    return html`
        <div class="table-responsive">
            <table class="table table-striped align-middle admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Shipping address</th>
                        <th>Orders</th>
                        <th>Staff</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => html`
                    <tr>
                        <td>${u.username}</td>
                        <td>${u.email}</td>
                        <td>${u.phone || '-'}</td>
                        <td>${u.address ? `${u.address.full_address}, ${u.address.city}` : '-'}</td>
                        <td>${u.orders}</td>
                        <td>
                            <button type="button" class="btn btn-sm ${u.is_staff ? 'btn-warning' : 'btn-outline-secondary'} toggle-staff-button" data-user-id="${u.id}">
                                ${u.is_staff ? 'Yes' : 'No'}
                            </button>
                        </td>
                    </tr>`)}
                </tbody>
            </table>
        </div>`;
}

function categoryTree(categories, parentId) {
    const children = categories.filter(c => c.parent === parentId);
    if (!children.length) return '';
    return html`
        <ul class="admin-category-tree">
            ${children.map(c => html`
            <li>
                <a href="${url.category(c.name)}">${c.name}</a>
                ${c.id >= 1000 ? html`<button type="button" class="btn btn-link btn-sm text-danger delete-category-button" data-category-id="${c.id}">delete</button>` : ''}
                ${categoryTree(categories, c.id)}
            </li>`)}
        </ul>`;
}

function categoriesTab(categories) {
    return html`
        <div class="row">
            <div class="col-md-6">
                <h4>Category tree</h4>
                ${categoryTree(categories, null)}
            </div>
            <div class="col-md-6">
                <h4>Add category</h4>
                <p class="text-muted">New categories and subcategories are added to the navigation menu automatically, as in the original project.</p>
                <form id="addCategoryForm">
                    <div class="form-floating mb-3">
                        <input type="text" class="form-control" id="categoryName" name="name" placeholder="Name" required>
                        <label for="categoryName">Name</label>
                    </div>
                    <div class="mb-3">
                        <label for="categoryParent" class="form-label">Parent</label>
                        <select class="form-select" id="categoryParent" name="parent">
                            <option value="">(none, top level)</option>
                            ${categories.map(c => html`<option value="${c.id}">${c.name}</option>`)}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-outline-secondary">Add category</button>
                </form>
            </div>
        </div>`;
}

export function adminPanel(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;

    const data = backend.adminData();
    if (!data) {
        return {
            content: html`
                <div class="container text-center" style="margin-top: 50px;">
                    <h1>Oops! Something went wrong.</h1><br><br>
                    <p style="margin: 20px auto;">You need a staff account to open the Admin Panel (try <strong>admin</strong> / <strong>admin1234</strong>).</p><br><br>
                    <a href="${url.home()}" class="btn btn-outline-secondary btn-sm return-home">Return Home</a>
                </div>`,
        };
    }

    const tab = TABS.some(([key]) => key === ctx.query.get('tab')) ? ctx.query.get('tab') : 'products';
    const body = {
        products: () => productsTab(data.products),
        orders: () => ordersTab(data.orders),
        users: () => usersTab(data.users),
        categories: () => categoriesTab(data.categories),
    }[tab]();

    const content = html`
        <div class="container mt-4 mb-4 admin-panel">
            ${renderMessages()}
            <h2>Admin Panel</h2>
            <p class="text-muted">Simulated version of the Django admin site. Changes are saved only in this browser.</p>
            <ul class="nav nav-tabs mb-3">
                ${TABS.map(([key, label]) => html`
                <li class="nav-item">
                    <a class="nav-link ${key === tab ? 'active' : ''}" href="${url.admin()}?tab=${key}">${label}</a>
                </li>`)}
            </ul>
            ${body}
        </div>`;

    function report(result, message) {
        if (result.error) {
            Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            return false;
        }
        flash('success', message);
        ctx.rerender();
        return true;
    }

    function mount() {
        document.querySelectorAll('.save-product-button').forEach(button => {
            button.addEventListener('click', () => {
                const row = button.closest('tr');
                const field = name => row.querySelector(`[name="${name}"]`).value;
                report(backend.adminUpdateProduct(row.dataset.key, {
                    price: field('price'),
                    discount: field('discount'),
                    discounted_units: field('discounted_units'),
                    stock_quantity: field('stock_quantity'),
                }), 'Product saved.');
            });
        });

        document.querySelectorAll('.order-status-select').forEach(select => {
            select.addEventListener('change', () => {
                report(backend.adminSetOrderStatus(select.dataset.orderId, select.value), `Order ${select.dataset.orderId} updated.`);
            });
        });

        document.querySelectorAll('.toggle-staff-button').forEach(button => {
            button.addEventListener('click', () => {
                report(backend.adminToggleStaff(button.dataset.userId), 'User updated.');
            });
        });

        const addCategoryForm = document.getElementById('addCategoryForm');
        if (addCategoryForm) {
            addCategoryForm.addEventListener('submit', event => {
                event.preventDefault();
                // form.name is the form's own name attribute, so read the fields from form.elements
                const { name, parent } = addCategoryForm.elements;
                report(backend.adminAddCategory(name.value, parent.value), 'Category added. Check the navigation menu!');
            });
        }

        document.querySelectorAll('.delete-category-button').forEach(button => {
            button.addEventListener('click', () => {
                report(backend.adminDeleteCategory(button.dataset.categoryId), 'Category deleted.');
            });
        });
    }

    return { content, mount };
}
