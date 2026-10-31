import re
import runpy
import sys
from pathlib import Path
from urllib.parse import urljoin

import pytest
from markupsafe import escape

import export_github_io
from data import SITE

PAGES = {p["page"]: p for p in SITE["projects"] if "page" in p}
PLUGINS = ["leagues-task-plugin", "ronovos-sync-tool"]


@pytest.fixture(scope="module")
def site(tmp_path_factory):
    target = tmp_path_factory.mktemp("github-io")
    (target / "static").mkdir()
    (target / "static" / "stale.css").write_text("left over from an older export", encoding="utf-8")
    export_github_io.export(target)
    return target


def page(site, *parts):
    return site.joinpath(*parts, "index.html").read_text(encoding="utf-8")


def test_the_home_page_lists_every_project_and_url_link(site):
    home = page(site)
    for project in SITE["projects"]:
        assert str(escape(project["title"])) in home
        for link in project.get("links", []):
            if "url" in link:
                assert f'href="{link["url"]}"' in home


def test_the_static_folder_is_replaced(site):
    assert not (site / "static" / "stale.css").exists()
    for name in export_github_io.STATIC:
        assert (site / "static" / name).exists(), name


@pytest.mark.parametrize("slug", sorted(PAGES))
def test_about_pages_link_home_and_get_the_theme_picker(site, slug):
    about = page(site, "projects", slug)
    assert 'href="/projects"' not in about
    assert about.count("data-theme-picker") == 1


@pytest.mark.parametrize("slug", PLUGINS)
def test_run_links_go_to_the_install_notes(site, slug):
    about = page(site, "projects", slug)
    assert 'href="run"' not in about
    assert f'href="{PAGES[slug]["source"]}#installing"' in about


def test_every_local_link_on_the_exported_site_resolves(site):
    broken = []
    for html in sorted(site.rglob("*.html")):
        here = "/" + html.relative_to(site).parent.as_posix().strip(".") + "/"
        for link in set(re.findall(r'(?:href|src)="([^"#?]*)', html.read_text(encoding="utf-8"))):
            if not link or link.startswith(("http:", "https:", "mailto:", "//")):
                continue
            target = site / urljoin(here.replace("//", "/"), link).lstrip("/")
            if not (target.is_file() or (target / "index.html").is_file()):
                broken.append(f"{html.relative_to(site).as_posix()}: {link}")
    assert broken == []


def test_the_script_needs_the_target_folder(monkeypatch):
    monkeypatch.setattr(sys, "argv", ["export_github_io.py"])
    with pytest.raises(SystemExit, match="Usage"):
        runpy.run_path(str(Path(export_github_io.__file__)), run_name="__main__")
