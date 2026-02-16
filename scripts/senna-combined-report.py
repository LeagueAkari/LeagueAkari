#!/usr/bin/env python3
"""
赛娜 OTP 综合分析报告 (Tab 切换版)
====================================
读取所有玩家的缓存数据，生成一个带 Tab 切换的综合 HTML 报告。
包含：总结分析页 + 每位玩家独立报告页。

用法:
  python3 senna-combined-report.py
"""

import base64
import json
import os
import sys
from collections import defaultdict

# ══════════════════════════════════════════
# 配置 (与 senna-otp-analyzer.py 一致)
# ══════════════════════════════════════════

PLAYERS = [
    {"name": "Senna LF Nilah", "tag": "Duo",  "region": "NA"},
    {"name": "Eternal life",    "tag": "5753", "region": "NA"},
    {"name": "emiyaa",          "tag": "1389", "region": "NA"},
    {"name": "LeChase",         "tag": "EUW",  "region": "EUW"},
    {"name": "sindrelolpro2345","tag": "EUW",  "region": "EUW"},
    {"name": "Oh0Tech",         "tag": "KR1",  "region": "KR"},
    {"name": "Komaeda NGI",     "tag": "EUW",  "region": "EUW"},
    {"name": "4IM",             "tag": "1tsme","region": "EUW"},
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_BASE = os.path.join(SCRIPT_DIR, "support-analysis-output")
PLAYERS_DIR = os.path.join(OUTPUT_BASE, "players")

BOOT_IDS = {3009, 3006, 3020, 3047, 3111, 3158, 3117}
STARTER = {3865, 3866, 3867, 3858, 3859, 3860, 3862, 3863, 3864, 3869, 3870, 3871, 3876, 3877}
CONSUMABLE = {2003, 2004, 2031, 2033, 2055, 2138, 2139, 2140, 3340, 3364, 3363, 2022, 2021}
IGNORE_ORPHAN = {1001, 3070}


# ══════════════════════════════════════════
# 静态数据
# ══════════════════════════════════════════

def load_static_data():
    data = {}
    with open(f"{OUTPUT_BASE}/items_full.json") as f:
        data['items'] = {int(k): v for k, v in json.load(f).items()}
    with open(f"{OUTPUT_BASE}/champs_zh.json") as f:
        data['champs'] = json.load(f)
    with open(f"{OUTPUT_BASE}/runes_zh.json") as f:
        data['runes'] = {int(k): v for k, v in json.load(f).items()}
    with open(f"{OUTPUT_BASE}/item_components.json") as f:
        data['item_components'] = {int(k): set(v) for k, v in json.load(f).items()}
    return data


def load_lolalytics():
    lola = {}
    for key, fname in [
        ('vs_sup', 'lolalytics_senna_vs_sup.json'),
        ('vs_adc', 'lolalytics_senna_vs_adc.json'),
        ('vs_jg',  'lolalytics_senna_vs_jg.json'),
        ('with_adc', 'lolalytics_senna_with_adc.json'),
        ('with_jg',  'lolalytics_senna_with_jg.json'),
    ]:
        path = os.path.join(OUTPUT_BASE, fname)
        if os.path.exists(path):
            with open(path) as f:
                lola[key] = json.load(f)
        else:
            lola[key] = {}
    return lola


def player_dir(player):
    safe = f"{player['name']}_{player['tag']}".replace(' ', '_').replace('#', '_')
    return os.path.join(PLAYERS_DIR, safe)


# ══════════════════════════════════════════
# 工具函数
# ══════════════════════════════════════════

ITEMS = {}
CHAMPS = {}
RUNES = {}
ITEM_COMPONENTS = {}


def cn(en_name):
    return CHAMPS.get(en_name, en_name)

def item_zh(iid):
    return ITEMS.get(iid, {}).get('zh', f'#{iid}')

def item_gold(iid):
    return ITEMS.get(iid, {}).get('gold', 0)

def rune_zh(rid):
    return RUNES.get(rid, f'#{rid}')

def is_completed(iid):
    if iid in BOOT_IDS | STARTER | CONSUMABLE: return False
    return item_gold(iid) >= 1500

def wr(w, n):
    if n == 0: return "N/A"
    return f"{w}/{n} ({100*w/n:.1f}%)"

def wr_color(w, n):
    if n == 0: return "#888"
    r = w/n
    return "#2ecc71" if r >= 0.60 else "#f39c12" if r >= 0.50 else "#e74c3c"

def adj_color(adj):
    return "#2ecc71" if adj >= 65 else "#f39c12" if adj >= 55 else "#e74c3c"

def excess_badge(ex):
    sign = "+" if ex >= 0 else ""
    color = "#2ecc71" if ex >= 0.5 else "#e74c3c" if ex < -0.5 else "#f39c12"
    return f'<span style="color:{color};font-weight:bold">{sign}{ex:.1f}</span>'

def tbl(headers, rows):
    h = "".join(f"<th>{x}</th>" for x in headers)
    r = ""
    for row in rows:
        r += "<tr>" + "".join(f"<td>{x}</td>" for x in row) + "</tr>"
    return f"<table><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table>"


# ══════════════════════════════════════════
# 分析引擎 (提取数据而不生成 HTML)
# ══════════════════════════════════════════

def analyze_player(player, games, lola):
    """分析单个玩家，返回分析结果字典"""
    total = len(games)
    if total == 0:
        return None
    wins = sum(1 for g in games if g['me_win'])
    SENNA_WR = wins / total

    def expected_wr(g):
        factors = []
        es = g.get('enemy_sup_champion', '?')
        ea = g.get('enemy_adc_champion', '?')
        aa = g.get('ally_adc_champion', '?')
        ajg = g.get('ally_jg', '?')
        ejg = g.get('enemy_jg', '?')
        if es in lola['vs_sup']:   factors.append(lola['vs_sup'][es] / 100)
        if ea in lola['vs_adc']:   factors.append(lola['vs_adc'][ea] / 100)
        if ejg in lola['vs_jg']:   factors.append(lola['vs_jg'][ejg] / 100)
        if aa in lola['with_adc']: factors.append(lola['with_adc'][aa] / 100)
        if ajg in lola['with_jg']: factors.append(lola['with_jg'][ajg] / 100)
        if not factors: return SENNA_WR
        return sum(factors) / len(factors)

    def get_perks(g):
        perks = g.get('me_perks', {})
        styles = perks.get('styles', [])
        if len(styles) < 2: return None, None, None
        primary = styles[0]
        secondary = styles[1]
        keystone = primary['selections'][0]['perk'] if primary.get('selections') else None
        return keystone, primary.get('style'), secondary.get('style')

    # 对位
    sup_stats = defaultdict(lambda: {"g":0,"w":0,"k":0,"d":0,"a":0})
    adc_stats = defaultdict(lambda: {"g":0,"w":0})
    ally_stats = defaultdict(lambda: {"g":0,"w":0,"k":0,"d":0,"a":0})
    enemy_jg_stats = defaultdict(lambda: {"g":0,"w":0})
    ally_jg_stats = defaultdict(lambda: {"g":0,"w":0})

    for g in games:
        es = g.get('enemy_sup_champion', '?')
        ea = g.get('enemy_adc_champion', '?')
        aa = g.get('ally_adc_champion', '?')
        ejg = g.get('enemy_jg', '?')
        ajg = g.get('ally_jg', '?')
        w = g['me_win']
        sup_stats[es]["g"] += 1; adc_stats[ea]["g"] += 1; ally_stats[aa]["g"] += 1
        enemy_jg_stats[ejg]["g"] += 1; ally_jg_stats[ajg]["g"] += 1
        if w:
            sup_stats[es]["w"] += 1; adc_stats[ea]["w"] += 1; ally_stats[aa]["w"] += 1
            enemy_jg_stats[ejg]["w"] += 1; ally_jg_stats[ajg]["w"] += 1
        sup_stats[es]["k"] += g["me_kills"]; sup_stats[es]["d"] += g["me_deaths"]; sup_stats[es]["a"] += g["me_assists"]
        ally_stats[aa]["k"] += g["me_kills"]; ally_stats[aa]["d"] += g["me_deaths"]; ally_stats[aa]["a"] += g["me_assists"]

    # 出装
    first_item = defaultdict(lambda: {"g":0,"w":0,"t":[],"exp":0.0})
    two_item = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    three_item = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    boots_st = defaultdict(lambda: {"g":0,"w":0})

    for g in games:
        pid = g["me_pid"]; details = g.get("details")
        if not details: continue
        evts = details.get("events", []); w = g["me_win"]
        exp_wr = expected_wr(g)
        bought = sorted([(e["timestamp"], e["itemId"]) for e in evts
                         if e.get("type") == "ITEM_PURCHASED" and e.get("participantId") == pid])
        done = []; seen = set(); boot = None
        for ts, iid in bought:
            if iid in BOOT_IDS and not boot: boot = iid
            if is_completed(iid) and iid not in seen:
                done.append((item_zh(iid), ts)); seen.add(iid)
        if boot:
            boots_st[item_zh(boot)]["g"] += 1
            if w: boots_st[item_zh(boot)]["w"] += 1
        if len(done) >= 1:
            first_item[done[0][0]]["g"] += 1; first_item[done[0][0]]["t"].append(done[0][1]/60000)
            first_item[done[0][0]]["exp"] += exp_wr
            if w: first_item[done[0][0]]["w"] += 1
        if len(done) >= 2:
            k = f"{done[0][0]} → {done[1][0]}"; two_item[k]["g"] += 1
            two_item[k]["exp"] += exp_wr
            if w: two_item[k]["w"] += 1
        if len(done) >= 3:
            k = f"{done[0][0]} → {done[1][0]} → {done[2][0]}"; three_item[k]["g"] += 1
            three_item[k]["exp"] += exp_wr
            if w: three_item[k]["w"] += 1

    # 游走
    def is_bot(x, y):
        return x is not None and y is not None and x > 9000 and y < 5000

    def get_roams(frames, key):
        was = True; start = None; result = []
        for f in frames:
            ts = f["timestamp"]
            d = f.get("me", {}) if key == "me" else f.get("enemy_sup", {})
            x, y = d.get("x"), d.get("y")
            if x is None: continue
            ib = is_bot(x, y)
            if was and not ib and ts > 60000: start = ts
            elif not was and ib and start: result.append(start/60000); start = None
            was = ib
        return result

    roam_data = {"me_first_w":0, "me_first_n":0, "en_first_w":0, "en_first_n":0, "none_w":0, "none_n":0}
    for g in games:
        details = g.get("details")
        if not details: continue
        mr = get_roams(details.get("frames", []), "me")
        er = get_roams(details.get("frames", []), "enemy")
        mf = mr[0] if mr else 999; ef = er[0] if er else 999
        w = g["me_win"]
        if mf < ef and mf < 999: roam_data["me_first_n"] += 1; roam_data["me_first_w"] += w
        elif ef < mf and ef < 999: roam_data["en_first_n"] += 1; roam_data["en_first_w"] += w
        else: roam_data["none_n"] += 1; roam_data["none_w"] += w

    # 符文
    keystone_stats = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    tree_combo_stats = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    rune_item_stats = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})

    for g in games:
        ks, primary, secondary = get_perks(g)
        if ks is None: continue
        w = g["me_win"]; exp_wr = expected_wr(g)
        keystone_stats[ks]["g"] += 1; keystone_stats[ks]["exp"] += exp_wr
        if w: keystone_stats[ks]["w"] += 1
        combo = f"{rune_zh(primary)} + {rune_zh(secondary)}"
        tree_combo_stats[combo]["g"] += 1; tree_combo_stats[combo]["exp"] += exp_wr
        if w: tree_combo_stats[combo]["w"] += 1
        details = g.get("details")
        if details:
            pid = g["me_pid"]; evts = details.get("events", [])
            bought = sorted([(e["timestamp"], e["itemId"]) for e in evts
                             if e.get("type") == "ITEM_PURCHASED" and e.get("participantId") == pid])
            for ts, iid in bought:
                if is_completed(iid):
                    ri_key = f"{rune_zh(ks)} + {item_zh(iid)}"
                    rune_item_stats[ri_key]["g"] += 1; rune_item_stats[ri_key]["exp"] += exp_wr
                    if w: rune_item_stats[ri_key]["w"] += 1
                    break

    # 决策树
    route_data = []
    for g in games:
        ks, primary, secondary = get_perks(g)
        if ks is None: continue
        w = g["me_win"]; exp_wr = expected_wr(g)
        details = g.get("details")
        if not details: continue
        pid = g["me_pid"]; evts = details.get("events", [])
        bought = sorted([(e["timestamp"], e["itemId"]) for e in evts
                         if e.get("type") == "ITEM_PURCHASED" and e.get("participantId") == pid])
        done = []; seen = set()
        for ts, iid in bought:
            if is_completed(iid) and iid not in seen:
                done.append(item_zh(iid)); seen.add(iid)
            if len(done) >= 2: break
        if len(done) >= 1:
            route_data.append((rune_zh(ks), done[0], done[1] if len(done) >= 2 else None, w, exp_wr))

    # 孤儿小件
    orphan_stats = defaultdict(lambda: {"g":0,"w":0})
    orphan_game_count = 0
    for g in games:
        details = g.get("details")
        if not details: continue
        pid = g["me_pid"]; evts = details.get("events", [])
        bought = sorted([(e["timestamp"], e["itemId"]) for e in evts
                         if e.get("type") == "ITEM_PURCHASED" and e.get("participantId") == pid])
        first_completed_ts = None; first_completed_id = None
        for ts, iid in bought:
            if is_completed(iid):
                first_completed_ts = ts; first_completed_id = iid; break
        if first_completed_ts is None: continue
        components = ITEM_COMPONENTS.get(first_completed_id, set())
        has_orphan = False
        for ts, iid in bought:
            if ts >= first_completed_ts: break
            if iid in BOOT_IDS | STARTER | CONSUMABLE | IGNORE_ORPHAN: continue
            if iid in components: continue
            if item_gold(iid) < 300: continue
            orphan_stats[item_zh(iid)]["g"] += 1
            if g["me_win"]: orphan_stats[item_zh(iid)]["w"] += 1
            has_orphan = True
        if has_orphan:
            orphan_game_count += 1

    # 对局时长
    dur_data = []
    for label, lo, hi in [("短局 (15-25分)", 900, 1500), ("中局 (25-35分)", 1500, 2100), ("长局 (35分+)", 2100, 99999)]:
        b = [g for g in games if lo <= g["gameDuration"] < hi]
        if b: dur_data.append((label, sum(g["me_win"] for g in b), len(b)))

    # 汇总
    avg_k = sum(g["me_kills"] for g in games)/total
    avg_d = sum(g["me_deaths"] for g in games)/total
    avg_a = sum(g["me_assists"] for g in games)/total
    avg_vs = sum(g["me_visionScore"] for g in games)/total
    avg_gold = sum(g["me_goldEarned"] for g in games)/total
    avg_dmg = sum(g["me_totalDamageDealtToChampions"] for g in games)/total
    avg_dur = sum(g["gameDuration"] for g in games)/total

    return {
        'player': player,
        'total': total, 'wins': wins, 'wr': SENNA_WR,
        'avg_k': avg_k, 'avg_d': avg_d, 'avg_a': avg_a,
        'avg_vs': avg_vs, 'avg_gold': avg_gold, 'avg_dmg': avg_dmg, 'avg_dur': avg_dur,
        'sup_stats': dict(sup_stats), 'adc_stats': dict(adc_stats),
        'ally_stats': dict(ally_stats),
        'enemy_jg_stats': dict(enemy_jg_stats), 'ally_jg_stats': dict(ally_jg_stats),
        'first_item': dict(first_item), 'two_item': dict(two_item),
        'three_item': dict(three_item), 'boots_st': dict(boots_st),
        'keystone_stats': dict(keystone_stats), 'tree_combo_stats': dict(tree_combo_stats),
        'rune_item_stats': dict(rune_item_stats),
        'route_data': route_data,
        'roam_data': roam_data,
        'orphan_stats': dict(orphan_stats), 'orphan_game_count': orphan_game_count,
        'dur_data': dur_data,
        'expected_wr_fn': expected_wr,
    }


