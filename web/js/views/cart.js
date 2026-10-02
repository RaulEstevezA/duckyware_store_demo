// cart.js
// Ports of cart.html (+ cart.js) and checkout.html (+ checkout.js).

import * as backend from '../backend.js';
import { html, money, url } from '../html.js';
import { flash, renderMessages } from '../messages.js';

function productLink(product) {
    return url.product(product.category, product.id);
}

function cartTotal(items) {
    return items.reduce((sum, i) => sum + backend.lineTotal(i.quantity, i.price), 0);
}

// CART
export function cart(ctx) {
    const items = backend.cartItems();

    const content = html`
        <div class="container mt-4 mb-4">
            <h1 class="text-center">Your Cart</h1>
            ${!items.length ? html`
                <br><br>
                <p>Your cart is empty.</p>` : html`
                <br><br>
                <div class="cart-items">
                    <div class="row">
                        <div class="col-12">
                            <div class="cart-header">
                                <div class="row">
                                    <div class="col-md-7 col-sm-6"><h4>Product</h4></div>
                                    <div class="col-md-1 col-sm-2"><h4>Quantity</h4></div>
                                    <div class="col-md-1 col-sm-2"></div>
                                    <div class="col-md-1 col-sm-2"><h4>Price</h4></div>
                                    <div class="col-md-1 col-sm-2"><h4>Subtotal</h4></div>
                                    <div class="col-md-1 col-sm-2"></div>
                                </div>
                            </div>
                            ${items.map(item => html`
                            <div class="cart-item">
                                <div class="row align-items-start">
                                    <div class="col-md-7 col-sm-6">
                                        <div class="cart-product-name"><a href="${productLink(item.product)}" class="product-link">
                                            ${item.product.title}
                                        </a></div>
                                    </div>
                                    <div class="col-md-1 col-sm-2">
                                        <input type="number" class="form-control quantity-input" value="${item.quantity}" min="1" max="${item.max_units}" data-item-id="${item.id}" aria-label="Quantity">
                                    </div>
                                    <div class="col-md-1 col-sm-2"></div>
                                    <div class="col-md-1 col-sm-2">
                                        <div class="cart-price">$${money(item.price)}</div>
                                    </div>
                                    <div class="col-md-1 col-sm-2">
                                        <div class="cart-total">$${money(backend.lineTotal(item.quantity, item.price))}</div>
                                    </div>
                                    <div class="col-md-1 col-sm-2">
                                        <button class="btn btn-outline-danger btn-sm remove-item-button" data-item-id="${item.id}">Delete</button>
                                    </div>
                                </div>
                            </div>`)}
                            <br>
                            <div class="cart-footer">
                                <div class="row">
                                    <div class="col-md-8 col-sm-6 text-end"><h4>Total:</h4></div>
                                    <div class="col-md-2 col-sm-3"></div>
                                    <div class="col-md-2 col-sm-3"><h4>$${money(cartTotal(items))}</h4></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="cart-actions mt-4 text-center">
                    <div class="row">
                        <div class="col-md-8 col-sm-6"></div>
                        <div class="col-md-2 col-sm-3">
                            <button id="clear-cart-button" class="btn btn-danger btn-sm">Clear Cart</button>
                        </div>
                        <div class="col-md-2 col-sm-3">
                            <a href="${url.checkout()}" class="btn btn-outline-secondary btn-sm">Proceed to Checkout</a>
                        </div>
                    </div>
                </div>`}
        </div>`;

    function mount() {
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const maxUnits = parseInt(input.getAttribute('max'), 10);
                if (parseInt(input.value, 10) > maxUnits) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `You can only add up to ${maxUnits} units of this item.`,
                    });
                    input.value = maxUnits;
                    return;
                }
                const result = backend.updateCartItem(input.dataset.itemId, input.value);
                if (result.success) {
                    ctx.rerender();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'Failed to update cart' });
                    ctx.rerender();
                }
            });
        });

        document.querySelectorAll('.remove-item-button').forEach(button => {
            button.addEventListener('click', () => {
                Swal.fire({
                    title: 'Are you sure?',
                    text: 'Do you want to remove this item from your cart?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, remove it!',
                }).then(result => {
                    if (!result.isConfirmed) return;
                    const response = backend.removeCartItem(button.dataset.itemId);
                    if (response.success) {
                        Swal.fire('Removed!', 'The item has been removed from your cart.', 'success').then(() => ctx.rerender());
                    } else {
                        Swal.fire('Failed to remove item', '', 'error');
                    }
                });
            });
        });

        const clearCartButton = document.getElementById('clear-cart-button');
        if (clearCartButton) {
            clearCartButton.addEventListener('click', () => {
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, clear it!',
                }).then(result => {
                    if (!result.isConfirmed) return;
                    backend.clearCart();
                    Swal.fire('Cleared!', 'Your cart has been cleared.', 'success').then(() => ctx.rerender());
                });
            });
        }
    }

    return { content, mount };
}

