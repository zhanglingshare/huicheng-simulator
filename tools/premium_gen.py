#!/usr/bin/env python3
"""把惠城站点的深色样式机械映射成浅色高级版覆盖层。

产出：
  ui/premium-auto.css              ← ui.css / ui-pages.css 的浅色版（全站共享）
  ui/premium/pages/<slug>.css      ← 每页 inline <style> 的浅色版（只在该页引用）

只映射颜色/阴影类声明，布局与尺寸原样保留。人工打磨放在 ui/premium.css。
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "ui"

# ---------------------------------------------------------------- 颜色映射表
INK = "#12161c"
INK2 = "#5f6773"
INK3 = "#78818f"
INK4 = "#98a1ad"

WHITE_TEXT = {"#eef2fb","#e8f1fb","#f5f5f7","#f0f4fa","#f0f4ff","#edf6ff","#f1f5f9","#f7fbff",
              "#e6edf3","#dce7f0","#e9f5ff","#eef6ff","#fff","#ffffff","#fffdf8","#fef3c7",
              "#f7fbff","#f0f4fa","#eceff5","#e2e8f0","#fff7e6"}
TEXT2 = {"#cbd5e1","#c3cad6","#cfe0ee","#cfe0f5","#c3d8e9","#bfd1e2","#b8c5d9","#a9c6da",
         "#adc7e2","#a9c0d8","#b0c4de","#c7d2e0","#d1d9e6","#dbe4f0","#c9d6e5","#bfc9d9",
         "#c8d3e0","#cfd8e3","#dbe3ee","#e0a054"}
TEXT3 = {"#94a3b8","#93a0b8","#8fa3bf","#9aa6b8","#9fb3cc","#8ba6bd","#8d9bb0","#90a0b5",
         "#98a2b3","#9aa1ac","#a1a9b5","#a3adbb","#7b8db0","#8892a0","#96a0ad","#8ba0b5",
         "#8ea3b8","#a0aec0","#98a8bd","#9aa8ba","#9fb0c4","#a7b6c8","#94a1b3"}
TEXT4 = {"#64748b","#5a6678","#6e7580","#5d7a91","#7d90ad","#6f8ba3","#7a8ba3","#5b6b8b",
         "#3d4a66","#64748b","#6b7280","#738091","#7a8699","#6e7f95","#7c8ba1","#6b7c93",
         "#465e77","#6e88a3","#8a99ad","#5f6f86","#55657c","#4b5f7a"}
CYAN = {"#4fc3ff","#38bdf8","#22d3ee","#5ac8fa","#7dd3fc","#60a5fa","#93c5fd","#8ecbff",
        "#7cc4ff","#9fd0ff","#bfe0ff","#82dcff","#7cc9fb","#cce6fa","#54b7ff","#4faefc",
        "#6ec6f7","#b0ecff","#5cbccb","#5ac8fa","#0ea5e9","#2563eb","#3b82f6","#0a84ff",
        "#2e7deb","#54c7ff","#38bdf8"}
AMBER = {"#fbbf24","#f0b35e","#ffc06d","#f59e0b","#ffb020","#d97706","#ffd166","#ffe4bd",
         "#ffd60a","#f0c75e","#ffcf8a","#e0a054","#c9853e","#fbbf24","#ffb94d","#ffc06d",
         "#fcd34d","#fde68a"}
RED = {"#f87171","#fb7185","#ff6b60","#ef4444","#ff453a","#e5616a","#fca5a5","#ff8078",
       "#e11d48","#c93b52","#ff5f6d","#fb923c","#f472b6"}
GREEN = {"#34d399","#3ddc97","#54d6a0","#30d158","#22c55e","#86efac","#6ee7b7","#8ff0b0",
         "#16a34a","#10b981","#40e0b0","#6ee7a0","#14532d","#2f9e44"}
PURPLE = {"#a06bff","#8b5cf6","#bf5af2","#7c3aed","#af52de","#c084fc","#8f7ce0","#6366f1"}
DARK_BG = {"#070d18","#060914","#04060f","#08090b","#0a141d","#0b1226","#0b1026","#0d1117",
           "#0c1018","#0e1523","#0a0f1a","#0a0f24","#06101e","#0b1a2e","#080b12","#0a1322",
           "#0a121f","#0b1424","#06070a","#090a0d","#0a0b0d","#0b0d10","#111214","#0f1115",
           "#141619","#16181c","#181a1e","#1c1c1e","#1a1c20","#1b1e23","#15171b","#131b2b",
           "#0d1420","#0f1a2a","#101d30","#0b1826","#111a26","#0f1622","#0a1220","#101826"}

def lum(hexstr):
    h = hexstr.lstrip("#")
    if len(h) == 3:
        h = "".join(c*2 for c in h)
    if len(h) != 6:
        return None
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (0.2126*r + 0.7152*g + 0.0722*b) / 255

def is_bg(prop):
    return prop.startswith("background") or prop in ("box-shadow",)

def is_border(prop):
    return prop.startswith("border") or prop.startswith("outline")

def is_text(prop):
    return prop in ("color","fill","stroke","text-decoration-color","caret-color") or prop.endswith("-color") and "border" not in prop

def map_hex(h, prop):
    low = h.lower()
    if len(low) == 4:
        low = "#" + "".join(c*2 for c in low[1:])
    if is_bg(prop):
        if low in WHITE_TEXT or low in DARK_BG:
            return "#ffffff"
        if low in CYAN:
            return "rgba(10,132,255,.10)"
        if low in AMBER:
            return "rgba(255,159,10,.13)"
        if low in RED:
            return "rgba(255,69,58,.10)"
        if low in GREEN:
            return "rgba(48,209,88,.12)"
        if low in PURPLE:
            return "rgba(175,82,222,.12)"
        if low in TEXT2 or low in TEXT3 or low in TEXT4:
            return "rgba(17,24,39,.05)"
    if is_border(prop):
        if low in WHITE_TEXT or low in DARK_BG or low in TEXT2:
            return "rgba(17,24,39,.12)"
        if low in CYAN:
            return "rgba(10,132,255,.30)"
        if low in AMBER:
            return "rgba(226,87,0,.32)"
        if low in RED:
            return "rgba(201,59,59,.30)"
        if low in GREEN:
            return "rgba(47,158,68,.30)"
        if low in PURPLE:
            return "rgba(124,58,237,.30)"
    # 文字 / 描边 / 其它
    if low in WHITE_TEXT:
        return INK
    if low in TEXT2:
        return INK2
    if low in TEXT3:
        return INK3
    if low in TEXT4:
        return INK4
    if low in CYAN:
        return "#0a7f95"
    if low in AMBER:
        return "#b25b00"
    if low in RED:
        return "#c93b3b"
    if low in GREEN:
        return "#2f9e44"
    if low in PURPLE:
        return "#7c3aed"
    if low in DARK_BG:
        return INK
    L = lum(low)
    if L is None:
        return h
    if L < 0.22:
        return "#ffffff" if is_bg(prop) else INK
    if L > 0.88 and is_text(prop):
        return INK
    if L > 0.55 and is_text(prop):
        return INK2
    return h

def map_rgba(m, prop):
    r, g, b, a = (float(x) for x in m.groups())
    R, G, B = int(float(r)), int(float(g)), int(float(b))
    a = float(a)
    mx = max(R, G, B)
    if is_bg(prop):
        if mx < 80:
            return f"rgba(255,255,255,{min(0.96, a+0.28):.2f})"
        if mx > 225 and a < 0.2:
            return "rgba(255,255,255,.06)" if False else f"rgba(255,255,255,{a:.2f})"
        if mx > 225:
            return f"rgba(255,255,255,{a:.2f})"
        return f"rgba({R},{G},{B},{a})"
    if prop and prop.startswith("box-shadow"):
        if mx < 80:
            return f"rgba(16,24,40,{min(0.22, a*0.45):.2f})"
        return f"rgba({R},{G},{B},{a})"
    if is_text(prop):
        if mx > 225:
            return INK
        if 150 < mx <= 225:
            return INK2
        if mx < 90:
            return INK
        return f"rgba({R},{G},{B},{a})"
    return f"rgba({R},{G},{B},{a})"

HEX_RE = re.compile(r"#([0-9a-fA-F]{3,8})\b")
RGBA_RE = re.compile(r"rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)")

def convert_value(prop, val):
    v = val
    # text-shadow 直接去掉（浅色底不需要发光）
    if prop == "text-shadow":
        return "none"
    # 渐变里的每个色标单独映射
    def repl_hex(m):
        return map_hex("#" + m.group(1), prop)
    def repl_rgba(m):
        if m.group(4) is None:
            return f"rgb({m.group(1)},{m.group(2)},{m.group(3)})"
        return map_rgba(m, prop)
    v = HEX_RE.sub(repl_hex, v)
    v = RGBA_RE.sub(repl_rgba, v)
    if "backdrop-filter" in prop:
        return val
    return v

SKIP_PROPS = {"display","position","top","left","right","bottom","width","height","min-width",
              "max-width","min-height","max-height","padding","padding-top","padding-bottom",
              "padding-left","padding-right","margin","margin-top","margin-bottom","margin-left",
              "margin-right","font-size","font-weight","font-family","line-height","letter-spacing",
              "grid-template-columns","grid-template-rows","grid-column","grid-row","gap",
              "flex-direction","justify-content","align-items","overflow","overflow-x","overflow-y",
              "z-index","cursor","pointer-events","opacity","transform","transition","animation",
              "animation-name","animation-duration","animation-delay","text-align","white-space",
              "box-sizing","order","flex","flex-wrap","border-radius","border-width","border-style",
              "inset","float","visibility","content","vertical-align","text-transform","aspect-ratio",
              "object-fit","stroke-width","stroke-dasharray","stop-opacity","fill-opacity",
              "font-variant-numeric","text-overflow","word-break","mix-blend-mode","filter",
              "border-collapse","table-layout","list-style","text-decoration","position"}

COLOR_HINT = ("color","background","border","outline","shadow","fill","stroke","--")

def parse_css(css):
    """极简 CSS 解析：返回 [(selector, [(prop, value)])]"""
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)
    out = []
    depth = 0
    buf = ""
    i = 0
    while i < len(css):
        c = css[i]
        if c == "{":
            sel = buf.strip()
            buf = ""
            depth = 1
            body = ""
            i += 1
            while i < len(css) and depth:
                if css[i] == "{":
                    depth += 1
                elif css[i] == "}":
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
                body += css[i]
                i += 1
            decls = []
            for d in body.split(";"):
                if ":" not in d:
                    continue
                p, v = d.split(":", 1)
                p = p.strip(); v = v.strip()
                if p and v:
                    decls.append((p, v))
            if sel:
                if sel.startswith("@") and sel.split(" ")[0].split("(")[0] in ("@media","@supports","@layer","@container"):
                    out.append((sel, parse_css(body)))
                elif sel in ("@keyframes","@font-face") or sel.startswith("@keyframes") or sel.startswith("@font-face") or sel.startswith("@import") or sel.startswith("@charset"):
                    continue
                else:
                    out.append((sel, decls))
            buf = ""
            continue
        else:
            buf += c
        i += 1
    return out

def emit(rules, prefix="html ", indent=""):
    parts = []
    for sel, decls in rules:
        if sel.startswith("@"):
            inner = emit(decls, prefix, indent + "  ")
            if inner:
                parts.append(indent + sel + "{\n" + inner + "\n" + indent + "}")
            continue
        heads = []
        for s in sel.split(","):
            s2 = s.strip()
            heads.append(s2 if s2 in (":root","html","*") or s2.startswith("html") else prefix + s2)
        head = ", ".join(heads)
        body = []
        for p, v in decls:
            body.append(f"  {p}:{v};")
        if body:
            parts.append(head + "{\n" + "\n".join(body) + "\n}")
    return "\n".join(parts)

def convert_rules(rules):
    out = []
    for sel, decls in rules:
        if sel.startswith("@"):
            inner = convert_rules(decls)
            if inner:
                out.append((sel, inner))
            continue
        conv = []
        for p, v in decls:
            pl = p.lower()
            if pl.startswith("--"):
                low = v.strip().lower()
                if low in CYAN or low in AMBER or low in RED or low in GREEN or low in PURPLE:
                    conv.append((p, low if low not in CYAN else "#0a84ff"))
                    continue
                if low in WHITE_TEXT:
                    conv.append((p, INK)); continue
                if low in TEXT2:
                    conv.append((p, INK2)); continue
                if low in TEXT3:
                    conv.append((p, INK3)); continue
                if "rgba(0,0,0" in v or "shadow" in pl or "sh" in pl:
                    conv.append((p, convert_value("box-shadow", v)))
                continue
            if pl in SKIP_PROPS:
                continue
            if not any(k in pl for k in COLOR_HINT):
                continue
            if "filter" == pl:
                continue
            nv = convert_value(pl, v)
            if nv != v:
                conv.append((p, nv))
        if conv:
            out.append((sel, conv))
    return out

def build(src_list, dest):
    all_rules = []
    for src in src_list:
        text = (ROOT / src).read_text(encoding="utf-8")
        all_rules += parse_css(text)
    conv = convert_rules(all_rules)
    dest.write_text(
        "/* 自动生成：深色样式 → 浅色高级版映射。人工打磨见 premium.css */\n" + emit(conv),
        encoding="utf-8")
    print(f"{dest.relative_to(ROOT)}: {len(conv)} rules, {dest.stat().st_size} bytes")

if __name__ == "__main__":
    build(["ui/ui.css", "ui/ui-pages.css"], OUT / "premium-auto.css")

# --------------------------------------------------------------- 每页覆盖层
def page_prefix(sel):
    s = sel.strip()
    if s in (":root",):
        return s
    if s in ("body", "html", "html,body", "*"):
        return "html body" if s != "*" else "*"
    parts = []
    for one in s.split(","):
        o = one.strip()
        if o in ("body", "html,body", "html"):
            parts.append("html body")
        elif o.startswith("body"):
            parts.append("html " + o)
        else:
            parts.append("html body " + o)
    return ", ".join(parts)

def build_page(html_rel):
    html_path = ROOT / html_rel
    text = html_path.read_text(encoding="utf-8")
    styles = re.findall(r"<style[^>]*>([\s\S]*?)</style>", text)
    if not styles:
        return None
    rules = []
    for st in styles:
        rules += parse_css(st)
    conv = convert_rules(rules)
    slug = html_rel.replace("/", "_").replace(".html", "")
    dest = OUT / "premium" / "pages" / f"{slug}.css"
    dest.parent.mkdir(parents=True, exist_ok=True)
    def render(rules, indent=""):
        out = []
        for sel, decls in rules:
            if sel.startswith("@"):
                inner = render(decls, indent + "  ")
                if inner:
                    out.append(indent + sel + "{\n" + inner + "\n" + indent + "}")
                continue
            head = page_prefix(sel)
            out.append(indent + head + "{\n" + "\n".join(f"{indent}  {p}:{v};" for p, v in decls) + "\n" + indent + "}")
        return "\n".join(out)
    body = render(conv).split("\n")
    dest.write_text("/* 自动生成：%s 浅色映射 */\n" % html_rel + "\n".join(body), encoding="utf-8")
    return dest, len(conv)
