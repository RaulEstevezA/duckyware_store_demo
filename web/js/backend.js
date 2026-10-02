// backend.js
// Simulated Django backend for the GitHub Pages demo.
//
// The original project keeps everything in db.sqlite3 and runs the logic in
// store/views.py. GitHub Pages only serves static files, so:
//   - the catalogue (categories, products, images) is read from data/store.json,
//     exported from the original database by tools/export_data.py;
//   - users, sessions, carts, wishlists, orders and stock changes are stored in
//     the visitor's browser (localStorage), so every visitor gets a private copy.
// The functions below mirror the views of the original app one by one.

const STORAGE_KEY = 'duckyware-demo-v1';

export const ORDER_STATUS = {
    CONFIRMING_PAYMENT: 'Confirming Payment',
    PREPARING: 'Preparing',
    AWAITING_PICKUP: 'Awaiting Pickup',
    EN_ROUTE: 'En Route',
    DELIVERED: 'Delivered',
};

export const PAYMENT_METHOD = {
    PAYPAL: 'PayPal',
    CREDIT_CARD: 'Credit Card',
    TRANSFER: 'Transfer',
};

// Example bank account number, as in Order.save()
const BANK_ACCOUNT_NUMBER = '1234567890';

export const DEMO_ACCOUNTS = [
    { username: 'demo', password: 'demo1234', role: 'Customer with address and past orders' },
    { username: 'admin', password: 'admin1234', role: 'Staff user with access to the Admin Panel' },
];

let catalog = null;
let state = null;
let storageAvailable = true;

// ---------------------------------------------------------------------------
// persistence

function load() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        storageAvailable = false;
        return null;
    }
}

function save() {
    if (!storageAvailable) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        storageAvailable = false;
    }
}

export function isPersistent() {
    return storageAvailable;
}

// Passwords never leave the browser; they are kept hashed anyway (cyrb53).
function hashPassword(password, salt) {
    const str = `${salt}:${password}`;
    let h1 = 0xdeadbeef ^ 7, h2 = 0x41c6ce57 ^ 7;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function checkPassword(user, password) {
    return hashPassword(password, user.username) === user.password;
}

function seed() {
    const now = new Date().toISOString();
    const demoAddress = {
        recipient_name: 'Ducky Demo',
        full_address: '1 Rubber Duck Street',
        city: 'Barcelona',
        zip_code: '08001',
        country: 'Spain',
    };

    const fresh = {
        createdAt: now,
        session: { userId: null },
        users: [
            { id: 1, username: 'admin', email: 'admin@example.com', is_staff: true, phone: '', address: null },
            { id: 2, username: 'demo', email: 'demo@example.com', is_staff: false, phone: '+34 600 000 000', address: demoAddress },
        ],
        carts: { anon: [] },
        wishlists: {},
        orders: [],
        productOverrides: {},
        extraCategories: [],
        nextIds: { user: 3, cartItem: 1, order: 1, category: 1000 },
    };
    fresh.users.forEach(u => {
        const account = DEMO_ACCOUNTS.find(a => a.username === u.username);
        u.password = hashPassword(account.password, u.username);
    });

    state = fresh;

    // A couple of past orders so the "Orders" page has something to show
    const pastOrders = [
        { date: '2024-07-02T17:44:00', method: 'PAYPAL', status: 'DELIVERED', items: [['CaseFan-1', 2], ['ComputerCase-2', 1]] },
        { date: '2024-07-15T10:21:00', method: 'TRANSFER', status: 'EN_ROUTE', items: [['CPU-2', 1]] },
    ];
    pastOrders.forEach(o => {
        const items = o.items
            .map(([key, quantity]) => ({ product: getProductByKey(key), quantity }))
            .filter(i => i.product)
            .map(i => ({ key: i.product.key, quantity: i.quantity, price_at_purchase: unitPrice(i.product, i.quantity) }));
        if (!items.length) return;
        state.orders.push(makeOrder(2, demoAddress, o.method, o.status, o.date, items));
    });
    wishlistFor(2).push('CPU-4', 'PowerSupply-1');

    return state;
}

export async function init() {
    const response = await fetch('data/store.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load the catalogue (${response.status})`);
    catalog = await response.json();
    catalog.products.forEach(p => { p.key = `${p.type}-${p.id}`; });

    state = load() || seed();
    save();
}

export function resetDemo() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore: storage is not available
    }
    state = null;
    state = seed();
    save();
}

