"""Writes security-questions.json, the master list, into every repository that keeps a copy of it.

python sync_security_questions.py [--check] [AUTH_REPO TRACKER_REPO GM_TOOLBOX_REPO]

The repositories default to the folders next to this one. --check only reports which copies differ and exits
with 1 when any does.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
MASTER = ROOT / "security-questions.json"

# Each copy: the repository folder's default name, the file in it, and the line that opens its list. The list
# body runs from that line to the next line holding only the closing bracket.
COPIES = [
    ("ronovo-portfolio-auth", "src/ronovo_portfolio_auth/security_questions.py", re.compile(r"^QUESTIONS = \[$")),
    ("Personal-RuneScape-Tracker", "src/shared/securityQuestions.ts",
     re.compile(r"^export const SECURITY_QUESTIONS: readonly string\[\] = \[$")),
    ("Gamemaster-Toolbox", "Services/SecurityQuestions.cs", re.compile(r"^\s*\[$")),
]
CLOSING = re.compile(r"^(\s*)\];?$")


def master_questions() -> list[str]:
    return json.loads(MASTER.read_text(encoding="utf-8"))


def with_questions(text: str, opening: re.Pattern, questions: list[str]) -> str:
    """text with the list that opening starts replaced by questions, in the indentation the list already uses."""
    lines = text.split("\n")
    start = next(i for i, line in enumerate(lines) if opening.match(line))
    end = next(i for i in range(start + 1, len(lines)) if CLOSING.match(lines[i]))
    indent = re.match(r"\s*", lines[start + 1]).group() if end > start + 1 else CLOSING.match(lines[end]).group(1) + "    "
    body = [f"{indent}{json.dumps(question)}," for question in questions]
    return "\n".join(lines[:start + 1] + body + lines[end:])


def sync(repos: list[Path], check: bool) -> list[Path]:
    """Rewrites each copy from the master and returns the files that differed."""
    questions = master_questions()
    changed = []
    for repo, (_, relative, opening) in zip(repos, COPIES):
        path = repo / relative
        text = path.read_text(encoding="utf-8")
        synced = with_questions(text, opening, questions)
        if synced != text:
            changed.append(path)
            if not check:
                path.write_text(synced, encoding="utf-8", newline="\n")
    return changed


def main(argv: list[str]) -> int:
    check = "--check" in argv
    args = [arg for arg in argv if arg != "--check"]
    if len(args) not in (0, len(COPIES)):
        print(__doc__.strip(), file=sys.stderr)
        return 2
    repos = [Path(arg) for arg in args] or [ROOT.parent / name for name, _, _ in COPIES]
    changed = sync(repos, check)
    for path in changed:
        print(f"{'differs' if check else 'updated'}: {path}")
    if not changed:
        print("every copy matches security-questions.json")
    return 1 if check and changed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
