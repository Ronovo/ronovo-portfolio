import os
import secrets
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlsplit

from flask import (Flask, abort, g, jsonify, make_response, redirect, render_template, request, send_from_directory,
                   session, url_for)

import sso
from accounts import NO_ACCOUNT, AccountError, Accounts
from ronovo_portfolio_auth import portfolio_sso
from ronovo_portfolio_auth.security_questions import MAX_ANSWER_LENGTH, QUESTIONS
from data import SITE

ROOT = Path(__file__).parent
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data"))
DATA_DIR.mkdir(exist_ok=True)


def load_secret_key() -> str:
    key = os.environ.get("PORTFOLIO_SECRET_KEY")
    if key:
        return key
    path = DATA_DIR / "secret_key"
    if not path.exists():
        # Readable only by the account the app runs as.
        with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as f:
            f.write(secrets.token_hex(32))
    return path.read_text().strip()


app = Flask(__name__)
app.url_map.strict_slashes = False
app.config.update(
    SECRET_KEY=load_secret_key(),
    # Every portfolio app shares one host name and browsers don't separate cookies by port,
    # so this login cookie needs a name of its own.
    SESSION_COOKIE_NAME="portfolio_session",
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),
)
app.jinja_env.globals["MAX_ANSWER_LENGTH"] = MAX_ANSWER_LENGTH
accounts = Accounts(str(DATA_DIR / "accounts.db"))
SSO_KEY = sso.private_key()

DIST = ROOT / "frontend" / "dist"
if not (DIST / "index.html").exists():
    raise RuntimeError("frontend/dist is missing: run npm run build in frontend/ first")
PAGES = [
    ("home", "/", "Home"),
    ("projects", "/projects", "Projects"),
    ("about", "/about", "About"),
]
NAV = [(endpoint, label) for endpoint, _, label in PAGES]


def react_page():
    return send_from_directory(DIST, "index.html")


for endpoint, rule, _ in PAGES:
    app.add_url_rule(rule, endpoint, react_page)


@app.get("/assets/<path:filename>")
def react_assets(filename):
    return send_from_directory(DIST / "assets", filename, max_age=365 * 24 * 60 * 60)


PROJECT_PAGES = {p["page"]: p for p in SITE["projects"] if "page" in p}
TAGS = sorted({tag for p in SITE["projects"] for tag in p.get("tags", [])}, key=str.lower)

# The port each app with portfolio login is served on, which is the only place its login token is sent.
SSO_APPS = {
    item["app"]: link["port"]
    for item in SITE["projects"] if "app" in item
    for link in item["links"] if "port" in link
}


def project_json(item):
    return {
        "title": item["title"],
        "category": item["category"],
        "desc": item["desc"],
        "tags": item.get("tags", []),
        "featured": item.get("featured", False),
        "thumb": url_for("static", filename=item["thumb"]) if "thumb" in item else None,
        "source": item.get("source"),
        "about": url_for("project_page", slug=item["page"]) if "page" in item else None,
        "links": [{"label": link["label"],
                   "href": url_for("run_page", slug=item["page"]) if link.get("run") else app_url(link["port"]),
                   "external": "port" in link}
                  for link in item.get("links", [])],
    }


@app.get("/api/site")
def api_site():
    return jsonify(
        name=SITE["name"],
        tagline=SITE["tagline"],
        intro=SITE["intro"],
        nav=[{"label": label, "href": url_for(endpoint)} for endpoint, label in NAV],
        account=account_name(),
        categories=[{"name": name, "blurb": blurb} for name, blurb in SITE["categories"].items()],
        tags=TAGS,
        projects=[project_json(p) for p in SITE["projects"]],
    )


# The pages link their assets relatively, so the bare slug must redirect to the trailing-slash URL.
@app.route("/projects/<slug>/", defaults={"filename": "index.html"}, strict_slashes=True)
@app.route("/projects/<slug>/<path:filename>")
def project_page(slug, filename):
    if slug not in PROJECT_PAGES:
        abort(404)
    return send_from_directory(ROOT / "pages" / slug, filename)


# Each RuneLite plugin's run page also explains loading the other one with this Gradle task.
RUNELITE_PLUGINS = {
    "leagues-task-plugin": ("ronovos-sync-tool", "runWithSyncTool"),
    "ronovos-sync-tool": ("leagues-task-plugin", "runWithLeagues"),
}


@app.get("/projects/<slug>/run")
def run_page(slug):
    if slug not in RUNELITE_PLUGINS:
        abort(404)
    other, run_both = RUNELITE_PLUGINS[slug]
    return render_template("run-plugin.html", page="projects", plugin=PROJECT_PAGES[slug],
                           other=PROJECT_PAGES[other], run_both=run_both,
                           tracker_url=app_url(SSO_APPS["osrs-tracker"]))


def this_host():
    return urlsplit("//" + request.host).hostname


@app.template_global()
def app_url(port):
    host = this_host()
    return f"http://[{host}]:{port}/" if ":" in host else f"http://{host}:{port}/"


@app.template_global()
def csrf_token():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(16)
    return session["csrf_token"]


