"""Export the Django catalogue (db.sqlite3) to the static JSON used by the web demo.

GitHub Pages cannot run Django, so the demo reads the catalogue from
web/data/store.json. This script builds that file with the project's own
models, so the product details keep the same fields and order as the
original product page (model_to_dict with the same excluded fields).

Product images are converted to WebP into web/media/ (the originals in
media/ stay untouched, the Django project still uses them).

Users, passwords, carts and orders are NOT exported: the demo creates its
own sample accounts in each visitor's browser.

Usage (from the repository root, with Django installed):
    python tools/export_data.py
"""

import json
import os
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "web" / "data" / "store.json"
MEDIA = ROOT / "media"
WEB_MEDIA = ROOT / "web" / "media"
WEBP_QUALITY = 82

sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "duckyware.settings")

import django  # noqa: E402

django.setup()

from django.contrib.contenttypes.models import ContentType  # noqa: E402
from django.forms.models import model_to_dict  # noqa: E402
from PIL import Image  # noqa: E402

from store.models import Category, ProductImage  # noqa: E402
from store.product_types import PRODUCT_MODELS  # noqa: E402

# Same list as store.views.product_view
UNWANTED_FIELDS = ["id", "stock_quantity", "units_sold", "category", "price", "discount", "discounted_units"]


def plain(value):
    """Convert model values to what the Django template would print."""
    if value is None:
        return "None"
    if isinstance(value, Decimal):
        return str(value)
    if hasattr(value, "isoformat"):
        # {{ date }} renders as e.g. "Jan. 4, 2022"; keep the ISO date, the JS formats it
        return value.isoformat()
    if hasattr(value, "name"):  # ImageField
        return value.name or ""
    return str(value)


def to_webp(name):
    """Convert media/<name> to web/media/<name>.webp and return the new relative name."""
    source = MEDIA / name
    webp_name = str(Path(name).with_suffix(".webp"))
    target = WEB_MEDIA / webp_name
    if not source.is_file():
        raise SystemExit(f"Missing product image: media/{name}")
    if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as image:
            # keep transparency of the PNG files, drop palettes and CMYK
            mode = "RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB"
            image.convert(mode).save(target, "WEBP", quality=WEBP_QUALITY, method=6)
    return webp_name


def export_categories():
    return [
        {"id": c.id, "name": c.name, "parent": c.parent_id}
        for c in Category.objects.order_by("id")
    ]


def export_products():
    products = []
    for model in PRODUCT_MODELS:
        content_type = ContentType.objects.get_for_model(model)
        for product in model.objects.select_related("category").order_by("id"):
            images = ProductImage.objects.filter(content_type=content_type, object_id=product.id).order_by("id")
            fields = [f.name for f in product._meta.fields if f.name not in UNWANTED_FIELDS]
            details = model_to_dict(product, fields=fields)
            products.append({
                "type": model.__name__,
                "id": product.id,
                "category": product.category.name,
                "category_id": product.category_id,
                "title": product.title,
                "name": product.name,
                "price": str(product.price),
                "discount": str(product.discount),
                "discounted_units": product.discounted_units,
                "stock_quantity": product.stock_quantity,
                "units_sold": product.units_sold,
                "images": [to_webp(img.image.name) for img in images],
                "details": [[field, plain(details[field])] for field in fields],
            })
    return products


def main():
    data = {
        "source": "Exported from db.sqlite3 by tools/export_data.py",
        "categories": export_categories(),
        "products": export_products(),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # remove WebP files of images that are no longer in the database
    used = {WEB_MEDIA / image for product in data["products"] for image in product["images"]}
    for stale in set(WEB_MEDIA.rglob("*.webp")) - used:
        stale.unlink()

    print(f"Wrote {OUTPUT.relative_to(ROOT)}: "
          f"{len(data['categories'])} categories, {len(data['products'])} products, {len(used)} WebP images")


if __name__ == "__main__":
    main()
