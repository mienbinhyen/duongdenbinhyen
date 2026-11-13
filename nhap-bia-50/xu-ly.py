import sys, io, urllib.request, os
from PIL import Image, ImageChops
out = 'nhap-bia-50'
for line in open(os.path.join(out, 'danh-sach.txt')):
    s, url = line.split()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert('RGB')
    # cat vien trang
    g = im.convert('L').point(lambda v: 255 if v < 235 else 0)
    box = g.getbbox() or (0, 0) + im.size
    im = im.crop(box)
    im.thumbnail((600, 900))
    q = 90
    while True:
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q)
        if buf.tell() <= 125000 or q <= 40: break
        q -= 5
    open(os.path.join(out, s + '.webp'), 'wb').write(buf.getvalue())
    print(s, im.size, buf.tell())
