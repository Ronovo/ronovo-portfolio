import base64
import os
import time

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

ISSUER = "portfolio"
TOKEN_SECONDS = 300


def private_key():
    """The signing key from PORTFOLIO_SSO_PRIVATE_KEY (base64 DER), or None when portfolio login is off"""
    raw = os.environ.get("PORTFOLIO_SSO_PRIVATE_KEY", "").strip()
    return serialization.load_der_private_key(base64.b64decode(raw), password=None) if raw else None


def issue(key, app_id: str, user_id: int, username: str) -> str:
    now = int(time.time())
    claims = {"iss": ISSUER, "aud": app_id, "sub": str(user_id), "name": username,
              "iat": now, "exp": now + TOKEN_SECONDS}
    return jwt.encode(claims, key, algorithm="RS256")


# python sso.py prints a new key pair as .env lines
if __name__ == "__main__":
    new_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_der = new_key.private_bytes(serialization.Encoding.DER, serialization.PrivateFormat.PKCS8,
                                        serialization.NoEncryption())
    public_der = new_key.public_key().public_bytes(serialization.Encoding.DER,
                                                   serialization.PublicFormat.SubjectPublicKeyInfo)
    print(f"PORTFOLIO_SSO_PRIVATE_KEY={base64.b64encode(private_der).decode()}")
    print(f"PORTFOLIO_SSO_PUBLIC_KEY={base64.b64encode(public_der).decode()}")
