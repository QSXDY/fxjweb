# 解析项目文件/ 下全部 .xls 套餐表
# -*- coding: utf-8 -*-
import os, sys, glob
import xlrd

DIR = r"E:\PC\项目文件"
OUT = r"E:\PC\网站\_parsed_plans.txt"

def dump_xls(path):
    lines = []
    try:
        wb = xlrd.open_workbook(path)
    except Exception as e:
        return [f"[ERR] {path}: {e}"]
    lines.append(f"===== {os.path.basename(path)} =====")
    for sh in wb.sheets():
        lines.append(f"--- sheet: {sh.name} ({sh.nrows}x{sh.ncols}) ---")
        for r in range(sh.nrows):
            row = []
            for c in range(sh.ncols):
                v = sh.cell_value(r, c)
                if isinstance(v, float) and v.is_integer():
                    v = int(v)
                v = str(v).strip()
                row.append(v)
            # 去掉全空行
            if any(row):
                lines.append(" | ".join(row))
    return lines

all_lines = []
for f in sorted(glob.glob(os.path.join(DIR, "*.xls"))):
    all_lines.extend(dump_xls(f))
    all_lines.append("")

with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("\n".join(all_lines))

print(f"[ok] 解析完成: {OUT}  ({len(all_lines)} 行)")
