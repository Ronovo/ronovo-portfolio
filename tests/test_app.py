import jwt
import pytest

from conftest import PASSWORD, QUESTION, SSO_KEY, csrf, log_in, portfolio, register

TRACKER = "http://localhost:4123"


def test_api_site_shape(client):
    site = client.get("/api/site").get_json()
    assert {"name", "tagline", "intro", "nav", "account", "categories", "tags", "projects"} <= site.keys()
    assert site["account"] is None
    assert [c["name"] for c in site["categories"]][0] == "General"
    for project in site["projects"]:
        assert project["category"] in [c["name"] for c in site["categories"]]
        for link in project["links"]:
            assert link["href"].startswith(("/", "http://localhost:"))


def test_api_site_names_the_logged_in_account(client, username):
    register(client, username)
    assert client.get("/api/site").get_json()["account"] == username


@pytest.mark.parametrize("path", ["/", "/projects", "/about", "/no-such-page"])
def test_react_pages(client, path):
    response = client.get(path)
    assert response.status_code == (404 if path == "/no-such-page" else 200)
    assert b'<div id="root">' in response.data


def test_project_page(client):
    assert client.get("/projects/casino/").status_code == 200
    assert client.get("/projects/casino").status_code == 308
    assert client.get("/projects/not-a-project/").status_code == 404


@pytest.mark.parametrize("path", ["/projects/casino/../../app.py", "/projects/casino/..%2f..%2fapp.py",
                                  "/projects/casino/%2e%2e/%2e%2e/app.py"])
def test_project_page_stays_in_its_folder(client, path):
    assert client.get(path).status_code == 404


@pytest.mark.parametrize("slug", ["leagues-task-plugin", "ronovos-sync-tool"])
def test_run_plugin_links_the_tracker(client, slug):
    assert f'href="{TRACKER}/"'.encode() in client.get(f"/projects/{slug}/run").data


@pytest.mark.parametrize("slug, run_both, other", [
    ("leagues-task-plugin", "runWithSyncTool", "https://github.com/Ronovo/Ronovos-Sync-Tool"),
    ("ronovos-sync-tool", "runWithLeagues", "https://github.com/Ronovo/Leagues-Task-Plugin"),
])
def test_run_plugin_offers_both_run_commands(client, slug, run_both, other):
    page = client.get(f"/projects/{slug}/run").data.decode()
    assert "gradlew.bat run</code>" in page
    assert f"gradlew.bat {run_both}</code>" in page
    assert f'href="{other}"' in page


def test_sync_tool_has_a_project_page(client):
    assert client.get("/projects/ronovos-sync-tool/").status_code == 200


def test_security_headers(client):
    headers = client.get("/").headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"


def test_post_without_csrf_token_is_refused(client, username):
    response = client.post("/account/login", data={"username": username, "password": PASSWORD})
    assert response.status_code == 400


def test_register_and_log_in(client, username):
    assert register(client, username).headers["Location"] == "/"
    client.post("/account/logout", data={"csrf_token": csrf(client)})
    assert client.get("/account").status_code == 302
    assert log_in(client, username).headers["Location"] == "/account"
    assert client.get("/account").status_code == 200


@pytest.mark.parametrize("name", ["ab", "a" * 21, "bad name"])
def test_register_rejects_bad_usernames(client, name):
    assert b"Usernames are 3-20" in register(client, name).data


def test_usernames_cannot_end_in_a_newline():
    with pytest.raises(portfolio.AccountError):
        portfolio.accounts.register("trailing\n", PASSWORD, QUESTION, "blue")


def test_register_rejects_taken_username_and_mismatched_passwords(client, username):
    register(client, username)
    other = portfolio.app.test_client()
    assert b"That username is taken" in register(other, username.upper()).data
    response = other.post("/account/register", data={
        "csrf_token": csrf(other), "username": username + "x", "password": PASSWORD,
        "confirm_password": PASSWORD + "!", "question": QUESTION, "answer": "blue"})
    assert b"Passwords do not match" in response.data


