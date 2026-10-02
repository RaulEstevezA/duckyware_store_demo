// payment.js
// Ports of payment.html, credit_card.html, transfer.html, payment_success.html
// and payment_error.html. The original project talks to the PayPal sandbox
// through paypalrestsdk on the server; here the gateway step is simulated.

import * as backend from '../backend.js';
import { html, money, url } from '../html.js';

function goToError(ctx, error) {
    ctx.navigate(`#/payment/error/?error=${encodeURIComponent(error)}`);
}

function orderSummary(items) {
    const total = items.reduce((sum, i) => sum + backend.lineTotal(i.quantity, i.price), 0);
    return html`
        <table class="table table-sm simulated-summary">
            <tbody>
                ${items.map(item => html`
                <tr>
                    <td>${item.product.title} <span class="text-muted">x${item.quantity}</span></td>
                    <td class="text-end">$${money(backend.lineTotal(item.quantity, item.price))}</td>
                </tr>`)}
                <tr>
                    <th>Total</th>
                    <th class="text-end">$${money(total)}</th>
                </tr>
            </tbody>
        </table>`;
}

// Checks shared by all payment pages: logged in, address and a non-empty cart
function paymentGuard(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;
    const user = backend.currentUser();
    if (!user.address || !backend.cartItems().length) return { redirect: url.checkout() };
    return null;
}

function simulateProcessing(button, done) {
    button.disabled = true;
    button.textContent = 'Processing...';
    setTimeout(done, 900);
}

// PAYPAL PAYMENT (payment.html)
export function paypalPayment(ctx) {
    const guard = paymentGuard(ctx);
    if (guard) return guard;

    return {
        content: html`
            <div class="container mt-4 mb-4">
                <div class="row justify-content-center">
                    <div class="col-md-6 text-center">
                        <h1>Proceeding to PayPal...</h1>
                        <br>
                        <button type="button" class="btn btn-outline-secondary btn-lg" id="payWithPaypalButton">Pay with PayPal</button>
                    </div>
                </div>
            </div>`,
        mount() {
            document.getElementById('payWithPaypalButton').addEventListener('click', () => {
                ctx.navigate('#/payment/paypal/');
            });
        },
    };
}

// Simulated PayPal sandbox approval (replaces the redirect to PayPal and payment_execute)
export function paypalSandbox(ctx) {
    const guard = paymentGuard(ctx);
    if (guard) return guard;

    const user = backend.currentUser();
    const items = backend.cartItems();

    return {
        content: html`
            <div class="container mt-4 mb-4">
                <div class="row justify-content-center">
                    <div class="col-lg-6 col-md-8">
                        <div class="simulated-gateway">
                            <p class="simulated-badge">Simulated payment gateway</p>
                            <h2>PayPal sandbox approval</h2>
                            <p>
                                In the original Django project this step redirects to the PayPal sandbox and then
                                executes the payment on the server. GitHub Pages has no server, so the approval is
                                simulated: no PayPal account is needed and nothing is charged.
                            </p>
                            ${orderSummary(items)}
                            <p class="mb-4"><strong>Ship to:</strong> ${user.address.recipient_name}, ${user.address.full_address}, ${user.address.city}</p>
                            <div class="simulated-actions">
                                <button type="button" class="btn btn-outline-secondary btn-lg" id="approvePaymentButton">Approve payment</button>
                                <button type="button" class="btn btn-outline-danger btn-lg" id="cancelPaymentButton">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`,
        mount() {
            const approve = document.getElementById('approvePaymentButton');
            approve.addEventListener('click', () => {
                simulateProcessing(approve, () => {
                    const result = backend.placeOrder('PAYPAL');
                    if (result.error) goToError(ctx, result.error);
                    else ctx.navigate('#/payment/success/');
                });
            });
            // cancel_url pointed to the home page in the original
            document.getElementById('cancelPaymentButton').addEventListener('click', () => ctx.navigate(url.home()));
        },
    };
}