// ---------------------------------------------------------------------------
// money helpers (the original uses Decimal with ROUND_HALF_UP)

function toCents(value) {
    return Math.round(Number(value) * 100);
}

function fromCents(cents) {
    return cents / 100;
}

// product.price - (product.price * product.discount / 100), rounded half up
export function discountedPrice(product) {
    const price = toCents(product.price);
    const discount = toCents(product.discount); // hundredths of a percent
    return fromCents(Math.floor((price * (10000 - discount) + 5000) / 10000));
}

export function hasDiscount(product) {
    return product.discounted_units > 0;
}

// Price of one unit for a cart line of `quantity` units (get_cart_data)
export function unitPrice(product, quantity) {
    if (product.discounted_units > 0 && quantity <= product.discounted_units) {
        return discountedPrice(product);
    }
    return Number(product.price);
}

export function maxUnits(product) {
    return product.discounted_units > 0 ? product.discounted_units : product.stock_quantity;
}

export function lineTotal(quantity, price) {
    return fromCents(Math.round(quantity * toCents(price)));
}

// ---------------------------------------------------------------------------
// catalogue

function withOverrides(product) {
    const override = state.productOverrides[product.key];
    return override ? { ...product, ...override } : { ...product };
}

export function allProducts() {
    return catalog.products.map(withOverrides);
}

export function getProductByKey(key) {
    const product = catalog.products.find(p => p.key === key);
    return product ? withOverrides(product) : null;
}

export function getProduct(categoryName, id) {
    const product = catalog.products.find(p => p.category === categoryName && p.id === Number(id));
    return product ? withOverrides(product) : null;
}

export function getImage(product) {
    return product.images.length ? `media/${product.images[0]}` : null;
}

export function getImages(product) {
    return product.images.map(path => `media/${path}`);
}

export function categories() {
    return [...catalog.categories, ...state.extraCategories];
}

export function getCategory(name) {
    return categories().find(c => c.name === name) || null;
}

export function childrenOf(categoryId) {
    return categories().filter(c => c.parent === categoryId);
}

function descendantIds(categoryId) {
    const ids = [categoryId];
    childrenOf(categoryId).forEach(child => ids.push(...descendantIds(child.id)));
    return ids;
}

// The original view only lists products of the exact category; the demo also
// includes subcategories so parent menu entries ("Components", "Cooling"...)
// are not empty pages.
export function categoryProducts(categoryName) {
    const category = getCategory(categoryName);
    if (!category) return null;
    const ids = descendantIds(category.id);
    return allProducts().filter(p => ids.includes(p.category_id));
}

export function homeData() {
    const products = allProducts();
    const inStock = products.filter(p => p.stock_quantity > 0);

    const discounted = inStock.filter(p => p.discounted_units > 0 && getImage(p));
    for (let i = discounted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [discounted[i], discounted[j]] = [discounted[j], discounted[i]];
    }

    const topSells = inStock
        .filter(p => p.units_sold > 0)
        .sort((a, b) => b.units_sold - a.units_sold)
        .slice(0, 3)
        .filter(p => getImage(p));

    const lastUnits = [...inStock]
        .sort((a, b) => a.stock_quantity - b.stock_quantity)
        .slice(0, 3)
        .filter(p => getImage(p));

    return { discounted: discounted.slice(0, 9), topSells, lastUnits };
}

