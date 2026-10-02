"""Assemble the static GitHub Pages site in dist/.

Only uses the Python standard library, so it runs in GitHub Actions without
installing Django. It copies:
  - web/                         -> dist/            (demo app)
  - store/static/store/css, images -> dist/static/store/  (original styles and icons)
  - the product images referenced by web/data/store.json -> dist/media/

Usage (from the repository root):
    python3 tools/build_site.py           # build dist/
    python3 tools/build_site.py --serve   # build and serve on http://localhost:8000
"""

import argparse
import functools
import http.server
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
DIST = ROOT / "dist"
STATIC = ROOT / "store" / "static" / "store"
MEDIA = ROOT / "media"


def build():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(WEB, DIST)

    for folder in ("css", "images"):
        shutil.copytree(STATIC / folder, DIST / "static" / "store" / folder)

    data = json.loads((WEB / "data" / "store.json").read_text(encoding="utf-8"))
    images = sorted({image for product in data["products"] for image in product["images"]})
    missing = [image for image in images if not (MEDIA / image).is_file()]
    if missing:
        raise SystemExit(f"Missing product images in media/: {', '.join(missing)}")
    for image in images:
        target = DIST / "media" / image
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(MEDIA / image, target)

    print(f"Built {DIST.relative_to(ROOT)}/ with {len(data['products'])} products and {len(images)} images")


def serve(port):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Serving dist/ on http://localhost:{port} (Ctrl+C to stop)")
        server.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--serve", action="store_true", help="serve dist/ after building")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    build()
    if args.serve:
        serve(args.port)
