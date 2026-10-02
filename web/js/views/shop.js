// shop.js
// Ports of home.html, category.html, product_view.html (+ product_view.js),
// search.html and wishlist.html.

import * as backend from '../backend.js';
import { html, raw, money, capfirst, formatDetailValue, url } from '../html.js';

function productUrl(product) {
    return url.product(product.category, product.id);
}

// HOME
export function home() {
    const { discounted, topSells, lastUnits } = backend.homeData();

    // lazy: only "Top Sales" is visible when the page opens
    const tile = (product, lazy) => html`
        <div class="col">
            <a href="${productUrl(product)}" class="product-link">
                <img src="${backend.getImage(product)}" class="d-block img-fluid" alt="${product.title}" style="max-height: 200px;" ${lazy ? raw('loading="lazy"') : ''}>
                <p class="title-offert">${product.title}</p>
                <p class="price-text">${money(product.price)} $</p>
            </a>
        </div>`;

    const content = html`
        <!-- TOP SALES -->
        <h1 class="home-title">TOP SALES</h1>
        <div class="container text-center">
            <div class="row align-items-start">
                ${topSells.length ? topSells.map(p => tile(p, false)) : html`<p>No top-selling products available.</p>`}
            </div>
        </div>

        <!-- OFFERTS -->
        <h1 class="home-title">OFFERTS</h1>
        <div id="carouselExampleAutoplaying" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
                ${discounted.map((product, i) => html`
                <div class="carousel-item ${i === 0 ? 'active' : ''}">
                    <div class="container">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <a href="${productUrl(product)}" class="product-link">
                                    <img src="${backend.getImage(product)}" class="d-block img-fluid" alt="${product.title}" style="max-height: 200px;" ${i > 0 ? raw('loading="lazy"') : ''}>
                                </a>
                            </div>
                            <div class="col-md-6">
                                <div class="text-container">
                                    <p class="title-offert">${product.title}</p>
                                    <p class="discount-offert">${product.discount}% OFF!</p>
                                    <p class="price-text-carrusel">${money(backend.discountedPrice(product))} $</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`)}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleAutoplaying" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </div>

        <!-- LAST UNITS -->
        <h1 class="home-title">LAST UNITS</h1>
        <div class="container text-center">
            <div class="row align-items-start">
                ${lastUnits.length ? lastUnits.map(p => tile(p, true)) : html`<p>No last unit products available.</p>`}
            </div>
        </div>`;

    return {
        content,
        mount() {
            const carousel = document.getElementById('carouselExampleAutoplaying');
            if (carousel && discounted.length) bootstrap.Carousel.getOrCreateInstance(carousel);
        },
    };
}

// CATEGORIES
export function category(ctx) {
    const [categoryName] = ctx.params;
    const products = backend.categoryProducts(categoryName);
    if (!products) {
        return { content: notFound(`Category "${categoryName}" does not exist.`) };
    }

    // category_products is grouped by product model in the original view
    const groups = new Map();
    products.forEach(p => {
        if (!groups.has(p.type)) groups.set(p.type, []);
        groups.get(p.type).push(p);
    });

    return {
        content: html`
            <div class="container">
                <h2 class="category_title">Products in ${categoryName}</h2>
                ${groups.size ? '' : html`<p class="empty-category">There are no products in this category yet.</p>`}
                ${[...groups.values()].map(group => html`
                    <div class="row">
                        ${group.map(product => html`
                            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                <div class="card">
                                    <a href="${productUrl(product)}">
                                        <img src="${backend.getImage(product)}" alt="${product.name}" class="card-img-top" loading="lazy">
                                    </a>
                                    <div class="card-body">
                                        <h5 class="card-title">${product.name}</h5>
                                        <div class="price-container">
                                            ${backend.hasDiscount(product)
                                                ? html`<span class="discount-text">${product.discount}% OFF</span>
                                                       <span class="card-text price-text">$${money(backend.discountedPrice(product))}</span>`
                                                : html`<span class="card-text price-text">$${product.price}</span>`}
                                        </div>
                                    </div>
                                </div>
                            </div>`)}
                    </div>`)}
            </div>`,
    };
}

function notFound(error) {
    return html`
        <div class="container text-center" style="margin-top: 50px;">
            <h1>Oops! Something went wrong.</h1><br><br>
            <p style="margin: 20px auto;">${error}</p><br><br>
            <a href="${url.home()}" class="btn btn-outline-secondary btn-sm return-home">Return Home</a>
        </div>`;
}

