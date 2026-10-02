// account.js
// Ports of login.html, register.html, profile.html (+ profile.js),
// orders.html and order_detail.html.

import * as backend from '../backend.js';
import { html, money, formatDateTime, url } from '../html.js';
import { flash, renderMessages } from '../messages.js';

function safeNext(ctx) {
    const next = ctx.query.get('next') || '';
    return next.startsWith('#/') ? next : url.home();
}

function demoAccountsHint() {
    return html`
        <div class="demo-hint mt-4">
            <p class="mb-1"><strong>Demo accounts</strong></p>
            ${backend.DEMO_ACCOUNTS.map(a => html`
                <p class="mb-1">
                    <button type="button" class="demo-fill" data-username="${a.username}" data-password="${a.password}">
                        ${a.username} / ${a.password}
                    </button>
                    <span class="text-muted small">${a.role}</span>
                </p>`)}
        </div>`;
}

// LOGIN
export function login(ctx) {
    let message = null;

    const render = () => html`
        <div class="d-flex justify-content-center align-items-center" style="min-height: 70vh;">
            <div class="w-100" style="max-width: 400px;">
                ${message ? html`<div class="alert alert-warning" role="alert">${message}</div>` : ''}
                <form id="loginForm" class="form-signin">
                    <h1 class="h3 mb-3 fw-bolt text-center">Login</h1>
                    <div class="form-floating mb-3">
                        <input type="text" class="form-control" id="usernameInput" name="username" placeholder="Username" autocomplete="username" required>
                        <label for="usernameInput">Username</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="password" class="form-control" id="passwordInput" name="password" placeholder="Password" autocomplete="current-password" required>
                        <label for="passwordInput">Password</label>
                    </div>
                    <button class="btn btn-outline-secondary w-100" type="submit">Login</button>
                    <p class="mt-2">Don't have an account? <a href="${url.register()}">Register here.</a></p>
                </form>
                ${demoAccountsHint()}
            </div>
        </div>`;

    if (backend.currentUser()) return { redirect: url.home() };

    return {
        content: render(),
        mount() {
            const form = document.getElementById('loginForm');
            document.querySelectorAll('.demo-fill').forEach(button => {
                button.addEventListener('click', () => {
                    form.username.value = button.dataset.username;
                    form.password.value = button.dataset.password;
                });
            });
            form.addEventListener('submit', event => {
                event.preventDefault();
                const result = backend.login(form.username.value, form.password.value);
                if (result.error) {
                    message = result.error;
                    document.querySelector('main').innerHTML = render();
                    this.mount();
                    return;
                }
                ctx.navigate(safeNext(ctx), { force: true });
            });
        },
    };
}

// REGISTER
export function register(ctx) {
    let message = null;

    const render = () => html`
        <div class="d-flex justify-content-center align-items-center" style="min-height: 70vh;">
            <div class="w-100" style="max-width: 400px;">
                ${message ? html`<div class="alert alert-warning" role="alert">${message}</div>` : ''}
                <form id="registerForm" class="form-signin">
                    <h1 class="h3 mb-3 fw-bolt text-center">Register</h1>
                    <div class="form-floating mb-3">
                        <input type="text" class="form-control" id="usernameInput" name="username" placeholder="Username" autocomplete="username" required>
                        <label for="usernameInput">Username</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="email" class="form-control" id="emailInput" name="email" placeholder="Email Address" autocomplete="email" required>
                        <label for="emailInput">Email Address</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="password" class="form-control" id="passwordInput" name="password" placeholder="Password" autocomplete="new-password" required>
                        <label for="passwordInput">Password</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="password" class="form-control" id="confirmationInput" name="confirmation" placeholder="Confirm Password" autocomplete="new-password" required>
                        <label for="confirmationInput">Confirm Password</label>
                    </div>
                    <button class="btn btn-outline-secondary w-100 py-2 mb-3" type="submit">Register</button>
                    <p class="mt-2">Already have an account? <a href="${url.login()}">Log In here.</a></p>
                    <p class="demo-hint small">Demo: the account is only stored in this browser. Do not reuse a real password.</p>
                </form>
            </div>
        </div>`;

    if (backend.currentUser()) return { redirect: url.home() };

    return {
        content: render(),
        mount() {
            const form = document.getElementById('registerForm');
            form.addEventListener('submit', event => {
                event.preventDefault();
                const result = backend.register(form.username.value, form.email.value, form.password.value, form.confirmation.value);
                if (result.error) {
                    message = result.error;
                    const values = { username: form.username.value, email: form.email.value };
                    document.querySelector('main').innerHTML = render();
                    this.mount();
                    const fresh = document.getElementById('registerForm');
                    fresh.username.value = values.username;
                    fresh.email.value = values.email;
                    return;
                }
                ctx.navigate(url.home(), { force: true });
            });
        },
    };
}

