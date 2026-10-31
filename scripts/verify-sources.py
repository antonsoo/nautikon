"""Check actual retained bytes and the electronic-text concordance."""
import hashlib,json,pathlib,re,xml.etree.ElementTree as E
root=pathlib.Path(__file__).resolve().parents[1]
assets=json.loads((root/'src/asset-manifest.json').read_text())
for a in assets:
 raw=(root/'public'/a['path']).read_bytes()
 assert len(raw)==a['bytes'] and hashlib.sha256(raw).hexdigest()==a['sha256'],a['path']
r=E.parse(root/'public/sources/perseus-grc2.xml');ns={'t':'http://www.tei-c.org/ns/1.0'}
full=' '.join(' '.join(''.join(r.find(f'.//t:div[@n="{n}"]',ns).itertext()).split()) for n in range(9,15))
source=(root/'src/content/readings.ts').read_text()
excerpts=re.findall(r'greek:\s*"([^"]+)"',source)
assert len(excerpts)==6
for excerpt in excerpts: assert excerpt in full,excerpt
sections=json.loads((root/'src/content/sections.json').read_text())
for s in sections: assert s['greek']==' '.join(''.join(r.find(f'.//t:div[@n="{s["section"]}"]',ns).itertext()).split())
print(f'Checked {len(assets)} byte identities, six exact Greek excerpts and six full context sections. Scan interpretation remains a visual review.')

full=' '.join(' '.join(''.join(r.find(f'.//t:div[@n="{n}"]',ns).itertext()).split()) for n in [10,18,19,20,21,22])
source=(root/'src/content/testimony.ts').read_text()
excerpts=re.findall(r'greek:\s*"([^"]+)"',source)
assert len(excerpts)==4
for excerpt in excerpts: assert excerpt in full,excerpt
for s in json.loads((root/'src/content/testimony-sections.json').read_text()): assert s['greek']==' '.join(''.join(r.find(f'.//t:div[@n="{s["section"]}"]',ns).itertext()).split())
print('Also checked four testimony excerpts and five complete context sections.')
