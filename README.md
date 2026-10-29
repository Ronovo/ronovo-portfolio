# Ronovo Portfolio

The portfolio site, and the portfolio account every app logs in with.

## Portfolio accounts

- Register with a username, a password and a security question. **Forgot password?** resets the password with
  the answer; five wrong answers lock resets for 15 minutes. A question can't be changed once it is set.
- Five wrong passwords in a row lock a username's logins for a minute. The count is kept in memory, which is why
  the image runs one gunicorn worker: each extra worker would count on its own. A password reset logs the account
  out of every other browser. A login lasts 7 days.
- Usernames are public: register says when one is taken, and **Forgot password?** says when there is no such
  account. At most 20 accounts can be made in any 10 minutes.
- An app's portfolio login sends the browser to `/sso/authorize`. The portfolio has you log in if needed,
  then posts a login token, valid for 5 minutes and only for that app, back to the app's `/sso/callback`. It is
  only ever sent to `/sso/callback` on the port of that app's link in `data.py`, on the host serving this site.
  The token carries `iss` (`portfolio`), `aud` (the app's id), `sub` (the account id), `name` (the username) and a
  5-minute `exp`.
- `/sso/me` tells an app's page which portfolio account the browser is logged in to (`{"username": ...}`, or
  `null`). Only pages served from an app's port on this host may read it, with the browser's login cookie.
- Tokens are signed with `PORTFOLIO_SSO_PRIVATE_KEY`, which only the portfolio has. Apps check them with
  `PORTFOLIO_SSO_PUBLIC_KEY`, so an app can check a token but never make one.
- Each app keeps its own data, tied to the portfolio account. The first portfolio login in an app asks whether to
  link an account the player already has there, by logging in to it once, or to make a new one.
- The Python apps get portfolio login, security questions and the login lock from the shared
  [ronovo-portfolio-auth](https://github.com/Ronovo/ronovo-portfolio-auth) package, pinned in each `requirements.txt`.
  The portfolio issues its tokens with the same package, so both sides of the token are written in one place.
- Browsers don't separate cookies by port, so every app on this host receives the portfolio's login cookie. Giving
  each app its own host name fixes that, and is planned for when the site opens to the web.

## Settings

| Setting | Used by | What it is |
| --- | --- | --- |
| `PORTFOLIO_SECRET_KEY` | portfolio | Session signing key. Required by the compose stack; a bare `python app.py` generates one into `data/` if unset. |
| `DATA_DIR` | portfolio | Where `accounts.db` and the generated key live. Defaults to `data/` next to `app.py`. |
| `PORTFOLIO_SSO_PRIVATE_KEY` | portfolio | Signs login tokens. |
| `PORTFOLIO_SSO_PUBLIC_KEY` | every app | Checks login tokens. |
| `PORTFOLIO_SSO_URL` | every app | Where apps send players to log in: the portfolio's address. |
| `APP_BIND_IP` | compose stack | The address the apps' ports listen on, such as `127.0.0.1` for local testing. |
| `FLASK_DEBUG` | portfolio | `1` turns on Flask's debugger for a bare `python app.py`. Never set it on the server. |

`python sso.py` prints a new key pair as `.env` lines. `.env.example` lists every key the stack needs.

## Running

`docker-compose.yml` runs the portfolio and every app, each built from its GitHub `main` branch. Copy `.env.example`
to `.env`, fill it in, and run:

```
docker compose up -d --build
```

To test local copies instead, add a `docker-compose.local.yml` (it is git-ignored) that points each `build:` at a
folder and blanks `REPO_URL`, so the apps don't pull GitHub's code over it when they start:

```yaml
x-local-env: &local-env
  REPO_URL: ""

services:
  portfolio:
    build: .
  gm-toolbox:
    build: ../Gamemaster-Toolbox
    environment: *local-env
```

Then run it with `PORTFOLIO_SSO_URL=http://localhost:4482` and `APP_BIND_IP=127.0.0.1` in `.env`:

```
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

To run the portfolio on its own without Docker:

```
pip install -r requirements.txt
python app.py
```

It serves on port 5000. Build the front end first (below): the app won't start without `frontend/dist`.

## Front end

Home, Projects, About and the 404 page are a React and TypeScript app in `frontend/`, built with Vite. Flask serves
the built `frontend/dist`, and the app reads everything it shows from `/api/site`, which comes from `data.py`. The
account and Run-it pages are Flask templates. Both share `static/style.css`.

Each project's About page is a standalone page in `pages/<slug>/`, served at `/projects/<slug>/`. Their shared
layout is in `static/project-page.css`, and each page keeps its own colors inline. Which projects
show, and how, is set in `data.py`; the comment at its top lists every field.

The Docker image builds the front end itself. To work on it, run Flask on port 5000, then:

```
cd frontend
npm install
npm run dev
```

`npm run dev` serves the React pages with live reload and passes `/api`, `/static`, `/account`, `/sso` and the
project pages through to Flask. To try the built app on Flask alone, run `npm run build` first.

## Publishing to ronovo.github.io

`export_github_io.py` writes a basic copy of the Projects page to a checkout of
[ronovo.github.io](https://github.com/Ronovo/ronovo.github.io), along with every About page and
`static/project-page.css`:

```
python export_github_io.py ../ronovo.github.io
```

The cards come from `data.py` and `templates/github-io.html`. They show Source, About and `url` links only, since
port and Run-it links don't work off this host. The About pages go to `projects/<slug>/`; their back link points at
the home page, and a Run-it link points at the repo README's Installing section. The script replaces `projects/`
each time, so pages removed here are removed there too.

## Tests

```
pip install -r requirements-dev.txt
pytest
```

The tests cover the site API, project pages, accounts, CSRF, login redirects and portfolio login.
They serve the React pages from `frontend/dist`, so build the front end first.

## License

BSD 2-Clause. See [LICENSE](LICENSE).
