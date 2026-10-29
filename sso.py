import os

from ronovo_portfolio_auth import portfolio_sso


def private_key():
    """The signing key from PORTFOLIO_SSO_PRIVATE_KEY, or None when portfolio login is off"""
    raw = os.environ.get("PORTFOLIO_SSO_PRIVATE_KEY", "").strip()
    return portfolio_sso.load_private_key(raw) if raw else None


# python sso.py prints a new key pair as .env lines
if __name__ == "__main__":
    new_key, public = portfolio_sso.new_key_pair()
    print(f"PORTFOLIO_SSO_PRIVATE_KEY={portfolio_sso.private_key_text(new_key)}")
    print(f"PORTFOLIO_SSO_PUBLIC_KEY={public}")
