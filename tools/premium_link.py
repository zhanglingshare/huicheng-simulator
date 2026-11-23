#!/usr/bin/env python3
"""给每个页面挂上高级版浅色覆盖层（幂等）。
顺序：premium-auto(共享) → 页面专属 → premium.css(人工打磨)
"""
import pathlib, re

ROOT = pathlib.Path("/home/user/Doubao/chats/38426950824531714/huicheng-live")

PAGES = {
    "index.html": ["index"],
    "briefing.html": ["briefing"],
    "spotlight.html": ["spotlight"],
    "poster.html": ["poster"],
    "holo.html": ["holo"],
    "holo-workspace.html": ["holo-workspace"],
    "today.html": ["today"],
    "fun.html": ["fun", "fun-v3"],
    "choices.html": ["choices", "choices-kg"],
    "future.html": ["future"],
    "windtunnel.html": ["windtunnel"],
    "commute.html": ["commute"],
    "blindspot.html": ["blindspot"],
    "network.html": ["network"],
    "evolution.html": ["evolution"],
    "role.html": ["role"],
    "who.html": ["who"],
    "report.html": ["report"],
    "future-lab.html": ["future-lab"],
    "ending.html": ["ending"],
    "home.html": ["home"],
    "decision-lab.html": ["decision-lab", "hc-lab-studio"],
    "money.html": ["money"],
    "start.html": ["start"],
    "lens/capability.html": ["lens__capability", "lens"],
    "lens/foundation.html": ["lens__foundation", "lens"],
}

BLOCK = "<!-- premium light ui -->\n"

for rel, slugs in PAGES.items():
    p = ROOT / rel
    html = p.read_text(encoding="utf-8")
    if "premium light ui" in html:
        html = re.sub(r"<!-- premium light ui -->[\s\S]*?<!-- /premium light ui -->\n?", "", html)
    base = "../" if rel.startswith("lens/") else ""
    lines = [BLOCK]
    lines.append(f'<link rel="stylesheet" href="{base}ui/premium-auto.css">\n')
    for s in slugs:
        f = ROOT / "ui" / "premium" / "pages" / f"{s}.css"
        if f.exists() and f.stat().st_size > 30:
            lines.append(f'<link rel="stylesheet" href="{base}ui/premium/pages/{s}.css">\n')
    lines.append(f'<link rel="stylesheet" href="{base}ui/premium.css">\n')
    lines.append("<!-- /premium light ui -->\n")
    block = "".join(lines)
    if "</head>" in html:
        html = html.replace("</head>", block + "</head>", 1)
    else:
        raise SystemExit("no </head>: " + rel)
    p.write_text(html, encoding="utf-8")
    print("linked:", rel)
