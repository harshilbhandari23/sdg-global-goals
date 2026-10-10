#!/usr/bin/env python3
"""One-off: copies the Framer CMS content out of Framer.
 - downloads every image the site uses into assets/media/
 - splits data/goals.json into one file per goal (data/goals/goal-N.json) for the Decap editor
 - splits legal + yearwise into one file per entry
"""
import json, os, re, urllib.request, concurrent.futures as cf
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
URL_RE = re.compile(r'https?://[^\s"\'<>)]+\.(?:png|jpg|jpeg|webp|svg|gif)', re.I)
goals = json.load(open('data/goals.json', encoding='utf8'))
urls = set()
def walk(o):
    if isinstance(o, dict): [walk(v) for v in o.values()]
    elif isinstance(o, list): [walk(v) for v in o]
    elif isinstance(o, str): urls.update(URL_RE.findall(o))
walk(goals)
for f in ['build.py', 'assets/sdg-data.js', 'assets/styles.css']:
    urls.update(re.findall(r'https://framerusercontent\.com/images/[A-Za-z0-9]+\.(?:png|jpg|webp)', open(f, encoding='utf8').read()))
# mosaic ids are built from MOSAIC in build.py
src = open('build.py', encoding='utf8').read()
for id_ in re.findall(r'"([A-Za-z0-9]{20,})"', src):
    urls.add(f'https://framerusercontent.com/images/{id_}.png')
urls = sorted(urls)
mapping = {}
def fetch(u):
    name = u.rstrip('/').split('/')[-1]
    dest = os.path.join('assets', 'media', name)
    if not os.path.exists(dest):
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            data = urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:
            return u, None, str(e)
        open(dest, 'wb').write(data)
    return u, 'assets/media/' + name, None
with cf.ThreadPoolExecutor(12) as ex:
    for u, local, err in ex.map(fetch, urls):
        if local: mapping[u] = local
        else: print('FAILED', u, err)
print('downloaded', len(mapping), 'of', len(urls))
def rewrite(o):
    if isinstance(o, dict): return {k: rewrite(v) for k, v in o.items()}
    if isinstance(o, list): return [rewrite(v) for v in o]
    if isinstance(o, str):
        for u, l in mapping.items(): o = o.replace(u, l)
        return o
    return o
for g in goals:
    g.pop('lottie', None); g.pop('id', None)
    json.dump(rewrite(g), open(f"data/goals/goal-{g['number']}.json", 'w', encoding='utf8'), ensure_ascii=False, indent=1)
for it in json.load(open('data/legal.json', encoding='utf8')):
    json.dump(it, open(f"data/legal/{it['slug']}.json", 'w', encoding='utf8'), ensure_ascii=False, indent=1)
for it in json.load(open('data/yearwise.json', encoding='utf8')):
    json.dump(it, open(f"data/yearwise/{it['year']}.json", 'w', encoding='utf8'), indent=1)
json.dump(mapping, open('tools/media-map.json', 'w'), indent=1)
