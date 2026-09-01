#!/usr/bin/env python3
"""Move a card one position left or right in index.html.

    bin/reorder-card.py "Open Water" left

Splices the two <article> spans and keeps the whitespace between them, which a
naive join-the-regex-matches rewrite silently drops (the replace target then
never matches and the edit is a no-op).
"""
import re, sys

if len(sys.argv) != 3 or sys.argv[2] not in ('left', 'right'):
    sys.exit('usage: reorder-card.py "<Card Title>" left|right')
want, direction = sys.argv[1], sys.argv[2]

path = 'index.html'
src = open(path).read()
pat = re.compile(r'      <article class="card"[^>]*>.*?</article>\n', re.S)
matches = list(pat.finditer(src))

def title(text):
    m = re.search(r'card__title">([^<]+)', text)
    return m.group(1) if m else '?'

titles = [title(m.group(0)) for m in matches]
if want not in titles:
    sys.exit(f'no card titled {want!r}. found: {titles}')

i = titles.index(want)
j = i - 1 if direction == 'left' else i + 1
if not 0 <= j < len(matches):
    sys.exit(f'{want!r} is already at the {direction} end')

a, b = sorted((matches[i], matches[j]), key=lambda m: m.start())
between = src[a.end():b.start()]
out = src[:a.start()] + b.group(0) + between + a.group(0) + src[b.end():]
open(path, 'w').write(out)

after = [title(m.group(0)) for m in pat.finditer(out)]
assert after != titles, 'nothing changed'
print('before:', titles)
print('after :', after)