def check_csrf():
    expected = session.get("csrf_token")
    if not expected or not secrets.compare_digest(request.form.get("csrf_token", ""), expected):
        abort(400)


def current_user():
    """The logged-in account's id, checked once per request."""
    if "user_id" not in g:
        g.user_id = session.get("user_id")
        if g.user_id is not None:
            key = accounts.session_key(g.user_id)
            if key is None or not secrets.compare_digest(session.get("session_key", ""), key):
                session.clear()
                g.user_id = None
    return g.user_id


def account_name():
    return session.get("username") if current_user() is not None else None


def log_in(user_id, username):
    session.clear()
    session.permanent = True
    session["user_id"] = user_id
    session["username"] = username
    session["session_key"] = accounts.session_key(user_id)
    g.user_id = user_id


def new_password():
    password = request.form.get("password", "")
    if password != request.form.get("confirm_password"):
        raise AccountError("Passwords do not match")
    return password


def next_url(default="account"):
    """Where to go after logging in. Only paths on this site, so a link can't bounce a login elsewhere."""
    target = request.values.get("next", "")
    parts = urlsplit(target)
    on_site = (target.startswith("/") and target.isprintable() and "\\" not in target
               and not parts.scheme and not parts.netloc)
    return target if on_site else url_for(default)


@app.context_processor
def inject_site():
    return {"site": SITE, "nav": NAV, "year": date.today().year, "account": account_name()}


@app.route("/account/login", methods=["GET", "POST"], defaults={"mode": "login"}, endpoint="login")
@app.route("/account/register", methods=["GET", "POST"], defaults={"mode": "register"}, endpoint="register")
def account_form(mode):
    error = None
    username = request.form.get("username", "").strip()
    question = request.form.get("question", "")
    if request.method == "POST":
        check_csrf()
        password = request.form.get("password", "")
        try:
            if mode == "login":
                user_id, username = accounts.check_login(username, password)
            else:
                user_id = accounts.register(username, new_password(), question, request.form.get("answer", ""))
            log_in(user_id, username)
            return redirect(next_url("home" if mode == "register" else "account"))
        except AccountError as e:
            error = str(e)
    return render_template("account/form.html", page="account", mode=mode, error=error, username=username,
                           question=question, questions=QUESTIONS, next=request.values.get("next", ""),
                           was_reset="reset" in request.args)


@app.get("/account")
def account():
    if current_user() is None:
        return redirect(url_for("login"))
    return render_template("account/index.html", page="account")


@app.route("/account/reset", methods=["GET", "POST"])
def reset_password():
    """Step one takes a username and shows its security question. Step two takes the answer and a new password."""
    error = None
    username = request.form.get("username", "").strip()
    if request.method == "POST":
        check_csrf()
        if "answer" in request.form:
            try:
                accounts.reset_password(username, request.form["answer"], new_password())
                return redirect(url_for("login", reset=1))
            except AccountError as e:
                error = str(e)
    question = accounts.security_question(username) if username else None
    if username and question is None:
        error = NO_ACCOUNT
    return render_template("account/reset.html", page="account", error=error, username=username if question else "",
                           question=question)


@app.post("/account/logout")
def logout():
    check_csrf()
    session.clear()
    g.pop("user_id", None)
    return redirect(url_for("home"))


def app_port(url):
    """The port of url when url is an app with portfolio login on this site's host, else None."""
    parts = urlsplit(url)
    try:
        port = parts.port
    except ValueError:
        return None
    on_this_host = parts.scheme == "http" and parts.hostname == this_host()
    return port if on_this_host and port in SSO_APPS.values() else None


def sso_callback_url(app_id):
    """The only address a login token for app_id is ever posted to: /sso/callback on that app's port."""
    port = SSO_APPS.get(app_id)
    return None if port is None else app_url(port) + portfolio_sso.CALLBACK_PATH


@app.get("/sso/authorize")
def sso_authorize():
    if SSO_KEY is None:
        abort(503)
    app_id = request.args.get(portfolio_sso.APP_PARAM, "")
    callback = sso_callback_url(app_id)
    if callback is None or request.args.get(portfolio_sso.RETURN_PARAM, "") != callback:
        abort(400)
    user_id = current_user()
    if user_id is None:
        return redirect(url_for("login", next=request.full_path))
    token = portfolio_sso.issue(SSO_KEY, app_id, user_id, session["username"])
    response = make_response(render_template("account/sso.html", page="account", return_url=callback, token=token,
                                             state=request.args.get(portfolio_sso.STATE_PARAM, "")))
    response.headers["Cache-Control"] = "no-store"
    return response


# Lets an app's page show who is logged in here. Only the apps' own pages may read it, with the login cookie.
@app.get("/sso/me")
def sso_me():
    origin = request.headers.get("Origin", "")
    if app_port(origin) is None:
        abort(403)
    response = jsonify(username=account_name())
    response.headers.update({"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true",
                             "Vary": "Origin"})
    return response


@app.after_request
def security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "same-origin")
    return response


@app.errorhandler(404)
def not_found(_error):
    return react_page(), 404


if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
