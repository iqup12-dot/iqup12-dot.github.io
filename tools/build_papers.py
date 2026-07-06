#!/usr/bin/env python3
"""Obsidian 논문정리 노트 → data/papers.js (논문 그래프 데이터) 생성.

사용: python3 tools/build_papers.py
입력: ~/Desktop/Obsidian/연구/📑 논문정리/{클러스터}/*.md (frontmatter)
출력: data/papers.js  window.PAPERS_DATA = { nodes: [...], links: [...] }
      (script 태그 로딩 방식 — file:// 더블클릭으로 열어도 동작)

공개 데이터만 추출: 서지정보(제목·저자·연도·저널)와 키워드.
노트 본문(실험 데이터·DOE 세부)은 포함하지 않음.
"""
import json
import re
from pathlib import Path

VAULT = Path.home() / "Desktop/Obsidian/연구/📑 논문정리"
OUT = Path(__file__).resolve().parent.parent / "data/papers.js"
MIN_SHARED_KEYWORDS = 2  # 키워드 엣지 최소 공유 개수

def parse_frontmatter(text: str) -> dict:
    m = re.match(r"^---\n(.*?)\n---", text, re.S)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ":" not in line or line.startswith((" ", "\t")):
            continue
        key, _, val = line.partition(":")
        val = val.strip().strip('"')
        if val.startswith("[") and val.endswith("]"):
            fm[key.strip()] = [v.strip().strip('"') for v in val[1:-1].split(",") if v.strip()]
        else:
            fm[key.strip()] = val
    return fm

def main():
    nodes, links = [], []
    papers = []
    for md in sorted(VAULT.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        fm = parse_frontmatter(md.read_text(encoding="utf-8"))
        if not fm.get("title"):
            continue
        papers.append({
            "id": md.stem,
            "title": fm["title"],
            "authors": fm.get("authors", ""),
            "year": fm.get("year", ""),
            "journal": fm.get("journal", ""),
            "cluster": md.parent.name,
            "keywords": [k.lower() for k in fm.get("keywords", [])],
            "relevance": fm.get("relevance", "medium"),
            "doe_linked": bool(fm.get("my_doe_link")),
        })

    # DOE 중심 노드
    nodes.append({
        "id": "__doe__", "title": "내 연구 DOE — Sn-58Bi + 첨가제 IMC",
        "cluster": "DOE", "relevance": "core", "year": 2026,
        "authors": "이윤태", "journal": "중앙대 유연소자 및 금속소재 랩",
    })

    for p in papers:
        nodes.append({k: v for k, v in p.items() if k != "keywords"})
        if p["doe_linked"]:
            links.append({"source": p["id"], "target": "__doe__", "kind": "doe", "weight": 3})

    # 키워드 공유 엣지
    for i, a in enumerate(papers):
        for b in papers[i + 1:]:
            shared = set(a["keywords"]) & set(b["keywords"])
            if len(shared) >= MIN_SHARED_KEYWORDS:
                links.append({
                    "source": a["id"], "target": b["id"],
                    "kind": "kw", "weight": len(shared),
                    "shared": sorted(shared)[:5],
                })

    OUT.parent.mkdir(exist_ok=True)
    payload = json.dumps({"nodes": nodes, "links": links}, ensure_ascii=False, indent=1)
    OUT.write_text(f"window.PAPERS_DATA = {payload};\n", encoding="utf-8")
    print(f"nodes={len(nodes)} links={len(links)} -> {OUT}")

if __name__ == "__main__":
    main()
