// html.js
// Tiny replacement for the Django template engine: interpolated values are
// escaped by default (like {{ value }}), raw() marks trusted markup.

class SafeHtml {
    constructor(value) {
        this.value = value;
    }

    toString() {
        return this.value;
    }
}

export function raw(value) {
    return new SafeHtml(String(value));
}

export function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function render(value) {
    if (value === null || value === undefined || value === false) return '';
    if (value instanceof SafeHtml) return value.value;
    if (Array.isArray(value)) return value.map(render).join('');
    return escape(value);
}

export function html(strings, ...values) {
    let out = strings[0];
    values.forEach((value, i) => {
        out += render(value) + strings[i + 1];
    });
    return new SafeHtml(out);
}

// {{ value|floatformat:2 }}
export function money(value) {
    return Number(value).toFixed(2);
}

// {{ field|capfirst }}
export function capfirst(value) {
    const text = String(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// {{ order.created_at|date:"Y-m-d H:i" }}
export function formatDateTime(iso) {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// {{ date }} with Django's default DATE_FORMAT ("N j, Y")
const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

export function formatDetailValue(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

// {% url 'store:...' %} equivalents for the hash router
export const url = {
    home: () => '#/',
    login: () => '#/login/',
    register: () => '#/register/',
    logout: () => '#/logout',
    profile: () => '#/profile/',
    orders: () => '#/orders/',
    orderDetail: id => `#/orders/${id}/`,
    wishlist: () => '#/wishlist/',
    cart: () => '#/cart/',
    checkout: () => '#/checkout/',
    search: query => `#/search/?query=${encodeURIComponent(query)}`,
    category: name => `#/category/${encodeURIComponent(name)}/`,
    product: (categoryName, id) => `#/category/${encodeURIComponent(categoryName)}/product/${id}/`,
    admin: () => '#/admin/',
};