export function search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProducts().filter(p => p.title.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// authentication

export function currentUser() {
    const id = state.session.userId;
    return id ? state.users.find(u => u.id === id) || null : null;
}

function cartKey(user = currentUser()) {
    return user ? `u${user.id}` : 'anon';
}

function cartFor(key) {
    if (!state.carts[key]) state.carts[key] = [];
    return state.carts[key];
}

function mergeCart(user) {
    const anon = cartFor('anon');
    const userCart = cartFor(cartKey(user));
    anon.forEach(item => {
        const existing = userCart.find(i => i.key === item.key);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            userCart.push({ ...item });
        }
    });
    state.carts.anon = [];
}

export function login(username, password) {
    const user = state.users.find(u => u.username === username);
    if (!user || !checkPassword(user, password)) {
        return { error: 'Invalid username or password.' };
    }
    state.session.userId = user.id;
    mergeCart(user);
    save();
    return { user };
}

export function register(username, email, password, confirmation) {
    username = username.trim();
    if (password !== confirmation) return { error: 'Passwords must match.' };
    if (state.users.some(u => u.username === username)) return { error: 'Username already exists.' };

    const user = {
        id: state.nextIds.user++,
        username,
        email,
        is_staff: false,
        phone: '',
        address: null,
        password: hashPassword(password, username),
    };
    state.users.push(user);
    state.session.userId = user.id;
    mergeCart(user);
    save();
    return { user };
}

// logout_view also empties the user's cart (clear_cart_buy)
export function logout() {
    const user = currentUser();
    if (user) state.carts[cartKey(user)] = [];
    state.session.userId = null;
    save();
}

// ---------------------------------------------------------------------------
// cart

export function cartItems() {
    return cartFor(cartKey())
        .map(item => {
            const product = getProductByKey(item.key);
            if (!product) return null;
            return {
                id: item.id,
                product,
                quantity: item.quantity,
                price: unitPrice(product, item.quantity),
                max_units: maxUnits(product),
            };
        })
        .filter(Boolean);
}

export function cartData() {
    const items = cartItems();
    return {
        cart_items: items.reduce((sum, i) => sum + i.quantity, 0),
        cart_total: items.reduce((sum, i) => sum + lineTotal(i.quantity, i.price), 0),
    };
}

export function getCartQuantity(product) {
    return cartFor(cartKey())
        .filter(i => i.key === product.key)
        .reduce((sum, i) => sum + i.quantity, 0);
}

export function addToCart(product, quantity) {
    quantity = parseInt(quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1) {
        return { error: 'Please select a valid quantity.' };
    }
    const cart = cartFor(cartKey());
    const limit = maxUnits(product);
    let item = cart.find(i => i.key === product.key);
    const inCart = item ? item.quantity : 0;

    if (inCart + quantity > limit) {
        return { error: `Only can add ${limit - inCart} units. The total quantity in the cart and the quantity you want to add cannot exceed the stock.` };
    }
    if (item) {
        item.quantity += quantity;
    } else {
        item = { id: state.nextIds.cartItem++, key: product.key, quantity };
        cart.push(item);
    }
    save();
    return { success: true };
}

export function updateCartItem(itemId, quantity) {
    quantity = parseInt(quantity, 10);
    const item = cartFor(cartKey()).find(i => i.id === Number(itemId));
    if (!item) return { error: 'Cart item not found' };
    if (!Number.isInteger(quantity) || quantity < 1) return { error: 'Quantity must be at least 1.' };

    const product = getProductByKey(item.key);
    if (quantity > product.stock_quantity) {
        return { error: `Only ${product.stock_quantity} units left in stock.` };
    }
    item.quantity = quantity;
    save();
    return { success: true };
}

export function removeCartItem(itemId) {
    const key = cartKey();
    const before = cartFor(key).length;
    state.carts[key] = cartFor(key).filter(i => i.id !== Number(itemId));
    save();
    return before !== state.carts[key].length ? { success: true } : { success: false, error: 'Item does not exist' };
}

export function clearCart() {
    state.carts[cartKey()] = [];
    save();
    return { success: true };
}

// ---------------------------------------------------------------------------
// wishlist

function wishlistFor(userId) {
    if (!state.wishlists[userId]) state.wishlists[userId] = [];
    return state.wishlists[userId];
}

export function isInWishlist(product) {
    const user = currentUser();
    return user ? wishlistFor(user.id).includes(product.key) : false;
}

