import subprocess, zlib, struct, sys, math, os, tempfile

def png_rgb(path):
    """Pure-python PNG decode -> (w, h, rows of (r,g,b))."""
    d = open(path,'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    i, idat, w = 8, b'', None
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]; typ = d[i+4:i+8]; body = d[i+8:i+8+ln]
        if typ == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', body[:10])
            assert depth == 8 and ctype in (2, 6), (depth, ctype)
            nch = 3 if ctype == 2 else 4
        elif typ == b'IDAT': idat += body
        elif typ == b'IEND': break
        i += 12 + ln
    raw = zlib.decompress(idat)
    stride = w * nch
    rows, prev = [], bytearray(stride)
    p = 0
    for _ in range(h):
        f = raw[p]; line = bytearray(raw[p+1:p+1+stride]); p += 1 + stride
        for x in range(stride):
            a = line[x-nch] if x >= nch else 0
            b = prev[x]
            c = prev[x-nch] if x >= nch else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        rows.append([tuple(line[x:x+3]) for x in range(0, stride, nch)])
        prev = line
    return w, h, rows

SRC = sys.argv[1]
CAPTION_BAND_FRAC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.13  # bottom 13% holds the caption
tmp = tempfile.mktemp(suffix='.png')
subprocess.run(['sips','-s','format','png',SRC,'--out',tmp],capture_output=True,check=True)
W,H,rows = png_rgb(tmp); os.unlink(tmp)

SCRIM_FRAC = 0.58
stops = [(0,0.94),(0.18,0.86),(0.42,0.62),(0.68,0.30),(1.0,0.0)]
def alpha_at(y):
    top = H*(1-SCRIM_FRAC)
    if y < top: return 0.0
    p = (H-y)/(H-top)
    for (p0,a0),(p1,a1) in zip(stops, stops[1:]):
        if p0 <= p <= p1: return a0 + (a1-a0)*((p-p0)/(p1-p0))
    return 0.0

def lin(c):
    c /= 255.0
    return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
def lum(px): return 0.2126*lin(px[0]) + 0.7152*lin(px[1]) + 0.0722*lin(px[2])
L1 = lum((225,222,219))
BG = (19,18,18)

worst, info = 99.0, None
y0 = int(H*(1-CAPTION_BAND_FRAC))
for y in range(y0, H):
    a = alpha_at(y)
    for x in range(0, int(W*0.65), 2):          # text lives on the left side
        raw = rows[y][x]
        comp = tuple(raw[i]*(1-a) + BG[i]*a for i in range(3))
        L2 = lum(comp)
        cr = (max(L1,L2)+0.05)/(min(L1,L2)+0.05)
        if cr < worst:
            worst, info = cr, dict(y=y, x=x, raw=raw, alpha=round(a,3),
                                   behind=tuple(round(v) for v in comp))
print(f"{os.path.basename(SRC)}  {W}x{H}")
print(f"  brightest pixel under caption : rgb{info['raw']}")
print(f"  scrim alpha there             : {info['alpha']}")
print(f"  composited background         : rgb{info['behind']}")
print(f"  worst-case contrast vs #e1dedb: {worst:.2f}:1   "
      f"({'AAA' if worst>=7 else 'AA' if worst>=4.5 else 'FAIL'})")
