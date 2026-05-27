#!/usr/bin/env python3
"""FastAPI OpenAPI Spec を packages/shared-types/openapi/ に書き出す。"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent
OUTPUT_PATH = (
    APP_ROOT.parent.parent
    / "packages"
    / "shared-types"
    / "openapi"
    / "python-api.json"
)


def export_openapi_spec() -> None:
    code = f"""
import json
from pathlib import Path
from src.main import create_app

app = create_app()
document = app.openapi()
output = Path({str(OUTPUT_PATH)!r})
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(
    json.dumps(document, indent=2, ensure_ascii=False) + "\\n",
    encoding="utf-8",
)
print(f"✅ Python OpenAPI spec exported: {{output}}")
"""
    subprocess.run(
        [sys.executable, "-c", code],
        cwd=APP_ROOT,
        check=True,
    )


if __name__ == "__main__":
    export_openapi_spec()