// LOGOUT
export function logout() {
    backend.logout();
    return { redirect: url.home() };
}

// PROFILE
export function profile(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;

    const user = backend.currentUser();
    const address = user.address;

    const content = html`
        <div class="container mt-4">
            <div class="w-100" style="max-width: 600px;">
                ${renderMessages()}
                <h2 class="h2 mb-3 fw-bold">User Profile</h2>

                <!-- Account Information with Update Button -->
                <div class="mb-4">
                    <h3 class="h3 mb-3 fw-bold">Account Information</h3>
                    <div id="accountInfoForm">
                        <div class="mb-3">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username" value="${user.username}" disabled>
                        </div>
                        <div class="mb-3">
                            <label for="email" class="form-label">Email Address</label>
                            <input type="email" class="form-control" id="email" value="${user.email}">
                        </div>
                        <div class="mb-3">
                            <label for="phone" class="form-label">Phone</label>
                            <input type="text" class="form-control" id="phone" value="${user.phone || ''}">
                        </div>
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label">Confirm Password to Update</label>
                            <input type="password" class="form-control" id="confirmPassword" placeholder="Enter your password">
                        </div>
                        <button id="updateAccountInfoBtn" type="button" class="btn btn-outline-secondary">Update Account Info</button>
                    </div>
                </div>

                <!-- Existing Shipping Addresses -->
                <div class="mb-4">
                    <h3 class="h3 mb-3 fw-bold">Shipping Addresses</h3>
                    ${address ? html`
                    <div class="card mb-2">
                        <div class="card-body">
                            <p class="card-text">${address.recipient_name}, ${address.full_address}, ${address.city}, ${address.zip_code}, ${address.country}</p>
                        </div>
                    </div>` : html`<p>No shipping addresses added yet.</p>`}
                    <button class="btn btn-outline-secondary mb-3" id="addAddressBtn">Add or Modify Address</button>
                </div>

                <!-- Add or Modify Shipping Address -->
                <div class="mb-4" id="newAddressForm" style="display:none;">
                    <h3 class="h3 mb-3 fw-bold">Add New Shipping Address</h3>
                    <form id="shippingAddressForm">
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="recipientNameInput" name="recipient_name" placeholder="Recipient Name" value="${address ? address.recipient_name : ''}" required>
                            <label for="recipientNameInput">Name</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="addressInput" name="address" placeholder="Enter your address" value="${address ? address.full_address : ''}" required>
                            <label for="addressInput">Address</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="cityInput" name="city" placeholder="City" value="${address ? address.city : ''}" required>
                            <label for="cityInput">City</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="zipCodeInput" name="zip_code" placeholder="Zip Code" value="${address ? address.zip_code : ''}" required>
                            <label for="zipCodeInput">Zip Code</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="text" class="form-control" id="countryInput" name="country" placeholder="Country" value="${address ? address.country : ''}" required>
                            <label for="countryInput">Country</label>
                        </div>
                        <button id="saveNewAddressBtn" type="button" class="btn btn-outline-secondary">Save New Address</button>
                    </form>
                </div>

                <!-- Change Password -->
                <div class="mb-4">
                    <h3 class="h3 mb-3 fw-bold">Change Password</h3>
                    <div id="changePasswordForm">
                        <div class="form-floating mb-3">
                            <input type="password" class="form-control" id="oldPassword" placeholder="Current Password" required>
                            <label for="oldPassword">Current Password</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="password" class="form-control" id="newPassword" placeholder="New Password" required>
                            <label for="newPassword">New Password</label>
                        </div>
                        <div class="form-floating mb-3">
                            <input type="password" class="form-control" id="confirmNewPassword" placeholder="Confirm New Password" required>
                            <label for="confirmNewPassword">Confirm New Password</label>
                        </div>
                        <button type="button" class="btn btn-outline-secondary" id="changePasswordBtn">Change Password</button>
                    </div>
                </div>
            </div>
        </div>`;

    function mount() {
        const value = id => document.getElementById(id).value;

        document.getElementById('updateAccountInfoBtn').addEventListener('click', () => {
            const result = backend.updateAccountInfo(value('email'), value('phone'), value('confirmPassword'));
            flash(result.error ? 'warning' : 'success', result.error || result.message);
            ctx.rerender();
        });

        document.getElementById('addAddressBtn').addEventListener('click', event => {
            event.preventDefault();
            document.getElementById('newAddressForm').style.display = 'block';
        });

        document.getElementById('saveNewAddressBtn').addEventListener('click', () => {
            const result = backend.editShippingAddress({
                recipient_name: value('recipientNameInput'),
                full_address: value('addressInput'),
                city: value('cityInput'),
                zip_code: value('zipCodeInput'),
                country: value('countryInput'),
            });
            if (result.error) {
                Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                return;
            }
            flash('success', result.message);
            ctx.rerender();
        });

        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            const result = backend.changePassword(value('oldPassword'), value('newPassword'), value('confirmNewPassword'));
            if (result.error) {
                Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                return;
            }
            flash('success', result.message);
            ctx.rerender();
        });
    }

    return { content, mount };
}

