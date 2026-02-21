#!/usr/bin/env python3
"""
赛娜 OTP 通用分析器
===================
用法:
  python3 senna-otp-analyzer.py                   # 分析所有预定义玩家
  python3 senna-otp-analyzer.py --player "Name#Tag"  # 分析指定玩家
  python3 senna-otp-analyzer.py --fetch-only       # 仅获取数据不生成报告
  python3 senna-otp-analyzer.py --report-only      # 仅从缓存数据生成报告

数据缓存在 scripts/support-analysis-output/players/{name}_{tag}/ 目录下，
重复运行不会重新获取已缓存的数据。
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import urllib3
urllib3.disable_warnings()

# ══════════════════════════════════════════
# 配置
# ══════════════════════════════════════════

PLAYERS = [
    {"name": "Senna LF Nilah", "tag": "Duo",  "region": "NA",  "puuid": "35c5c764-d4b9-56aa-a049-a517e1ddae14"},
    {"name": "Eternal life",    "tag": "5753", "region": "NA",  "puuid": "fd3d91c6-9245-51d6-bfec-ac1c42ff60af"},
    {"name": "emiyaa",          "tag": "1389", "region": "NA",  "puuid": "84d02ea7-67dd-5c34-aaaa-5c1ef472ea4e"},
    {"name": "LeChase",         "tag": "EUW",  "region": "EUW", "puuid": "3cf13368-7aae-5810-8cb1-6b7373a8646a"},
    {"name": "sindrelolpro2345","tag": "EUW",  "region": "EUW", "puuid": "cdf556b4-b595-55ee-87aa-a4e0b7cb9ec7"},
    {"name": "Oh0Tech",         "tag": "KR1",  "region": "KR",  "puuid": "c307ae41-ff08-5f2d-84fe-d4ea0596c8a4"},
    {"name": "Komaeda NGI",     "tag": "EUW",  "region": "EUW", "puuid": "07e7081c-84a3-5267-aabf-7b7ec8caf690"},
    {"name": "4IM",             "tag": "1tsme","region": "EUW", "puuid": "37b1fb69-8f27-5f71-bf21-00f411971b3c"},
]

SGP_REGIONS = {
    "NA":  {"base": "https://usw2-red.pp.sgp.pvp.net",  "platform": "NA1"},
    "EUW": {"base": "https://euc1-red.pp.sgp.pvp.net",  "platform": "EUW1"},
    "KR":  {"base": "https://apne1-red.pp.sgp.pvp.net", "platform": "KR"},
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_BASE = os.path.join(SCRIPT_DIR, "support-analysis-output")
PLAYERS_DIR = os.path.join(OUTPUT_BASE, "players")

INTERESTING_EVENTS = {
    "ITEM_PURCHASED", "CHAMPION_KILL", "WARD_PLACED", "WARD_KILL",
    "ELITE_MONSTER_KILL", "BUILDING_KILL", "TURRET_PLATE_DESTROYED",
}

BOOT_IDS = {3009, 3006, 3020, 3047, 3111, 3158, 3117}
STARTER = {3865, 3866, 3867, 3858, 3859, 3860, 3862, 3863, 3864, 3869, 3870, 3871, 3876, 3877}
CONSUMABLE = {2003, 2004, 2031, 2033, 2055, 2138, 2139, 2140, 3340, 3364, 3363, 2022, 2021}


# ══════════════════════════════════════════
# LCU / SGP 通信
# ══════════════════════════════════════════

class SgpClient:
    """SGP 客户端，自动管理 token 刷新"""
    def __init__(self):
        self.lcu = self._get_lcu()
        self.token = self._fetch_token()
        self._lock = threading.Lock()
        self._token_time = time.time()

    def _get_lcu(self):
        out = subprocess.check_output(['ps', 'axww', '-o', 'command='], text=True)
        for line in out.split('\n'):
            if 'LeagueClientUx' not in line:
                continue
            port = re.search(r'--app-port=(\d+)', line)
            auth = re.search(r'--remoting-auth-token=([\w-]+)', line)
            if port and auth:
                return {'port': int(port.group(1)), 'auth': auth.group(1)}
        sys.exit('错误: 未找到 LeagueClientUx 进程。请先启动客户端。')

    def _fetch_token(self):
        r = requests.get(f'https://127.0.0.1:{self.lcu["port"]}/entitlements/v1/token',
                         auth=('riot', self.lcu['auth']), verify=False)
        self._token_time = time.time()
        return r.json()['accessToken']

    def refresh_token(self):
        with self._lock:
            if time.time() - self._token_time < 30:
                return  # 刚刷新过
            print('  [刷新 token...]', flush=True)
            self.token = self._fetch_token()

    def get(self, base_url, path, retries=3):
        for attempt in range(retries):
            try:
                resp = requests.get(f'{base_url}{path}',
                                    headers={'Authorization': f'Bearer {self.token}'},
                                    timeout=15)
                if resp.status_code == 401:
                    self.refresh_token()
                    continue
                if resp.status_code == 429:
                    wait = int(resp.headers.get('Retry-After', 5)) + 1
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp.json()
            except requests.exceptions.HTTPError:
                raise
            except Exception:
                if attempt < retries - 1:
                    time.sleep(2)
                else:
                    raise
        return None


# ══════════════════════════════════════════
# 静态数据加载
# ══════════════════════════════════════════

def load_static_data():
    """加载 Data Dragon 静态数据 (物品/英雄/符文)"""
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
    """加载 lolalytics 五因子去偏数据"""
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
            print(f"  警告: 缺失 {fname}, 去偏将不完整")
            lola[key] = {}
    return lola


# ══════════════════════════════════════════
# 数据获取
# ══════════════════════════════════════════

def player_dir(player):
    safe = f"{player['name']}_{player['tag']}".replace(' ', '_').replace('#', '_')
    d = os.path.join(PLAYERS_DIR, safe)
    os.makedirs(d, exist_ok=True)
    return d


def fetch_match_list(sgp, player):
    """获取玩家的所有赛娜辅助单双排比赛列表 (含全部10名参与者)"""
    region = SGP_REGIONS[player['region']]
    puuid = player['puuid']
    all_games = []
    start = 0
    page_size = 100

    while True:
        path = f'/match-history-query/v1/products/lol/player/{puuid}/SUMMARY?startIndex={start}&count={page_size}'
        data = sgp.get(region['base'], path)
        games_page = data.get('games', [])
        if not games_page:
            break
        all_games.extend(games_page)
        print(f"  已获取 {len(all_games)} 场比赛记录...", end='\r')
        if len(games_page) < page_size:
            break
        start += page_size
        time.sleep(0.3)

    print(f"  共获取 {len(all_games)} 场比赛记录")

    # 筛选: queueId=420, 赛娜辅助, 时长>=300秒
    senna_games = []
    for raw_game in all_games:
        g = raw_game.get('json', raw_game)
        if g.get('queueId') != 420:
            continue
        if g.get('gameDuration', 0) < 300:
            continue
        participants = g.get('participants', [])
        me = None
        for p in participants:
            if p.get('puuid') == puuid:
                me = p
                break
        if me is None:
            continue
        if me.get('championName') != 'Senna':
            continue
        if me.get('teamPosition') != 'UTILITY':
            continue

        my_team = me.get('teamId')
        game_data = {
            'gameId': g['gameId'],
            'gameDuration': g['gameDuration'],
            'me_pid': me.get('participantId'),
            'me_teamId': my_team,
            'me_win': me.get('win', False),
            'me_kills': me.get('kills', 0),
            'me_deaths': me.get('deaths', 0),
            'me_assists': me.get('assists', 0),
            'me_visionScore': me.get('visionScore', 0),
            'me_wardsPlaced': me.get('wardsPlaced', 0),
            'me_wardsKilled': me.get('wardsKilled', 0),
            'me_controlWardsBought': me.get('controlWardsPlaced', 0),
            'me_goldEarned': me.get('goldEarned', 0),
            'me_totalDamageDealtToChampions': me.get('totalDamageDealtToChampions', 0),
            'me_perks': me.get('perks', {}),
            # 对位/搭配信息 (从全部10名参与者提取)
            'enemy_sup_champion': '?', 'enemy_sup_pid': None,
            'enemy_adc_champion': '?',
            'ally_adc_champion': '?',
            'ally_adc_kills': 0, 'ally_adc_deaths': 0, 'ally_adc_assists': 0,
            'enemy_sup_visionScore': 0, 'enemy_sup_kills': 0, 'enemy_sup_deaths': 0, 'enemy_sup_assists': 0,
            'ally_jg': '?', 'enemy_jg': '?',
        }

        for p in participants:
            team = p.get('teamId')
            pos = p.get('teamPosition', '')
            champ = p.get('championName', '?')
            if team != my_team and pos == 'UTILITY':
                game_data['enemy_sup_champion'] = champ
                game_data['enemy_sup_pid'] = p.get('participantId')
                game_data['enemy_sup_visionScore'] = p.get('visionScore', 0)
                game_data['enemy_sup_kills'] = p.get('kills', 0)
                game_data['enemy_sup_deaths'] = p.get('deaths', 0)
                game_data['enemy_sup_assists'] = p.get('assists', 0)
            elif team != my_team and pos == 'BOTTOM':
                game_data['enemy_adc_champion'] = champ
            elif team == my_team and pos == 'BOTTOM':
                game_data['ally_adc_champion'] = champ
                game_data['ally_adc_kills'] = p.get('kills', 0)
                game_data['ally_adc_deaths'] = p.get('deaths', 0)
                game_data['ally_adc_assists'] = p.get('assists', 0)
            elif team == my_team and pos == 'JUNGLE':
                game_data['ally_jg'] = champ
            elif team != my_team and pos == 'JUNGLE':
                game_data['enemy_jg'] = champ

        senna_games.append(game_data)

    print(f"  筛选后: {len(senna_games)} 场赛娜辅助单双排")
    return senna_games


def fetch_game_details(sgp, player, game):
    """获取单局时间线数据 (DETAILS)"""
    region = SGP_REGIONS[player['region']]
    platform = region['platform']
    path = f'/match-history-query/v1/products/lol/{platform}_{game["gameId"]}/DETAILS'
    data = sgp.get(region['base'], path)
    inner = data.get('json', data)

    frames_raw = inner.get('frames', [])
    me_key = str(game['me_pid'])
    enemy_key = str(game.get('enemy_sup_pid', '')) if game.get('enemy_sup_pid') else None

    timeline_frames = []
    all_events = []

    for frame in frames_raw:
        pf = frame.get('participantFrames', {})
        me_data = pf.get(me_key, {})
        me_pos = me_data.get('position', {})

        frame_record = {
            'timestamp': frame.get('timestamp'),
            'me': {
                'x': me_pos.get('x'), 'y': me_pos.get('y'),
                'gold': me_data.get('currentGold'),
                'totalGold': me_data.get('totalGold'),
                'xp': me_data.get('xp'),
                'level': me_data.get('level'),
            },
        }
        if enemy_key:
            enemy_data = pf.get(enemy_key, {})
            enemy_pos = enemy_data.get('position', {})
            frame_record['enemy_sup'] = {
                'x': enemy_pos.get('x'), 'y': enemy_pos.get('y'),
                'gold': enemy_data.get('currentGold'),
            }

        timeline_frames.append(frame_record)

        for event in frame.get('events', []):
            if event.get('type') in INTERESTING_EVENTS:
                all_events.append(event)

    return {
        'frameInterval': inner.get('frameInterval'),
        'frames': timeline_frames,
        'events': all_events,
    }


PARALLEL_WORKERS = 8  # 并发获取 DETAILS 的线程数

def fetch_player_data(sgp, player):
    """获取单个玩家的完整数据 (并行获取 DETAILS)"""
    pdir = player_dir(player)
    cache_path = os.path.join(pdir, 'match_data.json')

    # 检查缓存
    if os.path.exists(cache_path):
        try:
            with open(cache_path) as f:
                cached = json.load(f)
            print(f"  从缓存加载 {len(cached)} 场比赛")
            return cached
        except json.JSONDecodeError:
            print(f"  缓存损坏，重新获取")

    # 获取比赛列表
    match_list = fetch_match_list(sgp, player)
    if not match_list:
        print(f"  未找到赛娜辅助单双排比赛")
        return []

    # 并行获取 DETAILS
    results = [None] * len(match_list)
    done_count = [0]
    error_count = [0]
    lock = threading.Lock()

    def fetch_one(idx):
        game = match_list[idx]
        try:
            details = fetch_game_details(sgp, player, game)
            game['details'] = details
            with lock:
                results[idx] = game
                done_count[0] += 1
                if done_count[0] % 20 == 0:
                    print(f"  进度: {done_count[0]}/{len(match_list)} (错误: {error_count[0]})")
        except Exception as e:
            with lock:
                error_count[0] += 1
                done_count[0] += 1
                if error_count[0] <= 3:
                    print(f"  错误 (game {game['gameId']}): {e}")
                elif error_count[0] == 4:
                    print(f"  ... 后续错误省略")

    print(f"  并行获取 {len(match_list)} 场 DETAILS (线程数: {PARALLEL_WORKERS})...")
    with ThreadPoolExecutor(max_workers=PARALLEL_WORKERS) as pool:
        futures = [pool.submit(fetch_one, i) for i in range(len(match_list))]
        for f in as_completed(futures):
            pass  # 等待所有完成

    games = [r for r in results if r is not None]
    print(f"  完成: {len(games)} 场成功, {error_count[0]} 场失败")

    # 保存
    with open(cache_path, 'w') as f:
        json.dump(games, f, ensure_ascii=False)
    print(f"  数据已保存: {cache_path}")
    return games


# ══════════════════════════════════════════
# 分析 + 报告生成
# ══════════════════════════════════════════

def generate_report(player, games, static_data, lola):
    """生成单个玩家的完整分析报告"""
    ITEMS = static_data['items']
    CHAMPS = static_data['champs']
    RUNES = static_data['runes']
    ITEM_COMPONENTS = static_data['item_components']

    # ── 工具函数 ──
    def cn(en_name):
        return CHAMPS.get(en_name, en_name)

    def item_zh(iid):
        return ITEMS.get(iid, {}).get('zh', f'#{iid}')

    def item_gold(iid):
        return ITEMS.get(iid, {}).get('gold', 0)

    def wr(w, n):
        if n == 0: return "N/A"
        return f"{w}/{n} ({100*w/n:.1f}%)"

    def rune_zh(rid):
        return RUNES.get(rid, f'#{rid}')

    def is_completed(iid):
        if iid in BOOT_IDS | STARTER | CONSUMABLE: return False
        return item_gold(iid) >= 1500

    total = len(games)
    if total == 0:
        print(f"  无数据，跳过报告生成")
        return
    wins = sum(1 for g in games if g['me_win'])
    SENNA_WR = wins / total

    player_label = f"{player['name']}#{player['tag']}"
    region_label = player['region']

    # ── 期望胜率 ──
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

    # ── 1. 对位统计 ──
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

    # ── 2. 出装 ──
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

    # ── 3. 游走 ──
    def is_bot(x, y):
        return x is not None and y is not None and x > 9000 and y < 5000

    def get_roams(frames, key):
        was = True; start = None; result = []
        for f in frames:
            ts = f["timestamp"]
            if key == "me":
                d = f.get("me", {})
            else:
                d = f.get("enemy_sup", {})
            x, y = d.get("x"), d.get("y")
            if x is None: continue
            ib = is_bot(x, y)
            if was and not ib and ts > 60000:
                start = ts
            elif not was and ib and start:
                result.append(start/60000); start = None
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

    # ── 4. 符文 ──
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
        # 符文 + 首件联动
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

    # ── 4b. 出装决策树 ──
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

    # ── 5. 孤儿小件 ──
    orphan_stats = defaultdict(lambda: {"g":0,"w":0})
    orphan_game_count = 0
    IGNORE_ORPHAN = {1001, 3070}
    for g in games:
        details = g.get("details")
        if not details: continue
        pid = g["me_pid"]; evts = details.get("events", []); w = g["me_win"]
        bought = sorted([(e["timestamp"], e["itemId"]) for e in evts
                         if e.get("type") == "ITEM_PURCHASED" and e.get("participantId") == pid])
        first_cid = None; first_ts = None
        for ts, iid in bought:
            if is_completed(iid):
                first_cid = iid; first_ts = ts; break
        if first_cid is None: continue
        components = ITEM_COMPONENTS.get(first_cid, set())
        orphans = []
        for ts, iid in bought:
            if ts >= first_ts: break
            if iid in BOOT_IDS | STARTER | CONSUMABLE | IGNORE_ORPHAN: continue
            if iid == first_cid: continue
            if not is_completed(iid) and iid not in components:
                orphans.append(iid)
        if orphans:
            orphan_game_count += 1
            seen = set()
            for iid in orphans:
                if iid not in seen:
                    seen.add(iid)
                    orphan_stats[item_zh(iid)]["g"] += 1
                    if w: orphan_stats[item_zh(iid)]["w"] += 1

    # ── 6. 对局时长 ──
    dur_buckets = [("短局 (15-25分)", 900, 1500), ("中局 (25-35分)", 1500, 2100), ("长局 (35分+)", 2100, 9999)]
    dur_data = []
    for label, lo, hi in dur_buckets:
        b = [g for g in games if lo <= g["gameDuration"] < hi]
        if b: dur_data.append((label, sum(g["me_win"] for g in b), len(b)))

    # ══════════════════════════════════════════
    # 图表
    # ══════════════════════════════════════════
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

    # Chart 1: 对面辅助胜率
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
        ax.set_xlim(0, 100); ax.set_title(f'{player_label} 赛娜 vs 对面辅助 (≥5场)', fontsize=13, fontweight='bold')
        ax.legend(fontsize=8); ax.invert_yaxis()
    style_ax(ax, fig)
    plt.savefig(f'{chart_dir}/01_vs_support.png'); plt.close()

    # Chart 2: 第一件大件
    fig, ax = plt.subplots(figsize=(12, max(3, len([n for n,s in first_item.items() if s["g"]>=5])*0.6)))
    fi_sorted = sorted([(n, s) for n, s in first_item.items() if s["g"] >= 5],
                       key=lambda x: x[1]["w"] - x[1]["exp"])
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

    # ══════════════════════════════════════════
    # HTML 报告
    # ══════════════════════════════════════════

    def img_b64(path):
        if not os.path.exists(path): return ""
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()

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

    # 汇总
    avg_k = sum(g["me_kills"] for g in games)/total
    avg_d = sum(g["me_deaths"] for g in games)/total
    avg_a = sum(g["me_assists"] for g in games)/total
    avg_vs = sum(g["me_visionScore"] for g in games)/total
    avg_gold = sum(g["me_goldEarned"] for g in games)/total
    avg_dmg = sum(g["me_totalDamageDealtToChampions"] for g in games)/total
    avg_dur = sum(g["gameDuration"] for g in games)/total

    # 决策树
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

            html += f'<div class="tree-root">'
            html += f'<div class="node node-rune" style="border-color:{adj_color(ks_adj)}">'
            html += f'<div class="node-title">{ks_zh}</div>'
            html += f'<div class="node-stats">{ks_total}场 | 去偏 {ks_adj:.1f}%</div></div>'
            html += '<div class="tree-children">'

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
                html += f'<div class="tree-branch">'
                html += f'<div class="node node-item1" style="border-color:{adj_color(adj1)}">'
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

    html_out = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>{player_label} 赛娜分析</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#0f0f1a; color:#e0e0e0; font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; padding:20px; max-width:1200px; margin:0 auto; line-height:1.6; }}
h1 {{ color:#3498db; border-bottom:2px solid #3498db; padding-bottom:10px; margin:30px 0 15px; }}
h2 {{ color:#2ecc71; margin:25px 0 12px; border-left:4px solid #2ecc71; padding-left:12px; }}
h3 {{ color:#f39c12; margin:18px 0 8px; }}
.subtitle {{ color:#888; font-size:14px; margin-bottom:20px; }}
.overview {{ display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:12px; margin:15px 0; }}
.stat-card {{ background:#1a1a2e; border-radius:8px; padding:15px; text-align:center; border:1px solid #333; }}
.stat-card .value {{ font-size:24px; font-weight:bold; color:#3498db; }}
.stat-card .label {{ font-size:12px; color:#888; margin-top:4px; }}
table {{ width:100%; border-collapse:collapse; margin:12px 0; background:#1a1a2e; border-radius:8px; overflow:hidden; }}
th {{ background:#16213e; padding:10px 12px; text-align:left; font-size:13px; color:#3498db; white-space:nowrap; }}
td {{ padding:8px 12px; border-top:1px solid #222; font-size:13px; }}
tr:hover {{ background:#1e2a4a; }}
img {{ max-width:100%; border-radius:8px; margin:10px 0; }}
blockquote {{ border-left:3px solid #f39c12; padding:8px 15px; margin:10px 0; background:#1a1a2e; border-radius:0 8px 8px 0; color:#ccc; font-size:13px; }}
hr {{ border:none; border-top:1px solid #333; margin:25px 0; }}
.badge {{ display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; }}
.badge-s {{ background:#2ecc71; color:#000; }} .badge-a {{ background:#f39c12; color:#000; }}
.badge-d {{ background:#e67e22; color:#fff; }} .badge-f {{ background:#e74c3c; color:#fff; }}
.tree-root {{ margin:20px 0; }}
.tree-children {{ display:flex; flex-wrap:wrap; gap:15px; margin-left:30px; padding-left:15px; border-left:2px solid #333; }}
.tree-branch {{ margin:8px 0; }}
.tree-leaves {{ display:flex; flex-wrap:wrap; gap:8px; margin-left:25px; padding-left:12px; border-left:2px dashed #444; margin-top:8px; }}
.node {{ border-radius:8px; padding:10px 15px; background:#1a1a2e; border-left:4px solid; min-width:180px; }}
.node-rune {{ background:#16213e; font-size:16px; }}
.node-rune .node-title {{ font-size:18px; font-weight:bold; }}
.node-item1 .node-title {{ font-size:14px; font-weight:bold; }}
.node-item2 {{ padding:8px 12px; }} .node-item2 .node-title {{ font-size:13px; }}
.node-stats {{ font-size:11px; color:#aaa; margin-top:3px; }}
.tip {{ position:relative; cursor:help; }}
.tip .tip-text {{ visibility:hidden; background:#222; color:#ddd; padding:6px 10px; border-radius:6px; font-size:12px; white-space:pre-line; position:absolute; z-index:10; bottom:110%; left:0; min-width:200px; box-shadow:0 2px 8px rgba(0,0,0,.5); }}
.tip:hover .tip-text {{ visibility:visible; }}
.footer {{ text-align:center; color:#666; font-size:12px; margin-top:30px; padding:15px; }}
</style>
</head>
<body>

<h1>{player_label} 赛娜 (Senna) 分析报告</h1>
<div class="subtitle">{total} 场单双排 | {region_label} 服务器 | 五因子去偏（对方辅助/ADC/打野 + 己方ADC/打野）</div>

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
<img src="data:image/png;base64,{img_b64(f"{chart_dir}/01_vs_support.png")}" alt="对面辅助胜率">
'''

    # BAN 表 - 对面辅助
    ban_rows = []
    for c, s in sorted([(c, s) for c, s in sup_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"]):
        w_r = s["w"]/s["g"]; loss = s["g"] * (0.5 - w_r)
        if loss <= 0: continue
        tag = '<span class="badge badge-f">必BAN</span>' if loss >= 1.5 else '<span class="badge badge-d">注意</span>'
        ban_rows.append([tag, cn(c), f'{100*w_r:.0f}%', str(s["g"]), f'+{loss:.1f}场'])
    html_out += tbl(["优先级","英雄","胜率","场次","预期损失"], ban_rows)

    # BAN 表 - 对面 ADC
    html_out += "<h3>对面 ADC</h3>"
    adc_ban_rows = []
    for c, s in sorted([(c, s) for c, s in adc_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"]):
        w_r = s["w"]/s["g"]; loss = s["g"] * (0.5 - w_r)
        if loss <= 0: continue
        tag = '<span class="badge badge-f">必BAN</span>' if loss >= 1.5 else '<span class="badge badge-d">注意</span>'
        adc_ban_rows.append([tag, cn(c), f'{100*w_r:.0f}%', str(s["g"])])
    html_out += tbl(["优先级","英雄","胜率","场次"], adc_ban_rows)

    # BAN 表 - 对面打野
    html_out += "<h3>对面打野</h3>"
    ejg_ban_rows = []
    for c, s in sorted([(c, s) for c, s in enemy_jg_stats.items() if s["g"] >= 5], key=lambda x: x[1]["w"]/x[1]["g"]):
        w_r = s["w"]/s["g"]; loss = s["g"] * (0.5 - w_r)
        if loss <= 0: continue
        tag = '<span class="badge badge-f">必BAN</span>' if loss >= 1.5 else '<span class="badge badge-d">注意</span>'
        ejg_ban_rows.append([tag, cn(c), f'{100*w_r:.0f}%', str(s["g"]), f'+{loss:.1f}场'])
    html_out += tbl(["优先级","英雄","胜率","场次","预期损失"], ejg_ban_rows)

    # 队友 ADC
    html_out += "<hr><h2>队友 ADC 搭配</h2>"
    ally_rows = []
    for c, s in sorted([(c, s) for c, s in ally_stats.items() if s["g"] >= 5], key=lambda x: -x[1]["w"]/x[1]["g"]):
        w_r = 100*s["w"]/s["g"]; n = s["g"]
        tier_cls = "badge-s" if w_r >= 60 else "badge-a" if w_r >= 50 else "badge-d" if w_r >= 40 else "badge-f"
        tier = "S" if w_r >= 60 else "A" if w_r >= 50 else "D" if w_r >= 40 else "F"
        kda = f'{s["k"]/n:.1f}/{s["d"]/n:.1f}/{s["a"]/n:.1f}'
        ally_rows.append([f'<span class="badge {tier_cls}">{tier}</span>', cn(c), wr(s["w"], n), str(n), kda])
    html_out += tbl(["评级","ADC","胜率","场次","KDA"], ally_rows)

    # 出装
    html_out += '<hr><h2>出装路线</h2><h3>第一件大件</h3>'
    html_out += '<blockquote>去偏胜率基于 lolalytics 翡翠+ 大样本数据，综合五因子计算期望胜率。</blockquote>'
    html_out += f'<img src="data:image/png;base64,{img_b64(f"{chart_dir}/02_first_item.png")}" alt="第一件大件胜率">'

    fi_rows = []
    for name, s in sorted(first_item.items(), key=lambda x: -(x[1]["w"]-x[1]["exp"])):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        avg_t = sum(s["t"])/len(s["t"]) if s["t"] else 0
        fi_rows.append([name, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"]), f'{avg_t:.1f}分'])
    html_out += tbl(["装备","原始胜率","去偏胜率","超额胜场","场次","完成时间"], fi_rows)

    # 前两件
    html_out += "<h3>前两件组合 (≥3场)</h3>"
    ti_rows = []
    for name, s in sorted(two_item.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        ti_rows.append([name, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html_out += tbl(["出装路线","原始胜率","去偏胜率","超额","场次"], ti_rows)

    # 鞋子
    html_out += "<h3>鞋子</h3>"
    boot_rows = []
    for name, s in sorted(boots_st.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        boot_rows.append([name, wr(s["w"], s["g"]), str(s["g"])])
    html_out += tbl(["鞋子","胜率","场次"], boot_rows)

    # 符文
    html_out += "<hr><h2>符文分析</h2><h3>基石符文</h3>"
    ks_rows = []
    for rid, s in sorted(keystone_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        ks_rows.append([rune_zh(rid), wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html_out += tbl(["基石","原始胜率","去偏胜率","超额","场次"], ks_rows)

    html_out += "<h3>主系 + 副系</h3>"
    tc_rows = []
    for combo, s in sorted(tree_combo_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        tc_rows.append([combo, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html_out += tbl(["系别组合","原始胜率","去偏胜率","超额","场次"], tc_rows)

    html_out += "<h3>符文 + 首件联动</h3>"
    ri_rows = []
    for combo, s in sorted(rune_item_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 5: continue
        adj_wr_v = 100*(s["w"] - s["exp"])/s["g"] + 100*wins/total
        excess = s["w"] - s["exp"]
        ri_rows.append([combo, wr(s["w"], s["g"]), f'<span style="color:{adj_color(adj_wr_v)}">{adj_wr_v:.1f}%</span>',
                        excess_badge(excess), str(s["g"])])
    html_out += tbl(["基石 + 首件","原始胜率","去偏胜率","超额","场次"], ri_rows)

    # 决策树
    html_out += '<hr><h2>出装路线决策树</h2>'
    html_out += '<blockquote>按 <b>基石符文 → 第1件 → 第2件</b> 路线分析。颜色：<span style="color:#2ecc71">■</span> ≥65% | <span style="color:#f39c12">■</span> 55-65% | <span style="color:#e74c3c">■</span> &lt;55%</blockquote>'
    html_out += build_tree_html()

    # 孤儿小件
    html_out += f'<hr><h2>出装犹豫分析（孤儿小件）</h2>'
    html_out += f'<blockquote>在 {orphan_game_count}/{total} 场（{100*orphan_game_count/total:.0f}%）中买了不在合成路线内的小件。</blockquote>'
    orph_rows = []
    for name, s in sorted(orphan_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        orph_rows.append([name, str(s["g"]), wr(s["w"], s["g"])])
    html_out += tbl(["孤儿小件","出现次数","出现时胜率"], orph_rows)

    # 游走
    html_out += "<hr><h2>游走主动性</h2>"
    roam_rows = [
        ["我先游走", wr(roam_data["me_first_w"], roam_data["me_first_n"]), str(roam_data["me_first_n"])],
        ["对方先游走", wr(roam_data["en_first_w"], roam_data["en_first_n"]), str(roam_data["en_first_n"])],
        ["都没游走/同时", wr(roam_data["none_w"], roam_data["none_n"]), str(roam_data["none_n"])],
    ]
    html_out += tbl(["场景","胜率","场次"], roam_rows)

    html_out += "<h3>对局时长</h3>"
    dur_rows = [[l, wr(w_val,n), str(n)] for l,w_val,n in dur_data]
    html_out += tbl(["时长","胜率","场次"], dur_rows)

    # 对位详情
    html_out += "<hr><h2>对面辅助详细对位 (≥3场)</h2>"
    sup_rows = []
    for c, s in sorted(sup_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        n = s["g"]; kda = f'{s["k"]/n:.1f}/{s["d"]/n:.1f}/{s["a"]/n:.1f}'
        sup_rows.append([cn(c), wr(s["w"], n), str(n), kda])
    html_out += tbl(["英雄","胜率","场次","KDA"], sup_rows)

    html_out += "<h2>对面 ADC 详细对位 (≥3场)</h2>"
    adc_rows = []
    for c, s in sorted(adc_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        adc_rows.append([cn(c), wr(s["w"], s["g"]), str(s["g"])])
    html_out += tbl(["英雄","胜率","场次"], adc_rows)

    html_out += "<h2>对面打野详细对位 (≥3场)</h2>"
    ejg_rows = []
    for c, s in sorted(enemy_jg_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        ejg_rows.append([cn(c), wr(s["w"], s["g"]), str(s["g"])])
    html_out += tbl(["英雄","胜率","场次"], ejg_rows)

    html_out += "<h2>己方打野搭配 (≥3场)</h2>"
    ajg_rows = []
    for c, s in sorted(ally_jg_stats.items(), key=lambda x: -x[1]["g"]):
        if s["g"] < 3: continue
        ajg_rows.append([cn(c), wr(s["w"], s["g"]), str(s["g"])])
    html_out += tbl(["英雄","胜率","场次"], ajg_rows)

    html_out += '<div class="footer">数据来源: SGP Timeline API + lolalytics 翡翠+ 五因子去偏 | 小样本 (&lt;10场) 仅供参考</div>'
    html_out += '</body></html>'

    report_path = os.path.join(pdir, 'report.html')
    with open(report_path, 'w') as f:
        f.write(html_out)
    print(f"  报告已保存: {report_path}")
    return report_path


# ══════════════════════════════════════════
# 主流程
# ══════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='赛娜 OTP 通用分析器')
    parser.add_argument('--player', type=str, help='仅分析指定玩家 (格式: Name#Tag)')
    parser.add_argument('--fetch-only', action='store_true', help='仅获取数据不生成报告')
    parser.add_argument('--report-only', action='store_true', help='仅从缓存数据生成报告')
    args = parser.parse_args()

    os.makedirs(PLAYERS_DIR, exist_ok=True)

    # 筛选玩家
    players = PLAYERS
    if args.player:
        name, tag = args.player.rsplit('#', 1)
        players = [p for p in PLAYERS if p['name'] == name and p['tag'] == tag]
        if not players:
            sys.exit(f'未找到玩家: {args.player}')

    # 获取 SGP 客户端 (除非仅生成报告)
    sgp = None
    if not args.report_only:
        sgp = SgpClient()
        print(f"SGP token 已获取\n")

    # 加载静态数据
    static_data = load_static_data()
    lola = load_lolalytics()
    print(f"静态数据已加载\n")

    # 处理每个玩家
    reports = []
    for player in players:
        label = f"{player['name']}#{player['tag']} ({player['region']})"
        print(f"{'='*50}")
        print(f"处理: {label}")
        print(f"{'='*50}")

        pdir = player_dir(player)
        cache_path = os.path.join(pdir, 'match_data.json')

        # 获取数据
        if args.report_only:
            if not os.path.exists(cache_path):
                print(f"  缓存不存在，跳过")
                continue
            with open(cache_path) as f:
                games = json.load(f)
            print(f"  从缓存加载 {len(games)} 场比赛")
        else:
            games = fetch_player_data(sgp, player)

        if not games:
            print(f"  无数据")
            continue

        # 生成报告
        if not args.fetch_only:
            report_path = generate_report(player, games, static_data, lola)
            if report_path:
                reports.append((label, report_path))

        print()

    # 汇总
    if reports:
        print(f"\n{'='*50}")
        print(f"完成! 生成 {len(reports)} 份报告:")
        for label, path in reports:
            print(f"  {label}: {path}")


if __name__ == '__main__':
    main()
