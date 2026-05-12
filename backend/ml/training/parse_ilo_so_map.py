"""
parse_ilo_so_map.py
-------------------
Reads BSCpE_ILO_SO_Fully_Distributed_Final.xlsx (stdlib only — no openpyxl)
and prints a JavaScript `const COURSE_ILO_SO_MAP` object for use in
StudentCourseDetailView.jsx.

Collapsing rule: if the same SO appears twice for one ILO with different PIs
(e.g. SO10 with I and R), they are merged as "I/R".
"""

from __future__ import annotations
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict, OrderedDict

XLSX = Path(__file__).parent.parent.parent / "Documents" / "BSCpE_ILO_SO_Fully_Distributed_Final.xlsx"
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

# ── PI ordering for collapse ──────────────────────────────────────────────────
PI_ORDER = {"I": 0, "R": 1, "D": 2}


def _collapse_pis(pis: list[str]) -> str:
    seen = list(dict.fromkeys(p.upper() for p in pis if p))
    seen.sort(key=lambda p: PI_ORDER.get(p, 99))
    return "/".join(seen)


# ── XLSX helpers ──────────────────────────────────────────────────────────────

def _shared_strings(z: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out = []
    for si in root.findall(f"{{{NS}}}si"):
        out.append("".join(t.text or "" for t in si.findall(f".//{{{NS}}}t")))
    return out


def _sheet_rows(z: zipfile.ZipFile, path: str, ss: list[str]) -> list[dict[str, str]]:
    root = ET.fromstring(z.read(path))
    rows: list[dict[str, str]] = []
    for row in root.findall(f".//{{{NS}}}row"):
        cells: dict[str, str] = {}
        for cell in row.findall(f"{{{NS}}}c"):
            col = "".join(c for c in cell.get("r", "") if not c.isdigit())
            v = cell.find(f"{{{NS}}}v")
            if v is not None:
                cells[col] = ss[int(v.text)] if cell.get("t") == "s" else (v.text or "")
            else:
                cells[col] = ""
        rows.append(cells)
    return rows


# ── SO Legend ─────────────────────────────────────────────────────────────────

def parse_so_legend(z: zipfile.ZipFile, ss: list[str]) -> dict[int, str]:
    """Returns {so_number: short_name}."""
    rows = _sheet_rows(z, "xl/worksheets/sheet2.xml", ss)
    legend: dict[int, str] = {}
    for r in rows:
        a, b = r.get("A", "").strip(), r.get("B", "").strip()
        m = re.match(r"SO(\d+)$", a)
        if m and b:
            legend[int(m.group(1))] = b
    return legend


# ── Main sheet ────────────────────────────────────────────────────────────────

def parse_main_sheet(z: zipfile.ZipFile, ss: list[str]) -> dict[str, dict[int, list[dict]]]:
    """
    Returns:
        {
          course_code: {
            ilo_number (1-based): [
              {"so": int, "pi": str},   # pi is already collapsed
              ...
            ]
          }
        }
    """
    rows = _sheet_rows(z, "xl/worksheets/sheet1.xml", ss)

    # course_code -> { ilo_number -> { so_num -> [pi, ...] } }
    result: dict[str, dict] = OrderedDict()
    current_code: str | None = None
    # raw accumulator before collapsing: ilo_text -> {so_num -> [pi]}
    ilo_raw: dict[str, dict[int, list[str]]] = OrderedDict()
    ilo_order: list[str] = []  # ordered list of unique ilo texts

    def flush_course():
        nonlocal ilo_raw, ilo_order
        if current_code is None:
            return
        course_map: dict[int, list[dict]] = {}
        for idx, ilo_text in enumerate(ilo_order, 1):
            so_pi = ilo_raw[ilo_text]
            entries = []
            for so_num in sorted(so_pi.keys()):
                collapsed_pi = _collapse_pis(so_pi[so_num])
                entries.append({"so": so_num, "pi": collapsed_pi})
            course_map[idx] = entries
        result[current_code] = course_map
        ilo_raw = OrderedDict()
        ilo_order = []

    for row in rows:
        a = row.get("A", "").strip()
        b = row.get("B", "").strip()
        d = row.get("D", "").strip()

        # ── Course header ──────────────────────────────────────────────────
        if a.startswith("Course:"):
            flush_course()
            m = re.search(r"Course:\s*([A-Za-z]+\s+\d+)", a)
            current_code = m.group(1).strip() if m else None
            continue

        # ── Skip header / empty rows ───────────────────────────────────────
        if not a or not b or a.startswith("Intended Learning"):
            continue

        # ── ILO data row ───────────────────────────────────────────────────
        if current_code:
            try:
                so_num = int(float(b))
                pi = d.strip().upper() if d else "I"
            except (ValueError, TypeError):
                continue

            ilo_key = a  # full text as key (preserves uniqueness)
            if ilo_key not in ilo_raw:
                ilo_raw[ilo_key] = {}
                ilo_order.append(ilo_key)
            if so_num not in ilo_raw[ilo_key]:
                ilo_raw[ilo_key][so_num] = []
            ilo_raw[ilo_key][so_num].append(pi)

    flush_course()
    return result


# ── JS serialiser ─────────────────────────────────────────────────────────────

def render_js(mapping: dict[str, dict[int, list[dict]]]) -> str:
    lines = ["const COURSE_ILO_SO_MAP = {"]
    for course_code, ilos in mapping.items():
        lines.append(f'  "{course_code}": {{')
        for ilo_num, entries in ilos.items():
            entries_js = ", ".join(
                f'{{ so: {e["so"]}, pi: "{e["pi"]}" }}' for e in entries
            )
            lines.append(f"    {ilo_num}: [{entries_js}],")
        lines.append("  },")
    lines.append("};")
    return "\n".join(lines)


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    if not XLSX.exists():
        print(f"ERROR: file not found: {XLSX}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(XLSX) as z:
        ss = _shared_strings(z)
        so_legend = parse_so_legend(z, ss)
        mapping = parse_main_sheet(z, ss)

    print(f"// Parsed {len(mapping)} courses, {len(so_legend)} SOs\n", file=sys.stderr)

    # Also emit SO_NAMES
    so_names_lines = ["const SO_NAMES = {"]
    for num in sorted(so_legend.keys()):
        so_names_lines.append(f'  {num}: "{so_legend[num]}",')
    so_names_lines.append("};")
    print("\n".join(so_names_lines))
    print()
    print(render_js(mapping))


if __name__ == "__main__":
    main()
