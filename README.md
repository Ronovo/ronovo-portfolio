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
  only ever sent to `/sso/callback` on that app's address: `https://<subdomain>.<PORTFOLIO_APP_DOMAIN>/` from its
  link in `data.py`, or that link's port on the host serving this site when `PORTFOLIO_APP_DOMAIN` is unset.
  The token carries `iss` (`portfolio`), `aud` (the app's id), `sub` (the account id), `name` (the username) and a
  5-minute `exp`.
- `/sso/me` tells an app's page which portfolio account the browser is logged in to (`{"username": ...}`, or
  `null`). Only pages served from an app's address may read it, with the browser's login cookie.
- Tokens are signed with `PORTFOLIO_SSO_PRIVATE_KEY`, which only the portfolio has. Apps check them with
  `PORTFOLIO_SSO_PUBLIC_KEY`, so an app can check a token but never make one.
- Each app keeps its own data, tied to the portfolio account. The first portfolio login in an app asks whether to
  link an account the player already has there, by logging in to it once, or to make a new one.
- The Python apps get portfolio login, security questions and the login lock from the shared
  [ronovo-portfolio-auth](https://github.com/Ronovo/ronovo-portfolio-auth) package, pinned in each `requirements.txt`.
  The portfolio issues its tokens with the same package, so both sides of the token are written in one place.
- With `PORTFOLIO_APP_DOMAIN` set, each app has its own host name, so only the portfolio receives its login cookie.
  Without it, browsers don't separate cookies by port, so every app on the host receives it.

## Settings

| Setting | Used by | What it is |
| --- | --- | --- |
| `PORTFOLIO_SECRET_KEY` | portfolio | Session signing key. Required by the compose stack; a bare `python app.py` generates one into `data/` if unset. |
| `DATA_DIR` | portfolio | Where `accounts.db` and the generated key live. Defaults to `data/` next to `app.py`. |
| `PORTFOLIO_SSO_PRIVATE_KEY` | portfolio | Signs login tokens. |
| `PORTFOLIO_SSO_PUBLIC_KEY` | every app | Checks login tokens. |
| `PORTFOLIO_SSO_URL` | every app | Where apps send players to log in: the portfolio's address. |
| `PORTFOLIO_APP_DOMAIN` | portfolio | `ronovo.io` on the server: each app's link is `https://<subdomain>.ronovo.io/`. Unset, the links use the apps' ports on this host. |
| `SECURE_COOKIES` | portfolio | `1` marks the login cookie Secure, for a site served over HTTPS. |
| `RONOVO_TUNNEL_TOKEN` | compose stack | The Cloudflare tunnel's token. |
| `FLASK_DEBUG` | portfolio | `1` turns on Flask's debugger for a bare `python app.py`. Never set it on the server. |

`python sso.py` prints a new key pair as `.env` lines. `.env.example` lists every key the stack needs.

## Running

`docker-compose.yml` runs the portfolio and every app, each built from its GitHub `main` branch, behind a Cloudflare
tunnel. No service publishes a port: the `cloudflared` service is the only way in, and Cloudflare routes `ronovo.io`
and each app's subdomain through it. The apps run the code built into their images, so updating means rebuilding.
Copy `.env.example` to `.env`, fill it in, and run:

```
docker compose build --pull
docker compose up -d
```

To test local copies instead, add a `docker-compose.local.yml` (it is git-ignored) that points each `build:` at a
folder, publishes each app's port on `127.0.0.1`, turns `SECURE_COOKIES` off for plain HTTP, and leaves the tunnel
off by giving it a profile:

```yaml
services:
  cloudflared:
    profiles: ["tunnel"]
  portfolio:
    build: .
    ports: ["127.0.0.1:4482:8000"]
    environment:
      SECURE_COOKIES: "0"
  gm-toolbox:
    build: ../Gamemaster-Toolbox
    ports: ["127.0.0.1:9000:8080"]
```

Then run it with `PORTFOLIO_SSO_URL=http://localhost:4482`, `PORTFOLIO_APP_DOMAIN` empty and any value for
`RONOVO_TUNNEL_TOKEN` in `.env`:

```
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

To run the portfolio on its own without Docker:

```
pip install -r requirements.txt
python app.py
```

It serves on port 5000. Build the front end first (below): the app won't start without `frontend/dist`.

## Construction Mode

While a file named `construction` is in the data folder, every page on the site answers with an "Under
Construction" page that points visitors at [ronovo.github.io](https://ronovo.github.io/). It answers with a 503 and
`Retry-After`, so search engines treat it as temporary. Only the static files that page uses are still served, so the
API, accounts and portfolio login are off too. It takes effect on the next request, with no restart:

```
docker compose exec portfolio touch /app/data/construction
docker compose exec portfolio rm /app/data/construction
```

The file lives in the `portfolio-data` volume, so it stays on through a rebuild of the portfolio. For a bare
`python app.py` it is `data/construction`. The page uses the saved theme's tokens from `static/brand.css`, without
the React pages' theme components.

It only covers this site. The apps' subdomains go straight to their own containers, and visitors still see
Cloudflare's error page when the server, the portfolio container or the tunnel is down.

## Front end

Home, Projects, About and the 404 page are a React and TypeScript app in `frontend/`, built with Vite. Flask serves
the built `frontend/dist`, and the app reads everything it shows from `/api/site`, which comes from `data.py`. The
account and Run-it pages are Flask templates. Both share `static/style.css`.

Each project's About page is a standalone page in `pages/<slug>/`, served at `/projects/<slug>/`. Their shared
layout is in `static/project-page.css`, and each page keeps its own colors inline. Which projects
show, and how, is set in `data.py`; the comment at its top lists every field.

### Themes

The theme picker lists `themes` in `data.py`. Every page loads `static/theme.js`, which saves the choice and sets
`data-theme` on `<html>` before the page paints. Each theme but Cyberpunk, the default, is a block of tokens in
`static/brand.css`, and those tokens style every page. The React pages also swap in each theme's components (its
kit, in `frontend/src/theme/kits.tsx`); a theme without a kit uses Cyberpunk's. The account, Run-it and About pages
and ronovo.github.io get each theme's look but not those components. Themes other than Cyberpunk replace the About
pages' own colors.

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
the home page, a Run-it link points at the repo README's Installing section, and the theme picker is added to the
end of the header nav. The script replaces `projects/`
each time, so pages removed here are removed there too.

## Tests

```
pip install -r requirements-dev.txt
pytest
```

The tests cover the site API, project pages, accounts, CSRF, login redirects, portfolio login and the
ronovo.github.io export. They serve the React pages from `frontend/dist`, so build the front end first.

The front end's tests run with Vitest, from `frontend/`:

```
npm test
npm run coverage
```

### Coverage

```
python -m coverage run -m pytest
python -m coverage report
python -m coverage html
```

Both suites cover every line and branch, and the coverage commands fail if that drops below 100%. The HTML
reports go to `coverage/python` and `coverage/js`. The Docker image builds both and serves them at `/coverage/`,
under the landing page in `coverage-index/`, the `ronovos-coverage-index` submodule, with this repo's
`coverage-reports.json`. Failing tests or low coverage don't stop the image build; the reports show what is missing.

## License

BSD 2-Clause. See [LICENSE](LICENSE).
