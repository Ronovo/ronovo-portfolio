import shutil
import sys
import textwrap
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from data import SITE

ROOT = Path(__file__).parent
STATIC = ["brand.css", "project-page.css", "theme.js", "favicon.svg", "fonts"]


def emptied(folder: Path) -> Path:
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir()
    return folder


def export(target: Path):
    groups = [(name, [p for p in SITE["projects"] if p["category"] == name]) for name in SITE["categories"]]
    env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=True, trim_blocks=True, lstrip_blocks=True)
    html = env.get_template("github-io.html").render(site=SITE, groups=[g for g in groups if g[1]])
    (target / "index.html").write_text(html, encoding="utf-8", newline="\n")

    static = emptied(target / "static")
    for name in STATIC:
        source = ROOT / "static" / name
        if source.is_dir():
            shutil.copytree(source, static / name)
        else:
            shutil.copy2(source, static / name)

    picker = textwrap.indent(env.get_template("_theme_picker.html").render(site=SITE), "    ")
    projects = emptied(target / "projects")
    for item in SITE["projects"]:
        if "page" not in item:
            continue
        dest = projects / item["page"]
        shutil.copytree(ROOT / "pages" / item["page"], dest)
        # The list is the home page there, the Run-it page only exists on the portfolio, and the theme picker
        # goes at the end of the header nav.
        page = dest / "index.html"
        page.write_bytes(page.read_bytes()
                         .replace(b'href="/projects"', b'href="/"')
                         .replace(b'href="run"', f'href="{item["source"]}#installing"'.encode())
                         .replace(b"  </nav>", f"{picker}\n  </nav>".encode()))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python export_github_io.py <path to the ronovo.github.io checkout>")
    export(Path(sys.argv[1]))
