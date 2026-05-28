"""Verify that generated Python types are syntactically valid."""

from pathlib import Path


GENERATED_TYPES_PATH = (
    Path(__file__).resolve().parents[3]
    / "apps"
    / "python-audio-analyzer"
    / "src"
    / "types"
    / "generated"
    / "__init__.py"
)


def main() -> None:
    source = GENERATED_TYPES_PATH.read_text(encoding="utf-8")
    compile(source, str(GENERATED_TYPES_PATH), "exec")


if __name__ == "__main__":
    main()