def test_wrong_passwords_lock_the_login(client, username):
    register(portfolio.app.test_client(), username)
    for _ in range(5):
        assert b"Wrong username or password" in log_in(client, username, "wrong password").data
    assert b"Wrong username or password" not in log_in(client, username).data
    assert client.get("/account").status_code == 302


@pytest.mark.parametrize("target, expected", [
    ("/projects", "/projects"),
    ("//evil.example/", "/account"),
    ("/\\evil.example/", "/account"),
    ("https://evil.example/", "/account"),
    ("/a\nb", "/account"),
    ("", "/account"),
])
def test_login_only_returns_to_this_site(client, username, target, expected):
    register(portfolio.app.test_client(), username)
    assert log_in(client, username, next=target).headers["Location"] == expected


def reset(client, username, answer, password="new password"):
    return client.post("/account/reset", data={
        "csrf_token": csrf(client), "username": username, "answer": answer, "password": password,
        "confirm_password": password})


def test_reset_password_logs_out_other_browsers(client, username):
    register(client, username)
    assert client.get("/account").status_code == 200
    assert b"That answer is wrong" in reset(portfolio.app.test_client(), username, "red").data
    assert reset(portfolio.app.test_client(), username, " BLUE ").headers["Location"] == "/account/login?reset=1"
    assert client.get("/account").status_code == 302
    assert log_in(portfolio.app.test_client(), username, "new password").headers["Location"] == "/account"


def test_wrong_answers_lock_resets(username):
    register(portfolio.app.test_client(), username)
    for _ in range(5):
        assert b"That answer is wrong" in reset(portfolio.app.test_client(), username, "red").data
    assert b"Too many wrong answers" in reset(portfolio.app.test_client(), username, "blue").data


def test_reset_shows_a_question_for_unknown_usernames(client):
    response = client.post("/account/reset", data={"csrf_token": csrf(client), "username": "nobody-here"})
    assert response.status_code == 200
    assert b'name="answer"' in response.data


def authorize(client, app_id="osrs-tracker", callback=f"{TRACKER}/sso/callback"):
    return client.get("/sso/authorize", query_string={"app": app_id, "return": callback, "state": "s1"})


@pytest.mark.parametrize("app_id, callback", [
    ("not-an-app", f"{TRACKER}/sso/callback"),
    ("osrs-tracker", "http://localhost:8004/sso/callback"),
    ("osrs-tracker", "http://evil.example:4123/sso/callback"),
    ("osrs-tracker", f"{TRACKER}/elsewhere"),
])
def test_authorize_refuses_other_return_urls(client, app_id, callback):
    assert authorize(client, app_id, callback).status_code == 400


def test_authorize_sends_logged_out_browsers_to_log_in(client):
    response = authorize(client)
    assert response.status_code == 302
    assert response.headers["Location"].startswith("/account/login?next=")


def test_authorize_posts_a_token_to_the_app(client, username):
    register(client, username)
    response = authorize(client)
    assert response.headers["Cache-Control"] == "no-store"
    page = response.get_data(as_text=True)
    assert f'action="{TRACKER}/sso/callback"' in page
    assert 'name="state" value="s1"' in page
    token = page.split('name="token" value="', 1)[1].split('"', 1)[0]
    claims = jwt.decode(token, SSO_KEY.public_key(), algorithms=["RS256"], audience="osrs-tracker",
                        issuer="portfolio")
    assert claims["name"] == username


@pytest.mark.parametrize("origin", [None, "http://evil.example:4123", "http://localhost:9999"])
def test_sso_me_refuses_other_origins(client, origin):
    headers = {"Origin": origin} if origin else {}
    assert client.get("/sso/me", headers=headers).status_code == 403


def test_sso_me_names_the_account_for_an_app(client, username):
    register(client, username)
    response = client.get("/sso/me", headers={"Origin": TRACKER})
    assert response.get_json() == {"username": username}
    assert response.headers["Access-Control-Allow-Origin"] == TRACKER
    assert response.headers["Access-Control-Allow-Credentials"] == "true"