// CHECKOUT
export function checkout(ctx) {
    const user = backend.currentUser();
    const items = backend.cartItems();
    const address = user ? user.address : null;

    const paymentForm = html`
        <h2>Shipping Address</h2>
        <br>
        <p>${address && address.recipient_name}</p>
        <p>${address && address.full_address}</p>
        <p>${address && address.city}, ${address && address.zip_code}</p>
        <p>${address && address.country}</p>
        <div class="checkout-action mt-4 text-center">
            ${items.length ? html`
            <form id="paymentForm">
                <div class="form-group">
                    <select class="form-select" name="payment_method" id="payment_method" required aria-label="Payment method">
                        <option value="1" disabled selected>Select Payment Method</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="paypal">PayPal</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-outline-secondary btn-lg mt-4" id="proceedToPaymentButton">Proceed to Payment</button>
            </form>` : html`<div class="alert alert-warning">Your cart is empty. <a href="${url.home()}">Keep shopping</a>.</div>`}
        </div>

        <div class="mt-4">
            <h5>PayPal Sandbox Testing Information</h5>
            <p>
                The original project connects to the PayPal sandbox. In this GitHub Pages demo
                the PayPal step is <strong>simulated</strong>: you do not need a PayPal account
                and no real payment is made.
            </p>
        </div>`;

    const addressForm = html`
        <h2>Add Shipping Address</h2>
        <br>
        <form id="shippingAddressForm">
            <div class="form-group mb-3">
                <input type="text" class="form-control" id="recipient_name" placeholder="Recipient Name" aria-label="Recipient Name" required>
            </div>
            <div class="form-group mb-3">
                <input type="text" class="form-control" id="full_address" placeholder="Address" aria-label="Address" required>
            </div>
            <div class="form-group mb-3">
                <input type="text" class="form-control" id="city" placeholder="City" aria-label="City" required>
            </div>
            <div class="form-group mb-3">
                <input type="text" class="form-control" id="zip_code" placeholder="Zip Code" aria-label="Zip Code" required>
            </div>
            <div class="form-group mb-3">
                <input type="text" class="form-control" id="country" placeholder="Country" aria-label="Country" required>
            </div>
            <div class="text-center">
                <button type="button" class="btn btn-outline-secondary btn-lg" id="saveAddressButton">Save Address</button>
            </div>
        </form>`;

    const content = html`
        <div class="container mt-4 mb-4">
            <div class="row">
                ${renderMessages()}

                <!-- Left Side: List of Products -->
                <div class="col-md-9">
                    <h2>Review Your Order</h2>
                    <br>
                    <div class="cart-items">
                        <div class="cart-header">
                            <div class="row">
                                <div class="col-md-7"><h4>Product</h4></div>
                                <div class="col-md-1"><h4>Quantity</h4></div>
                                <div class="col-md-1"></div>
                                <div class="col-md-1"><h4>Price</h4></div>
                                <div class="col-md-1"><h4>Subtotal</h4></div>
                                <div class="col-md-1"></div>
                            </div>
                        </div>
                        ${items.map(item => html`
                        <div class="cart-item">
                            <div class="row align-items-start">
                                <div class="col-md-7">
                                    <div class="cart-product-name">
                                        <a href="${productLink(item.product)}" class="product-link">
                                            ${item.product.title}
                                        </a>
                                    </div>
                                </div>
                                <div class="col-md-1">
                                    <div class="cart-quantity">${item.quantity}</div>
                                </div>
                                <div class="col-md-1"></div>
                                <div class="col-md-1">
                                    <div class="cart-price">$${money(item.price)}</div>
                                </div>
                                <div class="col-md-1">
                                    <div class="cart-total">$${money(backend.lineTotal(item.quantity, item.price))}</div>
                                </div>
                                <div class="col-md-1"></div>
                            </div>
                        </div>`)}
                        <br>
                        <div class="cart-footer">
                            <div class="row">
                                <div class="col-md-8 text-end"><h4>Total:</h4></div>
                                <div class="col-md-2"></div>
                                <div class="col-md-2"><h4>$${money(cartTotal(items))}</h4></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side: Shipping Information -->
                <div class="col-md-3">
                    ${user
                        ? (address ? paymentForm : addressForm)
                        : html`
                            <div class="alert alert-warning">
                                <p>Please <a href="${url.login()}?next=${encodeURIComponent(url.checkout())}">login</a> or <a href="${url.register()}">register</a> to proceed with your order.</p>
                            </div>`}
                </div>
            </div>
        </div>`;

    function mount() {
        const paymentFormElement = document.getElementById('paymentForm');
        if (paymentFormElement) {
            paymentFormElement.addEventListener('submit', event => {
                event.preventDefault();
                const paymentMethod = document.getElementById('payment_method').value;
                if (paymentMethod === '1') {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a payment method.' });
                    return;
                }
                if (paymentMethod === 'paypal') {
                    ctx.navigate('#/payment/');
                } else if (paymentMethod === 'credit_card') {
                    ctx.navigate('#/credit_card/');
                } else if (paymentMethod === 'transfer') {
                    // transfer_payment creates the order straight away
                    const result = backend.placeOrder('TRANSFER');
                    if (result.error) {
                        ctx.navigate(`#/payment/error/?error=${encodeURIComponent(result.error)}`);
                    } else {
                        ctx.navigate(`#/transfer/${result.order.id}/`);
                    }
                }
            });
        }

        const saveAddressButton = document.getElementById('saveAddressButton');
        if (saveAddressButton) {
            saveAddressButton.addEventListener('click', () => {
                const value = id => document.getElementById(id).value;
                const result = backend.editShippingAddress({
                    recipient_name: value('recipient_name'),
                    full_address: value('full_address'),
                    city: value('city'),
                    zip_code: value('zip_code'),
                    country: value('country'),
                });
                if (result.error) {
                    Swal.fire({ icon: 'error', title: 'Error', text: result.error });
                    return;
                }
                flash('success', result.message);
                ctx.rerender();
            });
        }
    }

    return { content, mount };
}
