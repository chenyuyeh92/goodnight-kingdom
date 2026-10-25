"""宣傳影片剪接:把 record.cjs 錄的畫面照分鏡表剪好,配上十個世界的配樂與字幕,輸出各種規格。

用法:python3 tools/promo/assemble.py <錄影資料夾> <輸出資料夾> [zh|en]

輸出(每種語言):
  promo-<lang>-1080p.mp4      60 秒,1920×1080(YouTube/Google Play 宣傳影片、網站)
  appstore-<lang>-iphone.mp4  30 秒,1920×886(App Store iPhone 6.5/6.9 吋橫式預覽)
  appstore-<lang>-ipad.mp4    30 秒,1600×1200(App Store iPad 13 吋橫式預覽)
  promo-<lang>-vertical.mp4   60 秒,1080×1920(社群、網站作品卡)
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MUSIC = ROOT / 'public/assets/music'
FONT = ROOT / 'public/assets/fonts/jf-openhuninn-2.1.ttf'
UI = ROOT / 'public/assets/ui'
FPS = 30
W, H = 1920, 1080
INK = '0x2b2a6b'
CREAM = '0xfff6e5'
NIGHT = '0x1d1a3a'

RAW = Path(sys.argv[1])
OUT = Path(sys.argv[2])
LANG = sys.argv[3] if len(sys.argv) > 3 else 'zh'
WORK = OUT / f'work-{LANG}'

T = {
    'zh': {
        'tag': '魔物都失眠了!',
        'w1': '用哈欠泡泡,把失眠的魔物一隻一隻哄睡',
        'draw': '畫一個自己的守衛',
        'drawnPlay': '帶著它一起去冒險!',
        'weapons': '寶箱裡藏著十種神奇武器',
        'worlds': '十個世界的冒險',
        'w4': '冰雪極地', 'w5': '火山島', 'w6': '熱帶雨林', 'w7': '非洲大草原',
        'w8': '雲端高山', 'w9': '地底洞窟', 'w10': '月亮城堡',
        'duo': '兩支手機連線,一起玩',
        'boss': '是誰偷走了大家的睡意?',
        'end1': '免費玩世界 1–3 · 完整版解鎖十個世界',
        'end2': '網頁版:chenyuyeh92.github.io/goodnight-kingdom',
        'end3': 'App Store · Google Play 即將推出',
    },
    'en': {
        'tag': "The monsters can't sleep!",
        'w1': 'Lull sleepless monsters with yawn bubbles',
        'draw': 'Draw your own guard',
        'drawnPlay': '...and take it on an adventure!',
        'weapons': '10 magical weapons hidden in chests',
        'worlds': '10 worlds to explore',
        'w4': 'Frozen Polar Land', 'w5': 'Volcano Island', 'w6': 'Tropical Rainforest', 'w7': 'African Savanna',
        'w8': 'Mountain Clouds', 'w9': 'Deep Underground', 'w10': 'Moon Castle',
        'duo': 'Link two phones and play together',
        'boss': "Who stole everyone's sleep?",
        'end1': 'Worlds 1–3 free · Full version unlocks all 10',
        'end2': 'Play on the web: chenyuyeh92.github.io/goodnight-kingdom',
        'end3': 'Coming to the App Store and Google Play',
    },
}[LANG]

WORLD_NUM = {f'w{n}': n for n in range(4, 11)}
# 開場繪本從第幾秒剪(英文字比較多,打字比較久):長版剪「吵翻王國 → 守衛出發」,短版只剪「守衛出發」。
STORY_AT = {'zh': {'long': 13.2, 'short': 16.4}, 'en': {'long': 26.0, 'short': 32.3}}[LANG]


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def caption_file(key: str, text: str) -> Path:
    p = WORK / f'cap-{key}.txt'
    p.write_text(text, encoding='utf-8')
    return p


def clip_from_frames(name: str) -> Path:
    """錄影的 JPEG(時間不固定)轉成固定 30 fps 的影片。"""
    out = WORK / f'clip-{name}.mp4'
    if out.exists():
        return out
    src = RAW / name
    times = json.loads((src / 'times.json').read_text())
    lst = WORK / f'clip-{name}.txt'
    lines = []
    for i, t in enumerate(times):
        dur = (times[i + 1] - t) if i + 1 < len(times) else 1 / FPS
        lines.append(f"file '{(src / f'{i:05d}.jpg').resolve()}'\nduration {max(dur, 0.001):.4f}")
    lines.append(f"file '{(src / f'{len(times) - 1:05d}.jpg').resolve()}'")
    lst.write_text('\n'.join(lines))
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-vf', f'scale={W}:{H}:flags=lanczos,fps={FPS},format=yuv420p',
         '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', str(out)])
    return out


def card(key: str, dur: float, lines: list[tuple[str, int, int]], logo_y: int) -> Path:
    """標題/結尾卡:封面背景、標誌、幾行字。"""
    out = WORK / f'card-{key}.mp4'
    draw = []
    for i, (text, size, y) in enumerate(lines):
        f = caption_file(f'{key}-{i}', text)
        draw.append(f"drawtext=fontfile='{FONT}':textfile='{f}':fontsize={size}:fontcolor={CREAM}:borderw=6:bordercolor={INK}:x=(w-text_w)/2:y={y}")
    vf = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},eq=brightness=-0.08[bg];"
          f"[1:v]scale=900:-1[logo];[bg][logo]overlay=(W-w)/2:{logo_y}[v0];"
          f"[v0]{','.join(draw) if draw else 'null'},fade=in:st=0:d=0.4,fade=out:st={dur - 0.4}:d=0.4,format=yuv420p")
    run(['ffmpeg', '-y', '-loop', '1', '-t', str(dur), '-i', str(UI / 'cover-bg.png'), '-i', str(UI / 'logo.png'),
         '-filter_complex', vf, '-r', str(FPS), '-c:v', 'libx264', '-crf', '14', '-t', str(dur), str(out)])
    return out


def segment(i: int, shot: str, start: float, dur: float, speed: float = 1.0) -> Path:
    """從錄好的畫面剪一段(可以加快,例如畫畫的過程)。"""
    out = WORK / f'seg-{i:02d}-{shot}.mp4'
    src = clip_from_frames(shot)
    run(['ffmpeg', '-y', '-ss', f'{start:.3f}', '-i', str(src), '-vf', f'setpts=PTS/{speed},fps={FPS},format=yuv420p',
         '-t', f'{dur:.3f}', '-an', '-c:v', 'libx264', '-crf', '14', str(out)])
    return out


# 分鏡表:(錄影段落或卡片, 從第幾秒開始, 長度, 加速倍數, 配樂, 配樂從第幾秒開始, 字幕)
LONG = [
    ('card:title', 0, 2.5, 1, 'menu', 0, None),
    ('story', 13.2, 6.0, 1, 'menu', 3, None),
    ('w1', 2.0, 6.0, 1, 'w01-day', 0, 'w1'),
    ('draw', 0.6, 6.0, 4.9, 'w02-day', 0, 'draw'),
    ('drawnPlay', 1.5, 5.0, 1, 'w02-day', 6, 'drawnPlay'),
    ('weapons', 3.0, 7.0, 1, 'w03-day', 0, 'weapons'),
    ('w4', 1.0, 2.5, 1, 'w04-day', 2, 'w4'),
    ('w5', 1.0, 2.5, 1, 'w05-dusk', 2, 'w5'),
    ('w6', 1.0, 2.5, 1, 'w06-day', 2, 'w6'),
    ('w7', 1.0, 2.5, 1, 'w07-day', 2, 'w7'),
    ('w8', 1.0, 2.5, 1, 'w08-day', 2, 'w8'),
    ('w9', 1.6, 2.5, 1, 'w09-night', 2, 'w9'),
    ('w10', 1.0, 2.5, 1, 'w10-day', 2, 'w10'),
    ('duo', 1.0, 4.0, 1, 'w01-boss', 0, 'duo'),
    ('boss', 0.0, 3.0, 1, 'w10-night', 0, 'boss'),
    ('card:end', 0, 3.0, 1, 'menu', 20, None),
]
SHORT = [
    ('story', 16.4, 3.0, 1, 'menu', 3, None),
    ('w1', 2.0, 3.5, 1, 'w01-day', 0, 'w1'),
    ('draw', 0.6, 3.5, 8.4, 'w02-day', 0, 'draw'),
    ('drawnPlay', 1.5, 2.5, 1, 'w02-day', 3.5, 'drawnPlay'),
    ('weapons', 3.0, 3.5, 1, 'w03-day', 0, 'weapons'),
    ('w4', 1.0, 1.3, 1, 'w04-day', 2, 'w4'),
    ('w5', 1.0, 1.3, 1, 'w05-dusk', 2, 'w5'),
    ('w6', 1.0, 1.3, 1, 'w06-day', 2, 'w6'),
    ('w7', 1.0, 1.3, 1, 'w07-day', 2, 'w7'),
    ('w8', 1.0, 1.3, 1, 'w08-day', 2, 'w8'),
    ('w9', 1.6, 1.3, 1, 'w09-night', 2, 'w9'),
    ('w10', 1.0, 1.3, 1, 'w10-day', 2, 'w10'),
    ('duo', 1.0, 2.0, 1, 'w01-boss', 0, 'duo'),
    ('card:end', 0, 2.9, 1, 'menu', 20, None),
]


def build(plan, name: str) -> tuple[Path, list[tuple[float, float, str]], list[tuple[float, float]]]:
    """照分鏡表接成一支沒有字幕的影片(含配樂);回傳字幕的時間表與「十個世界」那段的時間。"""
    parts, caps, music = [], [], []
    t = 0.0
    worlds_span = [None, None]
    for i, (shot, start, dur, speed, track, toff, cap) in enumerate(plan):
        if shot == 'card:title':
            parts.append(card('title', dur, [(T['tag'], 72, 760)], 170))
        elif shot == 'card:end':
            parts.append(card('end', dur, [(T['end1'], 58, 700), (T['end2'], 40, 800), (T['end3'], 40, 870)], 120))
        else:
            if shot == 'story':
                start = STORY_AT[name]
            parts.append(segment(i, shot, start, dur, speed))
        if cap:
            caps.append((t, t + dur, cap))
        if shot in WORLD_NUM:
            worlds_span[0] = t if worlds_span[0] is None else worlds_span[0]
            worlds_span[1] = t + dur
        music.append((track, toff, t, dur))
        t += dur
    lst = WORK / f'{name}.txt'
    lst.write_text('\n'.join(f"file '{p.resolve()}'" for p in parts))
    silent = WORK / f'{name}-silent.mp4'
    run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(silent)])

    # 配樂:每一段放那個世界的音樂,前後淡入淡出,接起來。
    inputs, filters, labels = [], [], []
    for j, (track, toff, at, dur) in enumerate(music):
        inputs += ['-ss', str(toff), '-t', f'{dur + 0.35:.3f}', '-i', str(MUSIC / f'{track}.mp3')]
        filters.append(f'[{j + 1}:a]aresample=48000,afade=t=in:st=0:d=0.25,afade=t=out:st={max(dur - 0.15, 0):.3f}:d=0.5,adelay={int(at * 1000)}|{int(at * 1000)}[a{j}]')
        labels.append(f'[a{j}]')
    # 相鄰兩段相同的曲子(例如畫畫接著冒險)不要重新淡入:合併成一段。
    total = t
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,afade=t=out:st={total - 1.2:.3f}:d=1.2,loudnorm=I=-16:TP=-1.5[aout]")
    out = WORK / f'{name}-music.mp4'
    run(['ffmpeg', '-y', '-i', str(silent), *inputs, '-filter_complex', ';'.join(filters), '-map', '0:v', '-map', '[aout]',
         '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', f'{total:.3f}', str(out)])
    return out, caps, [tuple(worlds_span)] if worlds_span[0] is not None else []


def merge_music(plan):
    """相鄰同一首曲子的兩段,第二段的配樂接著第一段播(不要重頭開始)。"""
    merged = []
    for row in plan:
        if merged and merged[-1][4] == row[4]:
            prev = merged[-1]
            row = (*row[:5], prev[5] + prev[2], row[6])
        merged.append(row)
    return merged


def captions(caps, worlds, box: str, size: int, y: str, top_y: str | None) -> str:
    """字幕(淡入淡出);十個世界那段上面加一行標題。"""
    out = []
    for a, b, key in caps:
        f = caption_file(key, T[key] if key not in WORLD_NUM else (f'世界 {WORLD_NUM[key]} · {T[key]}' if LANG == 'zh' else f'World {WORLD_NUM[key]} · {T[key]}'))
        alpha = f"'if(lt(t,{a}+0.25),(t-{a})/0.25,if(gt(t,{b}-0.25),({b}-t)/0.25,1))'"
        out.append(f"drawtext=fontfile='{FONT}':textfile='{f}':fontsize={size}:fontcolor={CREAM}:borderw={max(4, size // 11)}:bordercolor={INK}:x=(w-text_w)/2:y={y}:enable='between(t,{a},{b})':alpha={alpha}")
    if top_y is not None:
        for a, b in worlds:
            f = caption_file('worlds', T['worlds'])
            alpha = f"'if(lt(t,{a}+0.3),(t-{a})/0.3,if(gt(t,{b}-0.3),({b}-t)/0.3,1))'"
            out.append(f"drawtext=fontfile='{FONT}':textfile='{f}':fontsize={int(size * 0.8)}:fontcolor=0xffe08a:borderw={max(4, size // 11)}:bordercolor={INK}:x=(w-text_w)/2:y={top_y}:enable='between(t,{a},{b})':alpha={alpha}")
    return ','.join(out) if out else 'null'


def export(src: Path, caps, worlds, out: Path, fmt: str):
    if fmt == '1080p':
        vf = f"{captions(caps, worlds, '', 64, 'h-150', '190')},format=yuv420p"
    elif fmt == 'iphone':
        # 1920×886 比 16:9 扁:整個畫面縮小放中間,左右補夜空色(裁切會切到上面的愛心或下面角色的腳)。
        vf = f"scale=1575:886:flags=lanczos,pad=1920:886:172:0:color={NIGHT},{captions(caps, worlds, '', 56, 'h-120', '150')},format=yuv420p"
    elif fmt == 'ipad':
        # 1600×1200:遊戲畫面縮成 1600×900 放中間,字幕放在下面的夜空色帶。
        vf = f"scale=1600:900:flags=lanczos,pad=1600:1200:0:150:color={NIGHT},{captions(caps, worlds, '', 56, 'h-112', '46')},format=yuv420p"
    elif fmt == 'vertical':
        vf = (f"[0:v]split[a][b];[b]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:5,eq=brightness=-0.25[bg];"
              f"[a]scale=1080:608:flags=lanczos[fg];[bg][fg]overlay=0:656,{captions(caps, worlds, '', 64, 'h-560', '470')},format=yuv420p[v]")
    else:
        raise ValueError(fmt)
    graph = ['-filter_complex', vf, '-map', '[v]', '-map', '0:a'] if fmt == 'vertical' else ['-vf', vf]
    run(['ffmpeg', '-y', '-i', str(src), *graph,
         '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', str(FPS),
         '-c:a', 'copy', '-movflags', '+faststart', str(out)])
    print(out.name, 'OK')


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    long_src, long_caps, long_worlds = build(merge_music(LONG), 'long')
    short_src, short_caps, short_worlds = build(merge_music(SHORT), 'short')
    export(long_src, long_caps, long_worlds, OUT / f'promo-{LANG}-1080p.mp4', '1080p')
    export(long_src, long_caps, long_worlds, OUT / f'promo-{LANG}-vertical.mp4', 'vertical')
    export(short_src, short_caps, short_worlds, OUT / f'appstore-{LANG}-iphone.mp4', 'iphone')
    export(short_src, short_caps, short_worlds, OUT / f'appstore-{LANG}-ipad.mp4', 'ipad')
    if '--keep' not in sys.argv:
        shutil.rmtree(WORK)


if __name__ == '__main__':
    main()
