// messages.js
// Equivalent of django.contrib.messages: queued until the next page render.

import { html } from './html.js';

let queue = [];

export function flash(level, text) {
    queue.push({ level, text });
}

export function renderMessages() {
    const current = queue;
    queue = [];
    return current.map(m => html`<div class="alert alert-${m.level}">${m.text}</div>`);
}