// CREDIT CARD PAYMENT
export function creditCard(ctx) {
    const guard = paymentGuard(ctx);
    if (guard) return guard;

    return {
        content: html`
            <div class="container mt-4 mb-4">
                <div class="row justify-content-center">
                    <div class="col-md-4">
                        <h2>Credit Card Payment</h2>
                        <br>
                        <p class="demo-hint small">
                            Simulated payment: use the test values below. Do not enter real card details,
                            nothing is sent or stored.
                        </p>
                        <form id="creditCardForm" novalidate>
                            <div class="form-group mb-3">
                                <label for="cardNumber">Card Number</label>
                                <input type="text" class="form-control" id="cardNumber" placeholder="Enter card number" inputmode="numeric" autocomplete="off" value="4242 4242 4242 4242">
                            </div>
                            <div class="form-group mb-3">
                                <label for="expiryDate">Expiry Date</label>
                                <input type="text" class="form-control" id="expiryDate" placeholder="MM/YY" autocomplete="off" value="12/30">
                            </div>
                            <div class="form-group mb-3">
                                <label for="cvv">CVV</label>
                                <input type="text" class="form-control" id="cvv" placeholder="CVV" inputmode="numeric" autocomplete="off" value="123">
                            </div>
                            <div class="text-center">
                                <button type="submit" id="confirmPaymentButton" class="btn btn-outline-secondary btn-lg mt-4">Confirm Payment</button>
                                <button type="button" id="cancelPaymentButton" class="btn btn-outline-danger btn-lg mt-4">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`,
        mount() {
            const form = document.getElementById('creditCardForm');
            form.addEventListener('submit', event => {
                event.preventDefault();
                const number = document.getElementById('cardNumber').value.replace(/[\s-]/g, '');
                const expiry = document.getElementById('expiryDate').value.trim();
                const cvv = document.getElementById('cvv').value.trim();

                let error = null;
                if (!/^\d{12,19}$/.test(number)) error = 'The card number must have between 12 and 19 digits.';
                else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) error = 'The expiry date must have the format MM/YY.';
                else if (!/^\d{3,4}$/.test(cvv)) error = 'The CVV must have 3 or 4 digits.';
                if (error) {
                    Swal.fire({ icon: 'error', title: 'Error', text: error });
                    return;
                }

                simulateProcessing(document.getElementById('confirmPaymentButton'), () => {
                    const result = backend.placeOrder('CREDIT_CARD');
                    if (result.error) goToError(ctx, result.error);
                    else ctx.navigate('#/payment/success/');
                });
            });
            document.getElementById('cancelPaymentButton').addEventListener('click', () => {
                goToError(ctx, 'Payment was cancelled or failed.');
            });
        },
    };
}

// TRANSFER PAYMENT
export function transfer(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;

    const order = backend.getOrder(ctx.params[0]);
    if (!order) return { redirect: url.orders() };

    return {
        content: html`
            <div class="container mt-4 mb-4">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <h2>Transfer Payment Instructions</h2>
                        <br>
                        <p>Please transfer the amount to the following bank account:</p>
                        <p><strong>Bank Account Number:</strong> ${order.bank_account_number}</p>
                        <p>Make sure to include the following order number in the payment reference:</p>
                        <p><strong>Order Number:</strong> ${order.id}</p>
                        <p><strong>Amount:</strong> $${money(backend.orderTotal(order))}</p>
                        <p>Once the transfer is complete, please allow some time for the payment to be confirmed.</p>
                        <p class="demo-hint small">Demo: this is an example account number, no transfer is expected.</p>
                        <div class="text-center">
                            <a href="${url.orders()}" class="btn btn-outline-secondary btn-lg mt-4">View Orders</a>
                        </div>
                    </div>
                </div>
            </div>`,
    };
}

// PAYMENT SUCCESS
export function paymentSuccess() {
    return {
        content: html`
            <div class="container mt-4">
                <h1>Payment Successful</h1>
                <br>
                <p>Thank you for your purchase. Your payment has been processed successfully.</p>
                <div class="text-center">
                    <a href="${url.orders()}" class="btn btn-outline-secondary btn-lg mt-4">View Orders</a>
                </div>
            </div>`,
    };
}

// PAYMENT ERROR
export function paymentError(ctx) {
    const error = ctx.query.get('error') || 'Unknown error.';
    return {
        content: html`
            <div class="container mt-4">
                <h1>Payment Error</h1>
                <br>
                <p>There was an error processing your payment: ${error}</p>
                <div class="text-center mt-4">
                    <a href="${url.home()}" class="btn btn-outline-secondary btn-lg">Return to Home Page</a>
                </div>
            </div>`,
    };
}
