import itertools
import os
import tempfile

import pytest

from ronovo_portfolio_auth import portfolio_sso

SSO_KEY, SSO_PUBLIC_KEY = portfolio_sso.new_key_pair()
_data_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
os.environ["DATA_DIR"] = _data_dir.name
os.environ["PORTFOLIO_SECRET_KEY"] = "test"
os.environ["PORTFOLIO_SSO_PRIVATE_KEY"] = portfolio_sso.private_key_text(SSO_KEY)

import app as portfolio  # noqa: E402

portfolio.accounts.max_registrations = 10_000

QUESTION = portfolio.QUESTIONS[0]
PASSWORD = "correct horse"
_names = itertools.count()


@pytest.fixture
def client():
    return portfolio.app.test_client()


@pytest.fixture
def username():
    return f"user{next(_names)}"


def csrf(client):
    client.get("/account/login")
    with client.session_transaction() as session:
        return session["csrf_token"]


def register(client, username, password=PASSWORD, answer="blue", **extra):
    return client.post("/account/register", data={
        "csrf_token": csrf(client), "username": username, "password": password, "confirm_password": password,
        "question": QUESTION, "answer": answer, **extra})


def log_in(client, username, password=PASSWORD, **extra):
    return client.post("/account/login", data={
        "csrf_token": csrf(client), "username": username, "password": password, **extra})
