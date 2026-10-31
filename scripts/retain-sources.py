"""Rebuild the pinned local byte inventory after a deliberate source review."""
import hashlib,json,pathlib,xml.etree.ElementTree as E
root=pathlib.Path(__file__).resolve().parents[1]
assets=[]
for p in sorted((root/'public').rglob('*')):
    if p.is_file() and p.name!='manifest.json':
        raw=p.read_bytes()
        assets.append({'path':str(p.relative_to(root/'public')),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'mime':{'.jpg':'image/jpeg','.woff2':'font/woff2','.xml':'application/xml','.json':'application/json'}.get(p.suffix,'text/plain')})
(root/'src/asset-manifest.json').write_text(json.dumps(assets,indent=2)+'\n')
r=E.parse(root/'public/sources/perseus-grc2.xml');ns={'t':'http://www.tei-c.org/ns/1.0'}
sections=[{'section':n,'greek':' '.join(''.join(r.find(f'.//t:div[@n="{n}"]',ns).itertext()).split())} for n in range(9,15)]
(root/'src/content/sections.json').write_text(json.dumps(sections,ensure_ascii=False,indent=2)+'\n')
print(f'Retained {len(assets)} assets and six complete Greek sections.')