// ORDERS
export function orders(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;

    const userOrders = backend.userOrders();
    return {
        content: html`
            <div class="container mt-4 mb-4">
                <div class="row">
                    <div class="col-md-12">
                        <h2>Your Orders</h2>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Order Number</th>
                                    <th>Date</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userOrders.map(order => html`
                                <tr class="clickable-row" data-href="${url.orderDetail(order.id)}" style="cursor: pointer;">
                                    <td><a href="${url.orderDetail(order.id)}" class="product-link">${order.id}</a></td>
                                    <td>${formatDateTime(order.created_at)}</td>
                                    <td>${backend.PAYMENT_METHOD[order.payment_method]}</td>
                                    <td>${backend.ORDER_STATUS[order.status]}</td>
                                </tr>`)}
                            </tbody>
                        </table>
                        ${userOrders.length ? '' : html`<p>You have not placed any orders yet.</p>`}
                    </div>
                </div>
            </div>`,
        mount: mountClickableRows,
    };
}

export function mountClickableRows() {
    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => { window.location.hash = row.dataset.href; });
    });
}

// ORDER DETAIL
export function orderDetail(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;

    const order = backend.getOrder(ctx.params[0]);
    if (!order) {
        return {
            content: html`
                <div class="container text-center" style="margin-top: 50px;">
                    <h1>Oops! Something went wrong.</h1><br><br>
                    <p style="margin: 20px auto;">Order not found.</p><br><br>
                    <a href="${url.orders()}" class="btn btn-outline-secondary btn-sm return-home">View Orders</a>
                </div>`,
        };
    }

    return {
        content: html`
            <div class="container mt-4 mb-4">
                <div class="row">
                    <div class="col-md-12">
                        <h2>Order Details</h2>
                        <br>
                        <p><strong>Order Number:</strong> ${order.id}</p>
                        <p><strong>Date:</strong> ${formatDateTime(order.created_at)}</p>
                        <p><strong>Payment Method:</strong> ${backend.PAYMENT_METHOD[order.payment_method]}</p>
                        <p><strong>Status:</strong> ${backend.ORDER_STATUS[order.status]}</p>
                        <p><strong>Shipping Address:</strong> ${order.shipping_address}, ${order.shipping_city}</p>
                        ${order.payment_method === 'TRANSFER' ? html`<p><strong>Bank Account Number:</strong> ${order.bank_account_number}</p>` : ''}
                        <br>
                        <h3>Items</h3>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => html`
                                <tr class="clickable-row" data-href="${item.product ? url.product(item.product.category, item.product.id) : url.home()}" style="cursor: pointer;">
                                    <td>${item.product ? item.product.title : item.key}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${money(item.price_at_purchase)}</td>
                                    <td>$${money(backend.lineTotal(item.quantity, item.price_at_purchase))}</td>
                                </tr>`)}
                                <tr>
                                    <td colspan="3" class="text-end"><strong><h4>Total:</h4></strong></td>
                                    <td><h5>$${money(backend.orderTotal(order))}</h5></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`,
        mount: mountClickableRows,
    };
}
