import base64
import itertools
import os
import tempfile

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

SSO_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
os.environ["DATA_DIR"] = tempfile.mkdtemp()
os.environ["PORTFOLIO_SECRET_KEY"] = "test"
os.environ["PORTFOLIO_SSO_PRIVATE_KEY"] = base64.b64encode(SSO_KEY.private_bytes(
    serialization.Encoding.DER, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())).decode()

import app as portfolio  # noqa: E402

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
