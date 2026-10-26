"""Build a legible typeface outline and centerline reveal masks from its glyphs."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.ndimage import distance_transform_edt,gaussian_filter1d
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
ROOT=Path(__file__).resolve().parents[1]
FONT=ROOT/'dist/assets/dancing-script.ttf'
ft=TTFont(FONT); gs=ft.getGlyphSet(); cmap=ft.getBestCmap(); upm=ft['head'].unitsPerEm
size=180;scale=size/upm;font=ImageFont.truetype(str(FONT),size)
def thin(binary):
 a=np.pad(binary.astype(np.uint8),1)
 for _ in range(180):
  removed=0
  for step in (0,1):
   p=a[1:-1,1:-1]; ns=[a[:-2,1:-1],a[:-2,2:],a[1:-1,2:],a[2:,2:],a[2:,1:-1],a[2:,:-2],a[1:-1,:-2],a[:-2,:-2]]
   n=sum(ns);trans=sum((ns[i]==0)&(ns[(i+1)%8]==1) for i in range(8))
   # Sum boolean transitions as integers, not logical OR.
   trans=np.stack([(ns[i]==0)&(ns[(i+1)%8]==1) for i in range(8)]).sum(axis=0)
   if step==0: c=(ns[0]*ns[2]*ns[4]==0)&(ns[2]*ns[4]*ns[6]==0)
   else:c=(ns[0]*ns[2]*ns[6]==0)&(ns[0]*ns[4]*ns[6]==0)
   kill=(p==1)&(n>=2)&(n<=6)&(trans==1)&c;removed+=kill.sum();p[kill]=0
  if not removed:break
 return a[1:-1,1:-1].astype(bool)
def trace(skeleton,dist):
 from scipy.interpolate import splprep,splev
 pixels=set(zip(*np.where(skeleton)))
 graph={p:set() for p in pixels}
 for y,x in pixels:
  for dy,dx in ((0,1),(0,-1),(1,0),(-1,0),(1,1),(-1,1),(1,-1),(-1,-1)):
   q=(y+dy,x+dx)
   if q not in pixels:continue
   # Diagonal shortcuts around a cardinal edge create false junctions.
   if dy and dx and ((y+dy,x) in pixels or (y,x+dx) in pixels):continue
   graph[(y,x)].add(q)
 # Remove tiny terminal spurs created by raster thinning.
 for _ in range(3):
  for p in list(graph):
   if p not in graph or len(graph[p])!=1:continue
   chain=[p];prev=None;cur=p
   while len(chain)<9:
    nxt=[q for q in graph[cur] if q!=prev]
    if len(nxt)!=1:break
    prev,cur=cur,nxt[0];chain.append(cur)
    if len(graph[cur])!=2:break
   if len(chain)<8 and len(graph[cur])>=3:
    for v in chain[:-1]:
     for q in graph[v]:graph[q].discard(v)
     del graph[v]
 edges={frozenset((p,q)) for p,ns in graph.items() for q in ns}
 result=[];last=None
 while edges:
  available={v for e in edges for v in e}
  degree={v:sum(frozenset((v,q)) in edges for q in graph[v]) for v in available}
  ends=[p for p in available if degree[p]==1]
  candidates=ends or list(available)
  if last is None:start=min(candidates,key=lambda p:p[1]+abs(p[0]-180)*.15)
  else:start=min(candidates,key=lambda p:(p[0]-last[0])**2+(p[1]-last[1])**2)
  points=[start];current=start;direction=None
  while True:
   ns=[q for q in graph[current] if frozenset((current,q)) in edges]
   if not ns:break
   def score(q):
    delta=np.array(q)-current
    return float(np.dot(delta,direction)/np.linalg.norm(delta)) if direction is not None else float(delta[1]-.1*abs(delta[0]))
   q=max(ns,key=score);edges.remove(frozenset((current,q)));points.append(q)
   if len(points)>6:direction=np.array(points[-1])-np.array(points[-6])
   else:direction=np.array(q)-current
   current=q
  last=current
  if len(points)<2:continue
  arr=np.array(points,dtype=float)
  distance=np.linalg.norm(np.diff(arr,axis=0),axis=1).sum()
  if distance<5:continue
  # Fit smooth cubic curves; only the true pen trajectory is animated.
  if len(points)>=5:
   tck,u=splprep([arr[:,1],arr[:,0]],s=len(arr)*.55,k=3)
   knots=np.linspace(0,1,max(3,int(distance/11)+1))
   xx,yy=splev(knots,tck);dx,dy=splev(knots,tck,der=1)
   d=f'M {xx[0]:.2f},{yy[0]:.2f}'
   for i in range(len(knots)-1):
    dt=(knots[i+1]-knots[i])/3
    d+=f' C {xx[i]+dx[i]*dt:.2f},{yy[i]+dy[i]*dt:.2f} {xx[i+1]-dx[i+1]*dt:.2f},{yy[i+1]-dy[i+1]*dt:.2f} {xx[i+1]:.2f},{yy[i+1]:.2f}'
  else:d='M '+' L '.join(f'{x:.2f},{y:.2f}' for y,x in arr)
  result.append({'d':d,'width':8.5})
 return result
chars={}
for c in sorted(set('BienvenidoWelcomeBienvenueBenvenuto')):
 name=cmap[ord(c)];g=gs[name];advance=ft['hmtx'][name][0]*scale
 pen=SVGPathPen(gs);g.draw(TransformPen(pen,(scale,0,0,-scale,20,190)))
 im=Image.new('L',(220,260));ImageDraw.Draw(im).text((20,190),c,font=font,fill=255,anchor='ls')
 a=np.array(im)>110; dist=distance_transform_edt(a)
 chars[c]={'outline':pen.getCommands(),'advance':round(advance,3),'strokes':trace(thin(a),dist)}
 if c=='i': chars[c]['strokes'].append({'d':'M 55,106 C 56,105 57,105 58,104','width':8.5})
# Curated broad Bézier curves remove raster skeleton jitter and junction spurs.
curated=json.loads((ROOT/'scripts/curated-curves.json').read_text())
for c,strokes in curated.items(): chars[c]['strokes']=[{'d':d,'width':8.5} for d in strokes]
(ROOT/'dist/assets/handwriting-font.json').write_text(json.dumps(chars,separators=(',',':')))
print('Built',len(chars),'Dancing Script glyphs')
