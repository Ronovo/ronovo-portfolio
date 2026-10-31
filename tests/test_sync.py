import json
import runpy
import sys

import pytest

import sync_security_questions as sync
from ronovo_portfolio_auth.security_questions import QUESTIONS

PYTHON = '"""Questions."""\n\nQUESTIONS = [\n    "Old one?",\n    "Old two?",\n]\nMAX = 1\n'
TYPESCRIPT = 'export const SECURITY_QUESTIONS: readonly string[] = [\n  "Old one?",\n];\n\nexport const MAX = 1;\n'
CSHARP = ('public class SecurityQuestions\n{\n    public static readonly IReadOnlyList<string> All =\n    [\n'
          '        "Old one?",\n    ];\n}\n')


def test_the_package_matches_the_master_list():
    assert QUESTIONS == sync.master_questions()


@pytest.fixture
def repos(tmp_path):
    folders = []
    for (name, relative, _), text in zip(sync.COPIES, [PYTHON, TYPESCRIPT, CSHARP]):
        path = tmp_path / name / relative
        path.parent.mkdir(parents=True)
        path.write_text(text, encoding="utf-8", newline="\n")
        folders.append(tmp_path / name)
    return folders


def test_sync_rewrites_each_copy_in_its_own_style(repos, monkeypatch):
    monkeypatch.setattr(sync, "MASTER", repos[0] / "master.json")
    sync.MASTER.write_text(json.dumps(['Say "hi"?', "It's two?"]), encoding="utf-8")
    assert sync.sync(repos, check=False) == [repo / relative for repo, (_, relative, _) in zip(repos, sync.COPIES)]
    assert (repos[0] / sync.COPIES[0][1]).read_text(encoding="utf-8") == (
        '"""Questions."""\n\nQUESTIONS = [\n    "Say \\"hi\\"?",\n    "It\'s two?",\n]\nMAX = 1\n')
    assert (repos[1] / sync.COPIES[1][1]).read_text(encoding="utf-8") == (
        'export const SECURITY_QUESTIONS: readonly string[] = [\n  "Say \\"hi\\"?",\n  "It\'s two?",\n];\n\n'
        'export const MAX = 1;\n')
    assert (repos[2] / sync.COPIES[2][1]).read_text(encoding="utf-8") == (
        'public class SecurityQuestions\n{\n    public static readonly IReadOnlyList<string> All =\n    [\n'
        '        "Say \\"hi\\"?",\n        "It\'s two?",\n    ];\n}\n')
    assert sync.sync(repos, check=True) == []


def test_an_empty_list_is_indented_under_its_bracket():
    assert sync.with_questions("QUESTIONS = [\n]\n", sync.COPIES[0][2], ["A?"]) == 'QUESTIONS = [\n    "A?",\n]\n'


def test_check_reports_without_writing(repos, capsys):
    paths = [str(repo) for repo in repos]
    assert sync.main(["--check", *paths]) == 1
    assert capsys.readouterr().out.count("differs: ") == 3
    assert "Old one?" in (repos[0] / sync.COPIES[0][1]).read_text(encoding="utf-8")
    assert sync.main(paths) == 0
    assert capsys.readouterr().out.count("updated: ") == 3
    assert sync.main(["--check", *paths]) == 0
    assert "every copy matches" in capsys.readouterr().out


def test_the_script_needs_all_repos_or_none(capsys):
    assert sync.main(["only-one"]) == 2
    assert "python sync_security_questions.py" in capsys.readouterr().err


def test_the_script_runs_from_the_command_line(monkeypatch):
    monkeypatch.setattr(sys, "argv", ["sync_security_questions.py", "a"])
    with pytest.raises(SystemExit) as exit_code:
        runpy.run_path(str(sync.ROOT / "sync_security_questions.py"), run_name="__main__")
    assert exit_code.value.code == 2