export function addToWishlist(product) {
    const user = currentUser();
    if (!user) return { success: false, error: 'Login required' };
    const list = wishlistFor(user.id);
    if (!list.includes(product.key)) list.push(product.key);
    save();
    return { success: true };
}

export function removeFromWishlist(product) {
    const user = currentUser();
    if (!user) return { success: false, error: 'Login required' };
    state.wishlists[user.id] = wishlistFor(user.id).filter(k => k !== product.key);
    save();
    return { success: true };
}

export function wishlistProducts() {
    const user = currentUser();
    if (!user) return [];
    return wishlistFor(user.id).map(getProductByKey).filter(Boolean);
}

// ---------------------------------------------------------------------------
// profile

export function updateAccountInfo(email, phone, confirmPassword) {
    const user = currentUser();
    if (!checkPassword(user, confirmPassword)) {
        return { error: 'Password does not match our records.' };
    }
    user.email = email;
    user.phone = phone;
    save();
    return { message: 'Your account information has been updated.' };
}

// ShippingAddress.objects.update_or_create(profile=profile, ...): one address per user
export function editShippingAddress(data) {
    const user = currentUser();
    const fields = ['recipient_name', 'full_address', 'city', 'zip_code', 'country'];
    const address = {};
    for (const field of fields) {
        const value = (data[field] || '').trim();
        if (!value) return { error: 'All fields are required' };
        address[field] = value;
    }
    const created = !user.address;
    user.address = address;
    save();
    return { message: created ? 'New shipping address added successfully.' : 'Shipping address updated successfully.' };
}

export function changePassword(oldPassword, newPassword, confirmPassword) {
    const user = currentUser();
    if (!checkPassword(user, oldPassword)) return { error: 'Old password is incorrect.' };
    if (newPassword !== confirmPassword) return { error: 'New passwords do not match.' };
    if (!newPassword) return { error: 'The new password cannot be empty.' };
    user.password = hashPassword(newPassword, user.username);
    save();
    return { message: 'Your password has been updated successfully.' };
}

// ---------------------------------------------------------------------------
// orders and payments

function makeOrder(userId, address, paymentMethod, status, createdAt, items) {
    return {
        id: state.nextIds.order++,
        userId,
        created_at: createdAt,
        shipping_address: address.full_address,
        shipping_city: address.city,
        status,
        payment_method: paymentMethod,
        bank_account_number: paymentMethod === 'TRANSFER' ? BANK_ACCOUNT_NUMBER : null,
        items,
    };
}

// discount_stock + clear_cart_buy
function finalizeOrder(user, lines) {
    lines.forEach(({ product, quantity }) => {
        const override = state.productOverrides[product.key] || {};
        override.discounted_units = product.discounted_units > 0
            ? Math.max(0, product.discounted_units - quantity)
            : product.discounted_units;
        override.stock_quantity = Math.max(0, product.stock_quantity - quantity);
        override.units_sold = product.units_sold + quantity;
        state.productOverrides[product.key] = override;
    });
    state.carts[cartKey(user)] = [];
}

// Shared body of payment_execute, credit_card_execute and transfer_payment
export function placeOrder(paymentMethod) {
    const user = currentUser();
    if (!user) return { error: 'User profile not found.' };
    if (!user.address) return { error: 'Shipping address is missing.' };

    const lines = cartItems();
    if (!lines.length) return { error: 'Your cart is empty.' };

    const items = lines.map(line => ({
        key: line.product.key,
        quantity: line.quantity,
        price_at_purchase: line.price,
    }));
    const order = makeOrder(user.id, user.address, paymentMethod, 'CONFIRMING_PAYMENT', new Date().toISOString(), items);
    state.orders.push(order);
    finalizeOrder(user, lines);
    save();
    return { order };
}

function withProducts(order) {
    return {
        ...order,
        items: order.items.map(item => ({ ...item, product: getProductByKey(item.key) })),
    };
}