// PRODUCT VIEW
export function productView(ctx) {
    const [categoryName, productId] = ctx.params;
    const product = backend.getProduct(categoryName, productId);
    if (!product) {
        return { content: notFound(`No product found for category: ${categoryName}`) };
    }

    const user = backend.currentUser();
    const images = backend.getImages(product);
    const maxUnits = backend.maxUnits(product);
    const soldOut = maxUnits < 1;
    const inWishlist = backend.isInWishlist(product);

    const content = html`
        <div class="container mt-4 mb-4">
            <div class="row">
                <div class="col-md-6">
                    <img src="${images[0] || ''}" alt="${product.name}" class="img-fluid main-image">
                    <div class="more-images mt-3">
                        <div class="product-view-carousel-container">
                            <button class="product-view-carousel-button product-view-prev-button" aria-label="Previous images">&lt;</button>
                            <div class="product-view-carousel">
                                <div class="product-view-thumbnail-container">
                                    ${images.map(src => html`<img src="${src}" alt="Extra image for ${product.name}" class="product-view-thumbnail" loading="lazy">`)}
                                </div>
                            </div>
                            <button class="product-view-carousel-button product-view-next-button" aria-label="Next images">&gt;</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div><h1>${product.name}</h1></div><br>
                    ${product.discounted_units == 0
                        ? html`
                            <div><h5>Stock: ${product.stock_quantity}</h5></div><br>
                            <div><h4>Price: ${product.price}$</h4></div><br>`
                        : html`
                            <div><h5>Discount stock: ${product.discounted_units}</h5></div><br>
                            <div><h5>Discount: <span class="discount-text">${product.discount}% OFF!!</span></h5></div><br>
                            <div><h5>Old price: <span class="old-price">${product.price}$</span></h5></div><br>
                            <div><h4>Price: ${money(backend.discountedPrice(product))}$</h4></div><br>`}
                    <div>
                        <label for="quantity">Quantity:</label>
                        <input type="number" id="quantity" name="quantity" value="1" min="1" max="${maxUnits}" ${soldOut ? 'disabled' : ''}>
                        ${user ? html`
                        <button id="wishlist-button" class="wishlist-button ${inWishlist ? 'in-wishlist' : ''}">
                            Wishlist
                        </button>` : ''}
                        <button id="add-to-cart-button" class="btn btn-outline-secondary mt-3 btn-sm" ${soldOut ? 'disabled' : ''}>
                            ${soldOut ? 'Out of stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <div class="product-details">
                        <h3>Product Details</h3>
                        <div class="details-container">
                            <div class="row">
                                ${product.details.map(([field, value]) => html`
                                <div class="col-md-2 detail-item field-column">
                                    <p><strong>${capfirst(field)}</strong></p>
                                </div>
                                <div class="col-md-10 detail-item value-column">
                                    <p>${formatDetailValue(value)}</p>
                                </div>`)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    function mount() {
        // thumbnails carousel (product_view.js)
        const thumbnails = document.querySelectorAll('.product-view-thumbnail');
        const mainImage = document.querySelector('.main-image');
        const thumbnailContainer = document.querySelector('.product-view-thumbnail-container');
        let currentIndex = 0;

        const updateCarousel = () => {
            thumbnailContainer.style.transform = `translateX(${-currentIndex * 110}px)`;
        };

        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => { mainImage.src = thumbnail.src; });
        });
        document.querySelector('.product-view-prev-button').addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
        document.querySelector('.product-view-next-button').addEventListener('click', () => {
            if (currentIndex < thumbnails.length - 3) {
                currentIndex++;
                updateCarousel();
            }
        });

        const wishlistButton = document.getElementById('wishlist-button');
        if (wishlistButton) {
            wishlistButton.addEventListener('click', () => {
                const isIn = wishlistButton.classList.contains('in-wishlist');
                const result = isIn ? backend.removeFromWishlist(product) : backend.addToWishlist(product);
                if (result.success) {
                    wishlistButton.classList.toggle('in-wishlist');
                } else {
                    console.error('Error:', result.error);
                }
            });
        }

        document.getElementById('add-to-cart-button').addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('quantity').value, 10);
            const inCart = backend.getCartQuantity(product);

            if (!(quantity >= 1)) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a valid quantity.' });
                return;
            }
            if (inCart + quantity > maxUnits) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Only can add ${maxUnits - inCart} units. The total quantity in the cart and the quantity you want to add cannot exceed the stock.`,
                });
                return;
            }

            const result = backend.addToCart(product, quantity);
            if (result.success) {
                ctx.rerender();
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Added to cart',
                    showConfirmButton: false,
                    timer: 1500,
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            }
        });
    }

    return { content, mount };
}

// SEARCH
export function search(ctx) {
    const query = ctx.query.get('query') || '';
    const results = backend.search(query);

    return {
        content: html`
            <div class="container">
                <h2 class="search_title">Search Results for "${query}"</h2>
                <div class="row">
                    ${results.length ? '' : html`<p class="empty-category">No products match your search.</p>`}
                    ${results.map(product => html`
                        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                            <div class="card">
                                <a href="${productUrl(product)}">
                                    <img src="${backend.getImage(product)}" alt="${product.title}" class="card-img-top" loading="lazy">
                                </a>
                                <div class="card-body">
                                    <h5 class="card-title">${product.title}</h5>
                                    ${backend.hasDiscount(product)
                                        ? html`
                                            <div class="price-container">
                                                <p class="card-text discount-text">${product.discount}% OFF</p>
                                                <p class="card-text price-text">${money(backend.discountedPrice(product))} $</p>
                                            </div>`
                                        : html`<p class="card-text price-text">${product.price} $</p>`}
                                </div>
                            </div>
                        </div>`)}
                </div>
            </div>`,
        mount() {
            const input = document.querySelector('#searchForm input[name="query"]');
            if (input) input.value = query;
        },
    };
}

// WISHLIST
export function wishlist(ctx) {
    const redirect = ctx.loginRequired();
    if (redirect) return redirect;

    const products = backend.wishlistProducts();
    return {
        content: html`
            <div class="container">
                <h2 class="category_title">Wishlist</h2>
                <div class="row">
                    ${products.length ? products.map(product => html`
                        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                            <div class="card">
                                <a href="${productUrl(product)}">
                                    <img src="${backend.getImage(product)}" alt="${product.name}" class="card-img-top" loading="lazy">
                                </a>
                                <div class="card-body">
                                    <h5 class="card-title">${product.name}</h5>
                                    ${backend.hasDiscount(product)
                                        ? html`
                                            <div class="price-container">
                                                <p class="card-text discount-text">${product.discount}% OFF</p>
                                                <p class="card-text price-text">${money(backend.discountedPrice(product))} $</p>
                                            </div>`
                                        : html`<p class="card-text price-text">${product.price} $</p>`}
                                </div>
                            </div>
                        </div>`) : html`<p>No products in wishlist.</p>`}
                </div>
            </div>`,
    };
}