# ══════════════════════════════════════════
# 玩家报告 HTML body 生成
# ══════════════════════════════════════════

def generate_player_body(a):
    """生成单个玩家的报告 body (不含 <html>/<head>/<body> 标签)"""
    player = a['player']
    player_label = f"{player['name']}#{player['tag']}"
    region_label = player['region']
    total = a['total']; wins = a['wins']
    avg_k = a['avg_k']; avg_d = a['avg_d']; avg_a = a['avg_a']
    avg_vs = a['avg_vs']; avg_gold = a['avg_gold']; avg_dmg = a['avg_dmg']; avg_dur = a['avg_dur']

    # 图表 (base64 嵌入)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import numpy as np

    matplotlib.rcParams['font.family'] = 'sans-serif'
    matplotlib.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'Hiragino Sans GB', 'PingFang SC', 'Microsoft YaHei'] + matplotlib.rcParams.get('font.sans-serif', [])
    matplotlib.rcParams['axes.unicode_minus'] = False
    plt.rcParams['figure.dpi'] = 150
    plt.rcParams['savefig.bbox'] = 'tight'

    pdir = player_dir(player)
    chart_dir = os.path.join(pdir, "charts")
    os.makedirs(chart_dir, exist_ok=True)

    DARK_BG = '#16213e'; AXES_BG = '#1a1a2e'
    def style_ax(ax, fig):
        ax.set_facecolor(AXES_BG); fig.set_facecolor(DARK_BG)
        ax.tick_params(colors='white'); ax.title.set_color('white')
        for s in ax.spines.values(): s.set_color('#444')
        for lbl in [ax.xaxis.label, ax.yaxis.label]: lbl.set_color('white')

    sup_stats = a['sup_stats']
    first_item = a['first_item']

    # Chart 1
    fig, ax = plt.subplots(figsize=(9, max(3, len([c for c,s in sup_stats.items() if s["g"]>=5])*0.5)))
    sup_sorted = sorted([(c, s) for c, s in sup_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"])
    if sup_sorted:
        champs_list = [cn(c) for c, _ in sup_sorted]
        wrs_list = [100*s["w"]/s["g"] for _, s in sup_sorted]
        ns_list = [s["g"] for _, s in sup_sorted]
        colors = ['#e74c3c' if w < 45 else '#f39c12' if w < 55 else '#2ecc71' for w in wrs_list]
        ax.barh(champs_list, wrs_list, color=colors)
        ax.axvline(x=50, color='white', ls='--', alpha=0.5)
        ax.axvline(x=100*wins/total, color='#3498db', ls=':', alpha=0.7, lw=1.5, label=f'整体 ({100*wins/total:.1f}%)')
        for i, (w_val, n) in enumerate(zip(wrs_list, ns_list)):
            ax.text(w_val+1, i, f'{w_val:.0f}% ({n}场)', va='center', fontsize=8, color='white')
        ax.set_xlim(0, 100); ax.set_title(f'{player_label} vs 对面辅助 (≥5场)', fontsize=13, fontweight='bold')
        ax.legend(fontsize=8); ax.invert_yaxis()
    style_ax(ax, fig)
    plt.savefig(f'{chart_dir}/01_vs_support.png'); plt.close()

    # Chart 2
    fig, ax = plt.subplots(figsize=(12, max(3, len([n for n,s in first_item.items() if s["g"]>=5])*0.6)))
    fi_sorted = sorted([(n, s) for n, s in first_item.items() if s["g"] >= 5], key=lambda x: x[1]["w"] - x[1]["exp"])
    if fi_sorted:
        items_list = [n for n, _ in fi_sorted]
        raw_wrs = [100*s["w"]/s["g"] for _, s in fi_sorted]
        adj_wrs = [100*(s["w"]-s["exp"])/s["g"] + 100*wins/total for _, s in fi_sorted]
        y = np.arange(len(items_list)); bar_h = 0.35
        ax.barh(y - bar_h/2, raw_wrs, bar_h, color='#5dade2', alpha=0.8, label='原始胜率')
        ax.barh(y + bar_h/2, adj_wrs, bar_h, color='#2ecc71', alpha=0.8, label='去偏胜率')
        ax.axvline(x=50, color='white', ls='--', alpha=0.3)
        ax.axvline(x=100*wins/total, color='#f39c12', ls=':', alpha=0.7, lw=1.5, label=f'整体 ({100*wins/total:.1f}%)')
        for i, (rw, aw, s_data) in enumerate(zip(raw_wrs, adj_wrs, [s for _,s in fi_sorted])):
            ex = s_data["w"]-s_data["exp"]; sign = "+" if ex >= 0 else ""
            avg_t = sum(s_data["t"])/len(s_data["t"]) if s_data["t"] else 0
            lbl = f'原始 {rw:.0f}% | 去偏 {aw:.0f}% ({sign}{ex:.1f}) | {s_data["g"]}场 | {avg_t:.0f}分'
            ax.text(max(rw, aw)+1, i, lbl, va='center', fontsize=7.5, color='white')
        ax.set_yticks(y); ax.set_yticklabels(items_list)
        ax.set_xlim(0, 110); ax.set_title(f'{player_label} 第一件大件 (≥5场)', fontsize=12, fontweight='bold')
        ax.legend(fontsize=8, loc='lower right'); ax.invert_yaxis()
    style_ax(ax, fig); plt.tight_layout()
    plt.savefig(f'{chart_dir}/02_first_item.png'); plt.close()

    def img_b64(path):
        if not os.path.exists(path): return ""
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()

    # 决策树
    route_data = a['route_data']
    main_keystones = sorted(
        [(ks_zh, sum(1 for r in route_data if r[0] == ks_zh)) for ks_zh in set(r[0] for r in route_data)] if route_data else [],
        key=lambda x: -x[1]
    )

    def build_tree_html():
        html = ""
        for ks_zh, ks_total in main_keystones:
            if ks_total < 10: continue
            ks_wins = sum(r[3] for r in route_data if r[0] == ks_zh)
            ks_exp = sum(r[4] for r in route_data if r[0] == ks_zh)
            ks_adj = 100*(ks_wins - ks_exp)/ks_total + 100*wins/total
            html += f'<div class="tree-root"><div class="node node-rune" style="border-color:{adj_color(ks_adj)}">'
            html += f'<div class="node-title">{ks_zh}</div>'
            html += f'<div class="node-stats">{ks_total}场 | 去偏 {ks_adj:.1f}%</div></div><div class="tree-children">'
            first_items = {}
            for r in route_data:
                if r[0] != ks_zh: continue
                i1 = r[1]
                if i1 not in first_items: first_items[i1] = {"g":0,"w":0,"exp":0.0}
                first_items[i1]["g"] += 1; first_items[i1]["exp"] += r[4]
                if r[3]: first_items[i1]["w"] += 1
            for i1, s1 in sorted(first_items.items(), key=lambda x: -x[1]["g"]):
                if s1["g"] < 5: continue
                adj1 = 100*(s1["w"] - s1["exp"])/s1["g"] + 100*wins/total
                ex1 = s1["w"] - s1["exp"]
                html += f'<div class="tree-branch"><div class="node node-item1" style="border-color:{adj_color(adj1)}">'
                html += f'<div class="node-title">{i1}</div>'
                html += f'<div class="node-stats">{s1["g"]}场 | 原始 {100*s1["w"]/s1["g"]:.0f}% | 去偏 {adj1:.1f}% | {excess_badge(ex1)}</div></div>'
                second_items = {}
                for r in route_data:
                    if r[0] != ks_zh or r[1] != i1 or r[2] is None: continue
                    i2 = r[2]
                    if i2 not in second_items: second_items[i2] = {"g":0,"w":0,"exp":0.0}
                    second_items[i2]["g"] += 1; second_items[i2]["exp"] += r[4]
                    if r[3]: second_items[i2]["w"] += 1
                has_i2 = any(s2["g"] >= 3 for s2 in second_items.values())
                if has_i2:
                    html += '<div class="tree-leaves">'
                    shown_g = 0
                    total_with_i2 = sum(s2["g"] for s2 in second_items.values())
                    no_i2_games = s1["g"] - total_with_i2
                    for i2, s2 in sorted(second_items.items(), key=lambda x: -x[1]["g"]):
                        if s2["g"] < 3: continue
                        adj2 = 100*(s2["w"] - s2["exp"])/s2["g"] + 100*wins/total
                        ex2 = s2["w"] - s2["exp"]
                        html += f'<div class="node node-item2" style="border-color:{adj_color(adj2)}">'
                        html += f'<div class="node-title">{i2}</div>'
                        html += f'<div class="node-stats">{s2["g"]}场 | {100*s2["w"]/s2["g"]:.0f}% → {adj2:.1f}% | {excess_badge(ex2)}</div></div>'
                        shown_g += s2["g"]
                    other_g = total_with_i2 - shown_g
                    if other_g > 0:
                        other_w = sum(s2["w"] for s2 in second_items.values() if s2["g"] < 3)
                        other_lines = "\n".join(f"{i2}: {s2['g']}场 {wr(s2['w'],s2['g'])}" for i2, s2 in sorted(second_items.items(), key=lambda x: -x[1]["g"]) if s2["g"] < 3)
                        html += f'<div class="node node-item2 tip" style="border-color:#666">'
                        html += f'<div class="node-title">其他 <span style="font-size:10px;color:#888">&#9432;</span></div>'
                        html += f'<div class="node-stats">{other_g}场 | {wr(other_w, other_g)}</div>'
                        html += f'<div class="tip-text">{other_lines}</div></div>'
                    if no_i2_games > 0:
                        no_i2_w = sum(r[3] for r in route_data if r[0] == ks_zh and r[1] == i1 and r[2] is None)
                        html += f'<div class="node node-item2" style="border-color:#444">'
                        html += f'<div class="node-title">未出第二件</div>'
                        html += f'<div class="node-stats">{no_i2_games}场 | {wr(no_i2_w, no_i2_games)}</div></div>'
                    html += '</div>'
                html += '</div>'
            html += '</div></div>'
        return html

    # ── 构建 HTML body ──
    html = f'''
<h1>{player_label} 赛娜 (Senna) 分析报告</h1>
<div class="subtitle">{total} 场单双排 | {region_label} 服务器 | 五因子去偏</div>
<div class="overview">
<div class="stat-card"><div class="value" style="color:{wr_color(wins,total)}">{100*wins/total:.1f}%</div><div class="label">胜率 ({wins}/{total})</div></div>
<div class="stat-card"><div class="value">{(avg_k+avg_a)/max(avg_d,1):.2f}</div><div class="label">KDA ({avg_k:.1f}/{avg_d:.1f}/{avg_a:.1f})</div></div>
<div class="stat-card"><div class="value">{avg_dur/60:.0f}分</div><div class="label">场均时长</div></div>
<div class="stat-card"><div class="value">{avg_vs:.0f}</div><div class="label">场均视野分</div></div>
<div class="stat-card"><div class="value">{avg_gold/1000:.1f}k</div><div class="label">场均经济</div></div>
<div class="stat-card"><div class="value">{avg_dmg/1000:.1f}k</div><div class="label">场均伤害</div></div>
</div>
<hr>
<h2>BAN 位推荐</h2>
<h3>对面辅助</h3>
<img src="data:image/png;base64,{img_b64(f"{chart_dir}/01_vs_support.png")}" alt="对面辅助胜率">'''

    # BAN 表
    ban_rows = []
    for c, s in sorted([(c, s) for c, s in sup_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"]):
        w_r = s["w"]/s["g"]; loss = s["g"] * (0.5 - w_r)
        if loss <= 0: continue
        tag = '<span class="badge badge-f">必BAN</span>' if loss >= 1.5 else '<span class="badge badge-d">注意</span>'
        ban_rows.append([tag, cn(c), f'{100*w_r:.0f}%', str(s["g"]), f'+{loss:.1f}场'])
    html += tbl(["优先级","英雄","胜率","场次","预期损失"], ban_rows)

    adc_stats = a['adc_stats']
    html += "<h3>对面 ADC</h3>"
    adc_ban_rows = []
    for c, s in sorted([(c, s) for c, s in adc_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"]):
        w_r = s["w"]/s["g"]; loss = s["g"] * (0.5 - w_r)
        if loss <= 0: continue
        tag = '<span class="badge badge-f">必BAN</span>' if loss >= 1.5 else '<span class="badge badge-d">注意</span>'
        adc_ban_rows.append([tag, cn(c), f'{100*w_r:.0f}%', str(s["g"])])
    html += tbl(["优先级","英雄","胜率","场次"], adc_ban_rows)

    enemy_jg_stats = a['enemy_jg_stats']
    html += "<h3>对面打野</h3>"
    ejg_ban_rows = []
    for c, s in sorted([(c, s) for c, s in enemy_jg_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"]):
        w_r = s["w"]/s["g"]; loss = s["g"] * (0.5 - w_r)
        if loss <= 0: continue
        tag = '<span class="badge badge-f">必BAN</span>' if loss >= 1.5 else '<span class="badge badge-d">注意</span>'
        ejg_ban_rows.append([tag, cn(c), f'{100*w_r:.0f}%', str(s["g"]), f'+{loss:.1f}场'])
    html += tbl(["优先级","英雄","胜率","场次","预期损失"], ejg_ban_rows)

    # 队友 ADC
    ally_stats = a['ally_stats']
    html += "<hr><h2>队友 ADC 搭配</h2>"
    ally_rows = []
    for c, s in sorted([(c, s) for c, s in ally_stats.items() if s["g"] >= 5], key=lambda x: -x[1]["w"]/x[1]["g"]):
        w_r = 100*s["w"]/s["g"]; n = s["g"]
        tier_cls = "badge-s" if w_r >= 60 else "badge-a" if w_r >= 50 else "badge-d" if w_r >= 40 else "badge-f"
        tier = "S" if w_r >= 60 else "A" if w_r >= 50 else "D" if w_r >= 40 else "F"
        kda = f'{s["k"]/n:.1f}/{s["d"]/n:.1f}/{s["a"]/n:.1f}'
        ally_rows.append([f'<span class="badge {tier_cls}">{tier}</span>', cn(c), wr(s["w"], n), str(n), kda])
    html += tbl(["评级","ADC","胜率","场次","KDA"], ally_rows)

    # 出装
    html += '<hr><h2>出装路线</h2><h3>第一件大件</h3>'
    html += '<blockquote>去偏胜率基于 lolalytics 翡翠+ 大样本数据，综合五因子计算期望胜率。</blockquote>'
    html += f'<img src="data:image/png;base64,{img_b64(f"{chart_dir}/02_first_item.png")}" alt="第一件大件胜率">'

    fi_rows = []
    for name, s in sorted(first_item.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"])):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        avg_t = sum(s["t"])/len(s["t"]) if s["t"] else 0
        fi_rows.append([name, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"]), f'{avg_t:.1f}分'])
    html += tbl(["装备","原始胜率","去偏胜率","超额胜场","场次","完成时间"], fi_rows)

    two_item = a['two_item']
    html += "<h3>前两件组合 (≥3场)</h3>"
    ti_rows = []
    for name, s in sorted(two_item.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        ti_rows.append([name, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["出装路线","原始胜率","去偏胜率","超额","场次"], ti_rows)

    boots_st = a['boots_st']
    html += "<h3>鞋子</h3>"
    boot_rows = []
    for name, s in sorted(boots_st.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        boot_rows.append([name, wr(s["w"], s["g"]), str(s["g"])])
    html += tbl(["鞋子","胜率","场次"], boot_rows)

    # 符文
    keystone_stats = a['keystone_stats']
    html += "<hr><h2>符文分析</h2><h3>基石符文</h3>"
    ks_rows = []
    for rid, s in sorted(keystone_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        ks_rows.append([rune_zh(rid), wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["基石","原始胜率","去偏胜率","超额","场次"], ks_rows)

    tree_combo_stats = a['tree_combo_stats']
    html += "<h3>主系 + 副系</h3>"
    tc_rows = []
    for combo, s in sorted(tree_combo_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        tc_rows.append([combo, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["系别组合","原始胜率","去偏胜率","超额","场次"], tc_rows)

    rune_item_stats = a['rune_item_stats']
    html += "<h3>符文 + 首件联动</h3>"
    ri_rows = []
    for combo, s in sorted(rune_item_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 5: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        ri_rows.append([combo, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["基石 + 首件","原始胜率","去偏胜率","超额","场次"], ri_rows)

    # 决策树
    html += '<hr><h2>出装路线决策树</h2>'
    html += '<blockquote>按 <b>基石符文 → 第1件 → 第2件</b> 路线分析。颜色：<span style="color:#2ecc71">■</span> ≥65% | <span style="color:#f39c12">■</span> 55-65% | <span style="color:#e74c3c">■</span> &lt;55%</blockquote>'
    html += build_tree_html()

    # 孤儿小件
    orphan_stats = a['orphan_stats']
    orphan_game_count = a['orphan_game_count']
    html += f'<hr><h2>出装犹豫分析（孤儿小件）</h2>'
    html += f'<blockquote>在 {orphan_game_count}/{total} 场（{100*orphan_game_count/total:.0f}%）中买了不在合成路线内的小件。</blockquote>'
    orph_rows = []
    for name, s in sorted(orphan_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        orph_rows.append([name, str(s["g"]), wr(s["w"], s["g"])])
    html += tbl(["孤儿小件","出现次数","出现时胜率"], orph_rows)

    # 游走
    roam_data = a['roam_data']
    html += "<hr><h2>游走主动性</h2>"
    roam_rows = [
        ["我先游走", wr(roam_data["me_first_w"], roam_data["me_first_n"]), str(roam_data["me_first_n"])],
        ["对方先游走", wr(roam_data["en_first_w"], roam_data["en_first_n"]), str(roam_data["en_first_n"])],
        ["都没游走/同时", wr(roam_data["none_w"], roam_data["none_n"]), str(roam_data["none_n"])],
    ]
    html += tbl(["场景","胜率","场次"], roam_rows)

    dur_data = a['dur_data']
    html += "<h3>对局时长</h3>"
    dur_rows = [[l, wr(w_val,n), str(n)] for l,w_val,n in dur_data]
    html += tbl(["时长","胜率","场次"], dur_rows)

    # 对位详情
    html += "<hr><h2>对面辅助详细对位 (≥3场)</h2>"
    sup_rows = []
    for c, s in sorted(sup_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        n = s["g"]; kda = f'{s["k"]/n:.1f}/{s["d"]/n:.1f}/{s["a"]/n:.1f}'
        sup_rows.append([cn(c), wr(s["w"], n), str(n), kda])
    html += tbl(["英雄","胜率","场次","KDA"], sup_rows)

    html += "<h2>对面 ADC 详细对位 (≥3场)</h2>"
    adc_rows = []
    for c, s in sorted(adc_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adc_rows.append([cn(c), wr(s["w"], s["g"]), str(s["g"])])
    html += tbl(["英雄","胜率","场次"], adc_rows)

    html += "<h2>对面打野详细对位 (≥3场)</h2>"
    ejg_rows = []
    for c, s in sorted(enemy_jg_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        ejg_rows.append([cn(c), wr(s["w"], s["g"]), str(s["g"])])
    html += tbl(["英雄","胜率","场次"], ejg_rows)

    ally_jg_stats = a['ally_jg_stats']
    html += "<h2>己方打野搭配 (≥3场)</h2>"
    ajg_rows = []
    for c, s in sorted(ally_jg_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        ajg_rows.append([cn(c), wr(s["w"], s["g"]), str(s["g"])])
    html += tbl(["英雄","胜率","场次"], ajg_rows)

    return html


# ══════════════════════════════════════════
# 总结分析页
# ══════════════════════════════════════════

def generate_summary(all_analyses):
    """生成跨玩家总结分析页"""
    html = '<h1>赛娜 OTP 综合分析报告</h1>'
    html += f'<div class="subtitle">8位高段位赛娜单招玩家 | 共 {sum(a["total"] for a in all_analyses)} 场单双排 | 五因子去偏</div>'

    # ── 1. 玩家概览对比 ──
    html += '<h2>玩家概览对比</h2>'
    overview_rows = []
    for a in sorted(all_analyses, key=lambda x: -x['wr']):
        p = a['player']
        label = f"{p['name']}#{p['tag']}"
        kda = (a['avg_k'] + a['avg_a']) / max(a['avg_d'], 1)
        overview_rows.append([
            label, p['region'], str(a['total']),
            f'<span style="color:{wr_color(a["wins"], a["total"])}">{100*a["wr"]:.1f}%</span>',
            f'{kda:.2f}',
            f'{a["avg_k"]:.1f}/{a["avg_d"]:.1f}/{a["avg_a"]:.1f}',
            f'{a["avg_vs"]:.0f}',
            f'{a["avg_gold"]/1000:.1f}k',
            f'{a["avg_dmg"]/1000:.1f}k',
            f'{a["avg_dur"]/60:.0f}分',
        ])
    html += tbl(["玩家","服务器","场次","胜率","KDA","场均K/D/A","视野分","经济","伤害","时长"], overview_rows)

    # ── 2. 共识 BAN 位 ──
    html += '<hr><h2>共识 BAN 位推荐</h2>'
    html += '<blockquote>综合8位玩家数据，按加权预期损失排序。「投票」= 有多少位玩家对该英雄胜率低于 50%（≥5场）。</blockquote>'

    for role, stats_key, role_name in [
        ('sup', 'sup_stats', '对面辅助'),
        ('adc', 'adc_stats', '对面 ADC'),
        ('jg', 'enemy_jg_stats', '对面打野'),
    ]:
        html += f'<h3>{role_name}</h3>'
        agg = defaultdict(lambda: {"g":0, "w":0, "voters":0, "loss":0.0})
        for a in all_analyses:
            for c, s in a[stats_key].items():
                if s["g"] < 3: continue
                agg[c]["g"] += s["g"]
                agg[c]["w"] += s["w"]
                if s["g"] >= 5 and s["w"]/s["g"] < 0.50:
                    agg[c]["voters"] += 1
                    agg[c]["loss"] += s["g"] * (0.5 - s["w"]/s["g"])
        ban_rows = []
        for c, s in sorted(agg.items(), key=lambda x: -x[1]["loss"]):
            if s["g"] < 15 or s["loss"] <= 0: continue
            overall_wr = s["w"]/s["g"]
            urgency = "必BAN" if s["voters"] >= 3 and s["loss"] >= 5 else "高优" if s["voters"] >= 2 and s["loss"] >= 3 else "注意"
            badge_cls = "badge-f" if urgency == "必BAN" else "badge-d" if urgency == "高优" else "badge-a"
            ban_rows.append([
                f'<span class="badge {badge_cls}">{urgency}</span>',
                cn(c), f'{100*overall_wr:.0f}%', str(s["g"]),
                f'{s["voters"]}/8', f'+{s["loss"]:.1f}场'
            ])
        html += tbl(["优先级","英雄","综合胜率","总场次","投票","总预期损失"], ban_rows[:15])

    # ── 3. 最优出装共识 ──
    html += '<hr><h2>出装共识</h2>'
    html += '<blockquote>跨玩家聚合，按去偏超额胜场排序。仅显示总场次 ≥15 的装备。</blockquote>'

    html += '<h3>第一件大件</h3>'
    agg_fi = defaultdict(lambda: {"g":0,"w":0,"exp":0.0,"t":[]})
    total_games = sum(a['total'] for a in all_analyses)
    total_wins = sum(a['wins'] for a in all_analyses)
    overall_wr = total_wins / total_games

    for a in all_analyses:
        for name, s in a['first_item'].items():
            agg_fi[name]["g"] += s["g"]
            agg_fi[name]["w"] += s["w"]
            agg_fi[name]["exp"] += s["exp"]
            agg_fi[name]["t"].extend(s["t"])

    fi_rows = []
    for name, s in sorted(agg_fi.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"])):
        if s["g"] < 15: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*overall_wr
        excess = s["w"] - s["exp"]
        avg_t = sum(s["t"])/len(s["t"]) if s["t"] else 0
        # 统计多少玩家用过
        users = sum(1 for a in all_analyses if name in a['first_item'] and a['first_item'][name]["g"] >= 3)
        fi_rows.append([
            name, wr(s["w"], s["g"]),
            f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
            excess_badge(excess), str(s["g"]), f'{users}/8', f'{avg_t:.1f}分'
        ])
    html += tbl(["装备","原始胜率","去偏胜率","超额胜场","总场次","使用人数","平均完成"], fi_rows)

    # 前两件
    html += '<h3>前两件组合 (≥10场)</h3>'
    agg_ti = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    for a in all_analyses:
        for name, s in a['two_item'].items():
            agg_ti[name]["g"] += s["g"]
            agg_ti[name]["w"] += s["w"]
            agg_ti[name]["exp"] += s["exp"]
    ti_rows = []
    for name, s in sorted(agg_ti.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"])):
        if s["g"] < 10: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*overall_wr
        excess = s["w"] - s["exp"]
        ti_rows.append([name, wr(s["w"], s["g"]),
                        f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["出装路线","原始胜率","去偏胜率","超额","总场次"], ti_rows[:20])

    # 鞋子
    html += '<h3>鞋子</h3>'
    agg_boot = defaultdict(lambda: {"g":0,"w":0})
    for a in all_analyses:
        for name, s in a['boots_st'].items():
            agg_boot[name]["g"] += s["g"]
            agg_boot[name]["w"] += s["w"]
    boot_rows = []
    for name, s in sorted(agg_boot.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 10: continue
        boot_rows.append([name, wr(s["w"], s["g"]), str(s["g"])])
    html += tbl(["鞋子","综合胜率","总场次"], boot_rows)

    # ── 4. 符文共识 ──
    html += '<hr><h2>符文共识</h2>'

    html += '<h3>基石符文</h3>'
    agg_ks = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    for a in all_analyses:
        for rid, s in a['keystone_stats'].items():
            agg_ks[rid]["g"] += s["g"]
            agg_ks[rid]["w"] += s["w"]
            agg_ks[rid]["exp"] += s["exp"]
    ks_rows = []
    for rid, s in sorted(agg_ks.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 10: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*overall_wr
        excess = s["w"] - s["exp"]
        users = sum(1 for a in all_analyses if rid in a['keystone_stats'] and a['keystone_stats'][rid]["g"] >= 5)
        ks_rows.append([rune_zh(rid), wr(s["w"], s["g"]),
                        f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"]), f'{users}/8'])
    html += tbl(["基石","原始胜率","去偏胜率","超额","总场次","使用人数"], ks_rows)

    html += '<h3>主系 + 副系</h3>'
    agg_tc = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    for a in all_analyses:
        for combo, s in a['tree_combo_stats'].items():
            agg_tc[combo]["g"] += s["g"]
            agg_tc[combo]["w"] += s["w"]
            agg_tc[combo]["exp"] += s["exp"]
    tc_rows = []
    for combo, s in sorted(agg_tc.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 15: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*overall_wr
        excess = s["w"] - s["exp"]
        tc_rows.append([combo, wr(s["w"], s["g"]),
                        f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["系别组合","原始胜率","去偏胜率","超额","总场次"], tc_rows)

    # 符文 + 首件联动
    html += '<h3>符文 + 首件联动 (≥15场)</h3>'
    agg_ri = defaultdict(lambda: {"g":0,"w":0,"exp":0.0})
    for a in all_analyses:
        for combo, s in a['rune_item_stats'].items():
            agg_ri[combo]["g"] += s["g"]
            agg_ri[combo]["w"] += s["w"]
            agg_ri[combo]["exp"] += s["exp"]
    ri_rows = []
    for combo, s in sorted(agg_ri.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"])):
        if s["g"] < 15: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*overall_wr
        excess = s["w"] - s["exp"]
        ri_rows.append([combo, wr(s["w"], s["g"]),
                        f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html += tbl(["基石 + 首件","原始胜率","去偏胜率","超额","总场次"], ri_rows[:15])

    # ── 5. 游走习惯对比 ──
    html += '<hr><h2>游走主动性对比</h2>'
    roam_rows = []
    for a in sorted(all_analyses, key=lambda x: -x['wr']):
        p = a['player']
        label = f"{p['name']}#{p['tag']}"
        rd = a['roam_data']
        total_roam = rd["me_first_n"] + rd["en_first_n"] + rd["none_n"]
        me_pct = 100*rd["me_first_n"]/total_roam if total_roam else 0
        me_wr = 100*rd["me_first_w"]/rd["me_first_n"] if rd["me_first_n"] else 0
        en_wr = 100*rd["en_first_w"]/rd["en_first_n"] if rd["en_first_n"] else 0
        roam_rows.append([
            label, f'{me_pct:.0f}%',
            f'<span style="color:{wr_color(rd["me_first_w"], rd["me_first_n"])}">{me_wr:.0f}%</span>',
            f'<span style="color:{wr_color(rd["en_first_w"], rd["en_first_n"])}">{en_wr:.0f}%</span>',
            f'{me_wr - en_wr:+.0f}%' if rd["me_first_n"] and rd["en_first_n"] else "N/A",
        ])
    html += tbl(["玩家","先游走率","先游走时胜率","对方先游走时胜率","胜率差"], roam_rows)

    # ── 6. 对局时长 ──
    html += '<hr><h2>对局时长分析</h2>'
    dur_agg = defaultdict(lambda: {"w":0,"n":0})
    for a in all_analyses:
        for label, w, n in a['dur_data']:
            dur_agg[label]["w"] += w
            dur_agg[label]["n"] += n

    dur_rows = []
    for label in ["短局 (15-25分)", "中局 (25-35分)", "长局 (35分+)"]:
        s = dur_agg[label]
        if s["n"] == 0: continue
        dur_rows.append([label, wr(s["w"], s["n"]), str(s["n"])])
    html += tbl(["时长","综合胜率","总场次"], dur_rows)

    # 各玩家时长偏好
    html += '<h3>各玩家时长胜率对比</h3>'
    dur_player_rows = []
    for a in sorted(all_analyses, key=lambda x: -x['wr']):
        p = a['player']
        label = f"{p['name']}#{p['tag']}"
        cells = [label]
        for dur_label in ["短局 (15-25分)", "中局 (25-35分)", "长局 (35分+)"]:
            found = [d for d in a['dur_data'] if d[0] == dur_label]
            if found:
                _, w, n = found[0]
                cells.append(f'<span style="color:{wr_color(w, n)}">{100*w/n:.0f}%</span> ({n})')
            else:
                cells.append("N/A")
        dur_player_rows.append(cells)
    html += tbl(["玩家","短局","中局","长局"], dur_player_rows)

    # ── 7. 出装风格聚类 ──
    html += '<hr><h2>出装风格画像</h2>'
    html += '<blockquote>每位玩家最常用的基石符文和首件大件组合。</blockquote>'

    style_rows = []
    for a in sorted(all_analyses, key=lambda x: -x['wr']):
        p = a['player']
        label = f"{p['name']}#{p['tag']}"
        # 最常用基石
        top_ks = sorted(a['keystone_stats'].items(), key=lambda x: -x[1]["g"])
        ks_str = ""
        for rid, s in top_ks[:2]:
            if s["g"] < 5: continue
            pct = 100*s["g"]/a['total']
            adj = 100*(s["w"]-s["exp"])/s["g"] + 100*a["wr"]
            ks_str += f'{rune_zh(rid)} ({pct:.0f}%, 去偏{adj:.0f}%) '
        # 最常用首件
        top_fi = sorted(a['first_item'].items(), key=lambda x: -x[1]["g"])
        fi_str = ""
        for name, s in top_fi[:3]:
            if s["g"] < 5: continue
            pct = 100*s["g"]/a['total']
            fi_str += f'{name} ({pct:.0f}%) '
        # 孤儿率
        orphan_pct = 100*a['orphan_game_count']/a['total']
        style_rows.append([label, ks_str.strip(), fi_str.strip(), f'{orphan_pct:.0f}%'])
    html += tbl(["玩家","主力基石","主力首件","犹豫率"], style_rows)

    # ── 8. 分析结论 ──
    html += '<hr><h2>分析结论与建议</h2>'

    # 计算关键数据用于结论
    # 最佳首件
    best_fi = sorted(agg_fi.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"]))
    best_fi_filtered = [(n,s) for n,s in best_fi if s["g"] >= 30]

    # 最佳基石
    best_ks = sorted(agg_ks.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"]))
    best_ks_filtered = [(rid,s) for rid,s in best_ks if s["g"] >= 50]

    # 共识必BAN
    agg_sup_ban = defaultdict(lambda: {"g":0,"w":0,"voters":0,"loss":0.0})
    for a in all_analyses:
        for c, s in a['sup_stats'].items():
            if s["g"] < 3: continue
            agg_sup_ban[c]["g"] += s["g"]; agg_sup_ban[c]["w"] += s["w"]
            if s["g"] >= 5 and s["w"]/s["g"] < 0.50:
                agg_sup_ban[c]["voters"] += 1
                agg_sup_ban[c]["loss"] += s["g"] * (0.5 - s["w"]/s["g"])
    top_bans = sorted(agg_sup_ban.items(), key=lambda x: -x[1]["loss"])[:5]
    top_bans = [(c,s) for c,s in top_bans if s["loss"] >= 3]

    # 游走结论
    total_me_first = sum(a['roam_data']['me_first_n'] for a in all_analyses)
    total_me_first_w = sum(a['roam_data']['me_first_w'] for a in all_analyses)
    total_en_first = sum(a['roam_data']['en_first_n'] for a in all_analyses)
    total_en_first_w = sum(a['roam_data']['en_first_w'] for a in all_analyses)
    me_first_wr = 100*total_me_first_w/total_me_first if total_me_first else 0
    en_first_wr = 100*total_en_first_w/total_en_first if total_en_first else 0

    html += '<div class="conclusion">'

    # 1. 出装结论
    html += '<h3>1. 最优出装路线</h3>'
    if best_fi_filtered:
        html += '<p>'
        for i, (name, s) in enumerate(best_fi_filtered[:3]):
            adj = 100*(s["w"]-s["exp"])/s["g"] + 100*overall_wr
            excess = s["w"]-s["exp"]
            avg_t = sum(s["t"])/len(s["t"]) if s["t"] else 0
            rank = ["最优", "次优", "第三"][i] if i < 3 else ""
            html += f'<b>{rank}首件：{name}</b> — {s["g"]}场，去偏胜率 {adj:.1f}%，超额 {excess:+.1f} 场，平均 {avg_t:.0f} 分完成。<br>'
        html += '</p>'

    # 2. 符文结论
    html += '<h3>2. 最优符文选择</h3>'
    if best_ks_filtered:
        html += '<p>'
        for rid, s in best_ks_filtered[:3]:
            adj = 100*(s["w"]-s["exp"])/s["g"] + 100*overall_wr
            excess = s["w"]-s["exp"]
            users = sum(1 for a in all_analyses if rid in a['keystone_stats'] and a['keystone_stats'][rid]["g"] >= 5)
            html += f'<b>{rune_zh(rid)}</b> — {s["g"]}场 ({users}/8人使用)，去偏胜率 {adj:.1f}%，超额 {excess:+.1f} 场。<br>'
        html += '</p>'

    # 3. BAN位结论
    html += '<h3>3. 必BAN英雄</h3>'
    if top_bans:
        html += '<p>'
        for c, s in top_bans:
            overall = 100*s["w"]/s["g"]
            html += f'<b>{cn(c)}</b> — 综合胜率仅 {overall:.0f}%（{s["g"]}场），{s["voters"]}/8位玩家胜率不足50%，总预期损失 {s["loss"]:.1f} 场。<br>'
        html += '</p>'
    else:
        html += '<p>暂无强烈共识的必BAN辅助英雄。</p>'

    # 4. 游走结论
    html += '<h3>4. 游走策略</h3>'
    html += f'<p>赛娜先游走时综合胜率 <b>{me_first_wr:.0f}%</b>（{total_me_first}场），'
    html += f'对方先游走时胜率 <b>{en_first_wr:.0f}%</b>（{total_en_first}场）。'
    roam_diff = me_first_wr - en_first_wr
    if roam_diff > 5:
        html += f'<br>先游走带来 <span style="color:#2ecc71"><b>+{roam_diff:.0f}%</b></span> 胜率优势，建议积极寻找游走时机。</p>'
    elif roam_diff > 0:
        html += f'<br>先游走有 <span style="color:#f39c12">+{roam_diff:.0f}%</span> 的微弱优势。</p>'
    else:
        html += f'<br>先游走对赛娜胜率影响不大，可根据对线情况灵活决策。</p>'

    # 5. 时长结论
    html += '<h3>5. 对局节奏</h3>'
    html += '<p>'
    for label in ["短局 (15-25分)", "中局 (25-35分)", "长局 (35分+)"]:
        s = dur_agg[label]
        if s["n"]:
            html += f'{label}：综合胜率 <span style="color:{wr_color(s["w"], s["n"])}">{100*s["w"]/s["n"]:.0f}%</span>（{s["n"]}场）。'
    html += '</p>'
    # 找出最强时段
    best_dur = max(dur_agg.items(), key=lambda x: x[1]["w"]/x[1]["n"] if x[1]["n"] else 0)
    worst_dur = min(dur_agg.items(), key=lambda x: x[1]["w"]/x[1]["n"] if x[1]["n"] else 1)
    if best_dur[1]["n"] and worst_dur[1]["n"]:
        best_pct = 100*best_dur[1]["w"]/best_dur[1]["n"]
        worst_pct = 100*worst_dur[1]["w"]/worst_dur[1]["n"]
        if best_pct - worst_pct > 3:
            html += f'<p>赛娜在<b>{best_dur[0]}</b>表现最佳（{best_pct:.0f}%），在<b>{worst_dur[0]}</b>相对较弱（{worst_pct:.0f}%）。'
            if "短" in best_dur[0]:
                html += '说明赛娜在早期节奏快的对局中更有优势，建议把握前期窗口期。'
            elif "长" in best_dur[0]:
                html += '说明赛娜后期成长性强，被动叠层带来的收益在长局中更明显。'
            html += '</p>'

    # 6. 综合建议
    html += '<h3>6. 综合建议</h3>'
    html += '<p>'
    html += '基于8位高段位赛娜单招玩家共 {:,} 场单双排数据的综合分析：'.format(total_games)
    html += '</p><ul>'

    if best_fi_filtered:
        html += f'<li><b>首件推荐</b>：{best_fi_filtered[0][0]}（去偏胜率最高），'
        if len(best_fi_filtered) > 1:
            html += f'备选 {best_fi_filtered[1][0]}。'
        html += '</li>'

    if best_ks_filtered:
        html += f'<li><b>基石推荐</b>：{rune_zh(best_ks_filtered[0][0])}（最多OTP使用且去偏胜率领先）。'
        if len(best_ks_filtered) > 1:
            html += f' {rune_zh(best_ks_filtered[1][0])}也是可行选择。'
        html += '</li>'

    if top_bans:
        ban_names = "、".join(cn(c) for c, _ in top_bans[:3])
        html += f'<li><b>BAN位优先</b>：{ban_names}。</li>'

    if roam_diff > 3:
        html += '<li><b>游走</b>：数据支持积极先游走，先手游走的胜率显著高于被动应对。</li>'

    html += '<li><b>犹豫出装</b>：'
    avg_orphan = sum(a['orphan_game_count'] for a in all_analyses) / sum(a['total'] for a in all_analyses) * 100
    if avg_orphan > 20:
        html += f'平均 {avg_orphan:.0f}% 的对局出现孤儿小件，说明出装犹豫较为常见。建议提前规划好出装路线，减少中途换路线。'
    else:
        html += f'平均仅 {avg_orphan:.0f}% 出现孤儿小件，整体出装决心较好。'
    html += '</li>'

    html += '</ul>'
    html += '</div>'

    return html


# ══════════════════════════════════════════
# 主函数
# ══════════════════════════════════════════

CSS = '''
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#0f0f1a; color:#e0e0e0; font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; padding:0; line-height:1.6; }
.tab-bar { position:sticky; top:0; z-index:100; background:#0a0a15; display:flex; flex-wrap:wrap; gap:0; border-bottom:2px solid #333; padding:0 10px; }
.tab-btn { background:transparent; color:#888; border:none; padding:12px 18px; cursor:pointer; font-size:14px; font-family:inherit; border-bottom:3px solid transparent; transition:all 0.2s; white-space:nowrap; }
.tab-btn:hover { color:#e0e0e0; background:#1a1a2e; }
.tab-btn.active { color:#3498db; border-bottom-color:#3498db; font-weight:bold; }
.tab-panel { display:none; padding:20px; max-width:1200px; margin:0 auto; }
.tab-panel.active { display:block; }
h1 { color:#3498db; border-bottom:2px solid #3498db; padding-bottom:10px; margin:30px 0 15px; }
h2 { color:#2ecc71; margin:25px 0 12px; border-left:4px solid #2ecc71; padding-left:12px; }
h3 { color:#f39c12; margin:18px 0 8px; }
.subtitle { color:#888; font-size:14px; margin-bottom:20px; }
.overview { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:12px; margin:15px 0; }
.stat-card { background:#1a1a2e; border-radius:8px; padding:15px; text-align:center; border:1px solid #333; }
.stat-card .value { font-size:24px; font-weight:bold; color:#3498db; }
.stat-card .label { font-size:12px; color:#888; margin-top:4px; }
table { width:100%; border-collapse:collapse; margin:12px 0; background:#1a1a2e; border-radius:8px; overflow:hidden; }
th { background:#16213e; padding:10px 12px; text-align:left; font-size:13px; color:#3498db; white-space:nowrap; }
td { padding:8px 12px; border-top:1px solid #222; font-size:13px; }
tr:hover { background:#1e2a4a; }
img { max-width:100%; border-radius:8px; margin:10px 0; }
blockquote { border-left:3px solid #f39c12; padding:8px 15px; margin:10px 0; background:#1a1a2e; border-radius:0 8px 8px 0; color:#ccc; font-size:13px; }
hr { border:none; border-top:1px solid #333; margin:25px 0; }
.badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; }
.badge-s { background:#2ecc71; color:#000; } .badge-a { background:#f39c12; color:#000; }
.badge-d { background:#e67e22; color:#fff; } .badge-f { background:#e74c3c; color:#fff; }
.tree-root { margin:20px 0; }
.tree-children { display:flex; flex-wrap:wrap; gap:15px; margin-left:30px; padding-left:15px; border-left:2px solid #333; }
.tree-branch { margin:8px 0; }
.tree-leaves { display:flex; flex-wrap:wrap; gap:8px; margin-left:25px; padding-left:12px; border-left:2px dashed #444; margin-top:8px; }
.node { border-radius:8px; padding:10px 15px; background:#1a1a2e; border-left:4px solid; min-width:180px; }
.node-rune { background:#16213e; font-size:16px; }
.node-rune .node-title { font-size:18px; font-weight:bold; }
.node-item1 .node-title { font-size:14px; font-weight:bold; }
.node-item2 { padding:8px 12px; } .node-item2 .node-title { font-size:13px; }
.node-stats { font-size:11px; color:#aaa; margin-top:3px; }
.tip { position:relative; cursor:help; }
.tip .tip-text { visibility:hidden; background:#222; color:#ddd; padding:6px 10px; border-radius:6px; font-size:12px; white-space:pre-line; position:absolute; z-index:10; bottom:110%; left:0; min-width:200px; box-shadow:0 2px 8px rgba(0,0,0,.5); }
.tip:hover .tip-text { visibility:visible; }
.conclusion { background:#1a1a2e; border-radius:12px; padding:20px 25px; margin:15px 0; border:1px solid #333; }
.conclusion h3 { color:#3498db; margin-top:15px; }
.conclusion p { margin:8px 0; line-height:1.8; }
.conclusion ul { margin:8px 0 8px 25px; }
.conclusion li { margin:6px 0; line-height:1.7; }
.footer { text-align:center; color:#666; font-size:12px; margin-top:30px; padding:15px; }
'''

JS = '''
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelector('[data-tab="'+id+'"]').classList.add('active');
}
'''


def main():
    global ITEMS, CHAMPS, RUNES, ITEM_COMPONENTS

    print("加载静态数据...")
    static_data = load_static_data()
    lola = load_lolalytics()
    ITEMS = static_data['items']
    CHAMPS = static_data['champs']
    RUNES = static_data['runes']
    ITEM_COMPONENTS = static_data['item_components']

    # 加载所有玩家数据
    all_analyses = []
    for player in PLAYERS:
        label = f"{player['name']}#{player['tag']}"
        pdir = player_dir(player)
        cache_path = os.path.join(pdir, 'match_data.json')
        if not os.path.exists(cache_path):
            print(f"  跳过 {label} (无缓存)")
            continue
        print(f"加载 {label}...")
        with open(cache_path) as f:
            games = json.load(f)
        print(f"  {len(games)} 场比赛，开始分析...")
        a = analyze_player(player, games, lola)
        if a:
            all_analyses.append(a)
            print(f"  完成: {a['total']}场, 胜率 {100*a['wr']:.1f}%")

    if not all_analyses:
        sys.exit("无玩家数据")

    print(f"\n共 {len(all_analyses)} 位玩家数据加载完成")

    # 生成总结
    print("生成总结分析...")
    summary_html = generate_summary(all_analyses)

    # 生成各玩家报告 body
    print("生成各玩家报告...")
    player_bodies = []
    for a in all_analyses:
        p = a['player']
        label = f"{p['name']}#{p['tag']}"
        print(f"  生成 {label} 报告...")
        body = generate_player_body(a)
        player_bodies.append((label, body))

    # 组装最终 HTML
    print("组装综合报告...")
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>赛娜 OTP 综合分析</title>
<style>{CSS}</style>
</head>
<body>

<div class="tab-bar">
<button class="tab-btn active" data-tab="summary" onclick="switchTab('summary')">总结分析</button>
'''
    for i, (label, _) in enumerate(player_bodies):
        html += f'<button class="tab-btn" data-tab="player_{i}" onclick="switchTab(\'player_{i}\')">{label}</button>\n'
    html += '</div>\n'

    html += f'<div id="summary" class="tab-panel active">{summary_html}'
    html += '<div class="footer">数据来源: SGP Timeline API + lolalytics 翡翠+ 五因子去偏 | 小样本 (&lt;10场) 仅供参考</div></div>\n'

    for i, (label, body) in enumerate(player_bodies):
        html += f'<div id="player_{i}" class="tab-panel">{body}'
        html += '<div class="footer">数据来源: SGP Timeline API + lolalytics 翡翠+ 五因子去偏 | 小样本 (&lt;10场) 仅供参考</div></div>\n'

    html += f'<script>{JS}</script>\n</body></html>'

    out_path = os.path.join(OUTPUT_BASE, 'combined-report.html')
    with open(out_path, 'w') as f:
        f.write(html)

    print(f"\n综合报告已保存: {out_path}")
    print(f"文件大小: {os.path.getsize(out_path)/1024:.0f} KB")


if __name__ == '__main__':
    main()