export function userOrders() {
    const user = currentUser();
    if (!user) return [];
    return state.orders
        .filter(o => o.userId === user.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(withProducts);
}

export function getOrder(id) {
    const user = currentUser();
    const order = state.orders.find(o => o.id === Number(id) && user && (o.userId === user.id));
    return order ? withProducts(order) : null;
}

export function orderTotal(order) {
    return order.items.reduce((sum, i) => sum + lineTotal(i.quantity, i.price_at_purchase), 0);
}

// ---------------------------------------------------------------------------
// admin panel (replaces the Django admin site)

function requireStaff() {
    const user = currentUser();
    return Boolean(user && user.is_staff);
}

export function adminData() {
    if (!requireStaff()) return null;
    return {
        products: allProducts(),
        orders: [...state.orders].sort((a, b) => b.id - a.id).map(o => ({
            ...withProducts(o),
            username: (state.users.find(u => u.id === o.userId) || {}).username || '(deleted)',
        })),
        users: state.users.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            phone: u.phone,
            is_staff: u.is_staff,
            address: u.address,
            orders: state.orders.filter(o => o.userId === u.id).length,
        })),
        categories: categories(),
    };
}

export function adminUpdateProduct(key, values) {
    if (!requireStaff()) return { error: 'Permission denied' };
    const product = getProductByKey(key);
    if (!product) return { error: 'Product not found' };

    const price = Number(values.price);
    const discount = Number(values.discount);
    const discountedUnits = Number(values.discounted_units);
    const stock = Number(values.stock_quantity);
    if (!(price >= 0) || !(discount >= 0 && discount <= 100)) return { error: 'Price must be positive and discount between 0 and 100.' };
    if (!Number.isInteger(discountedUnits) || discountedUnits < 0 || !Number.isInteger(stock) || stock < 0) {
        return { error: 'Stock and discounted units must be whole numbers (0 or more).' };
    }
    if (discountedUnits > stock) return { error: 'Discounted units cannot exceed the stock.' };

    state.productOverrides[key] = {
        ...(state.productOverrides[key] || {}),
        price: price.toFixed(2),
        discount: discount.toFixed(2),
        discounted_units: discountedUnits,
        stock_quantity: stock,
    };
    save();
    return { success: true };
}

export function adminSetOrderStatus(orderId, status) {
    if (!requireStaff()) return { error: 'Permission denied' };
    if (!ORDER_STATUS[status]) return { error: 'Invalid status' };
    const order = state.orders.find(o => o.id === Number(orderId));
    if (!order) return { error: 'Order not found' };
    order.status = status;
    save();
    return { success: true };
}

export function adminToggleStaff(userId) {
    if (!requireStaff()) return { error: 'Permission denied' };
    const user = state.users.find(u => u.id === Number(userId));
    if (!user) return { error: 'User not found' };
    if (user.id === currentUser().id) return { error: 'You cannot remove your own staff status.' };
    user.is_staff = !user.is_staff;
    save();
    return { success: true };
}

export function adminAddCategory(name, parentId) {
    if (!requireStaff()) return { error: 'Permission denied' };
    name = name.trim();
    const parent = parentId ? Number(parentId) : null;
    if (!name) return { error: 'The category name is required.' };
    if (parent && !categories().some(c => c.id === parent)) return { error: 'Parent category not found.' };
    // unique_together = ('name', 'parent') in the model; the URLs use the name, so keep it unique
    if (categories().some(c => c.name.toLowerCase() === name.toLowerCase())) {
        return { error: 'A category with this name already exists.' };
    }
    state.extraCategories.push({ id: state.nextIds.category++, name, parent });
    save();
    return { success: true };
}

export function adminDeleteCategory(categoryId) {
    if (!requireStaff()) return { error: 'Permission denied' };
    const id = Number(categoryId);
    const category = state.extraCategories.find(c => c.id === id);
    if (!category) return { error: 'Only categories created in this demo can be deleted.' };
    if (childrenOf(id).length) return { error: 'Delete its subcategories first.' };
    state.extraCategories = state.extraCategories.filter(c => c.id !== id);
    save();
    return { success: true };
}
