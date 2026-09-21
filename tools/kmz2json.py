#!/usr/bin/env python3
"""Converts the reserve's KMZ files into reserve.json, loaded by the app.

Usage:
    python3 kmz2json.py "Rietspruit Game Reserve Boundary.kmz" "Leadwood Roads.kmz" \
        "Bloubank Roads.kmz" "Khaya Ndlovu Roads.kmz" > reserve.json

Upload reserve.json to Supabase: Storage -> private bucket "cartes". The app
only downloads it once a guide is signed in. NEVER put it in the GitHub
repository, which is public.

Lines are classified by the Google Earth folder that contains them:
  - limite    boundary polygon(s)
  - route     main / game drive / secondary roads
  - piste     2-tracks, 4x4, tracks
  - interdit  "No entry ..."
  - nom       label points (road names); "eau" when the icon is a water icon
"""
import sys, zipfile, json, re, math
import xml.etree.ElementTree as ET

K = '{http://www.opengis.net/kml/2.2}'
TOL_M = 1.5          # Douglas-Peucker simplification, metres

def classe(dossier):
    d = (dossier or '').lower()
    if 'no entry' in d: return 'interdit'
    if 'name' in d: return 'nom'
    if 'track' in d or '4 x 4' in d or '2-track' in d: return 'piste'
    return 'route'

def coords(txt):
    out = []
    for c in txt.split():
        p = c.split(',')
        if len(p) >= 2: out.append((float(p[0]), float(p[1])))
    return out

def rdp(pts, tol):
    if len(pts) < 3: return pts
    lat0 = math.radians(pts[0][1])
    kx, ky = 111320 * math.cos(lat0), 110574
    def d(p, a, b):
        ax, ay = (a[0]) * kx, a[1] * ky; bx, by = b[0] * kx, b[1] * ky; px, py = p[0] * kx, p[1] * ky
        dx, dy = bx - ax, by - ay
        if dx == dy == 0: return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        best, idx = 0, None
        for k in range(i + 1, j):
            v = d(pts[k], pts[i], pts[j])
            if v > best: best, idx = v, k
        if idx is not None and best > tol:
            keep[idx] = True; stack += [(i, idx), (idx, j)]
    return [p for p, k in zip(pts, keep) if k]

def r5(p): return [round(p[1], 5), round(p[0], 5)]      # [lat, lng], ~1 m precision

out = {'limite': [], 'lignes': [], 'noms': [], 'info': ''}
for path in sys.argv[1:]:
    z = zipfile.ZipFile(path)
    kml = [n for n in z.namelist() if n.lower().endswith('.kml')][0]
    root = ET.fromstring(z.read(kml))
    zone = re.sub(r'\s*(roads?|boundary)\s*(\.kmz)?$', '', root.find(f'{K}Document/{K}name').text or '', flags=re.I).strip()
    # icon per style (to spot water points)
    icon = {}
    for s in root.iter(K + 'Style'):
        h = s.find(f'{K}IconStyle/{K}Icon/{K}href')
        icon[s.get('id')] = h.text if h is not None else ''
    for sm in root.iter(K + 'StyleMap'):
        for p in sm.findall(K + 'Pair'):
            if p.find(K + 'key').text == 'normal':
                icon[sm.get('id')] = icon.get(p.find(K + 'styleUrl').text[1:], '')

    def walk(el, dossier):
        for c in el:
            if c.tag == K + 'Folder':
                walk(c, c.find(K + 'name').text)
            elif c.tag == K + 'Document':
                walk(c, dossier)
            elif c.tag == K + 'Placemark':
                nom = (c.find(K + 'name').text or '').strip() if c.find(K + 'name') is not None else ''
                nom = re.sub(r'\s+', ' ', nom)
                pol = c.find('.//' + K + 'Polygon')
                if pol is not None:
                    ring = coords(pol.find(f'.//{K}outerBoundaryIs//{K}coordinates').text)
                    out['limite'].append([r5(p) for p in rdp(ring, TOL_M)])
                    d = c.find(K + 'description')
                    if d is not None and not out['info']: out['info'] = d.text.strip()
                    continue
                pt = c.find('.//' + K + 'Point')
                if pt is not None:
                    p = coords(pt.find(K + 'coordinates').text)[0]
                    su = c.find(K + 'styleUrl'); su = su.text[1:] if su is not None else ''
                    t = 'eau' if 'water' in icon.get(su, '') else 'nom'
                    out['noms'].append([round(p[1], 6), round(p[0], 6), nom, t])
                    continue
                cl = classe(dossier)
                for ls in c.iter(K + 'LineString'):
                    pts = rdp(coords(ls.find(K + 'coordinates').text), TOL_M)
                    if len(pts) >= 2:
                        out['lignes'].append({'n': nom, 'c': cl, 'z': zone, 'p': [r5(p) for p in pts]})
    walk(root, None)

sys.stdout.write(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
