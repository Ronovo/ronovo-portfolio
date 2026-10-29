import hashlib
import hmac
import re
import sqlite3
import time
from contextlib import contextmanager
from typing import Optional

from werkzeug.security import check_password_hash, generate_password_hash

from ronovo_portfolio_auth import security_questions
from ronovo_portfolio_auth.login_limiter import LockedOut, LoginLimiter

USERNAME_PATTERN = re.compile(r"[A-Za-z0-9_-]{3,20}")
MIN_PASSWORD_LENGTH = 8

# Checked against when the username doesn't exist, so a wrong username takes as long as a wrong password
DUMMY_HASH = generate_password_hash("not a real password")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    security_question TEXT NOT NULL,
    security_answer_hash TEXT NOT NULL,
    reset_failures INTEGER NOT NULL DEFAULT 0,
    reset_locked_until REAL NOT NULL DEFAULT 0
);
"""


class AccountError(Exception):
    pass


def check_password(password: str):
    if len(password) < MIN_PASSWORD_LENGTH:
        raise AccountError(f"Passwords need at least {MIN_PASSWORD_LENGTH} characters")


class Accounts:
    def __init__(self, path: str, secret_key: str):
        self.path = path
        # Its own key, made from the session key, so the stand-in questions never sign with the session key itself.
        self.stand_in_key = hmac.new(secret_key.encode("utf-8"), b"stand-in security questions", hashlib.sha256).digest()
        self._logins = LoginLimiter()
        with self._db() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript(SCHEMA)

    @contextmanager
    def _db(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            with db:
                yield db
        finally:
            db.close()

    def register(self, username: str, password: str, question: str, answer: str) -> int:
        if not USERNAME_PATTERN.fullmatch(username):
            raise AccountError("Usernames are 3-20 letters, numbers, _ or -")
        check_password(password)
        problem = security_questions.problem(question, answer)
        if problem:
            raise AccountError(problem)
        try:
            with self._db() as db:
                cursor = db.execute(
                    """INSERT INTO users (username, password_hash, security_question, security_answer_hash)
                       VALUES (?, ?, ?, ?)""",
                    (username, generate_password_hash(password), question,
                     generate_password_hash(security_questions.normalize_answer(answer))))
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            raise AccountError("That username is taken")

    def check_login(self, username: str, password: str) -> int:
        with self._db() as db:
            row = db.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,)).fetchone()
        try:
            valid = self._logins.attempt(username, lambda: check_password_hash(row[1] if row else DUMMY_HASH, password)
                                         and row is not None)
        except LockedOut as locked:
            raise AccountError(str(locked)) from None
        if not valid:
            raise AccountError("Wrong username or password")
        return row[0]

    def username(self, user_id: int) -> Optional[str]:
        with self._db() as db:
            row = db.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()
        return row[0] if row else None

    def session_key(self, user_id: int) -> Optional[str]:
        """Changes whenever the password does, so a login session stored with it ends when the password is
        reset. None when the account no longer exists."""
        with self._db() as db:
            row = db.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
        return hashlib.sha256(row[0].encode("utf-8")).hexdigest()[:16] if row else None

    def security_question(self, username: str) -> str:
        with self._db() as db:
            row = db.execute("SELECT security_question FROM users WHERE username = ?", (username,)).fetchone()
        return row[0] if row else security_questions.stand_in_question(username, self.stand_in_key)

    def reset_password(self, username: str, answer: str, new_password: str):
        """Sets a new password when the security answer is right. Too many wrong answers lock resets for a while."""
        check_password(new_password)
        with self._db() as db:
            row = db.execute("SELECT id, security_answer_hash FROM users WHERE username = ?", (username,)).fetchone()
        if row is None:
            check_password_hash(DUMMY_HASH, answer)
            raise AccountError("That answer is wrong")
        user_id, answer_hash = row
        # Each try is counted before the answer is checked, in one statement, so answers sent at the same
        # moment can't all slip in under the limit.
        with self._db() as db:
            counted = db.execute("""UPDATE users SET reset_failures = reset_failures + 1
                                    WHERE id = ? AND reset_locked_until <= ? RETURNING reset_failures""",
                                 (user_id, time.time())).fetchone()
        if counted is None or counted[0] > security_questions.MAX_RESET_FAILURES:
            raise AccountError("Too many wrong answers. Try again in 15 minutes.")
        if not check_password_hash(answer_hash, security_questions.normalize_answer(answer)):
            if counted[0] == security_questions.MAX_RESET_FAILURES:
                with self._db() as db:
                    db.execute("UPDATE users SET reset_failures = 0, reset_locked_until = ? WHERE id = ?",
                               (time.time() + security_questions.RESET_LOCK_SECONDS, user_id))
            raise AccountError("That answer is wrong")
        with self._db() as db:
            db.execute("UPDATE users SET password_hash = ?, reset_failures = 0, reset_locked_until = 0 WHERE id = ?",
                       (generate_password_hash(new_password), user_id))
