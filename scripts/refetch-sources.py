"""Optional network audit: compare upstream source bytes without replacing local files."""
import concurrent.futures,datetime,hashlib,json,pathlib,urllib.request,time
root=pathlib.Path(__file__).resolve().parents[1]
p=json.loads((root/'public/sources/provenance.json').read_text())
urls={f'sources/{name}':url for name,url in p['scan_urls'].items()}
for lang in ['grc2','eng2']:
 urls[f'sources/perseus-{lang}.xml']=f'https://raw.githubusercontent.com/PerseusDL/canonical-greekLit/{p["commit"]}/data/tlg0014/tlg035/tlg0014.tlg035.perseus-{lang}.xml'
def compare(item):
 name,url=item
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Nautikon-source-audit/1'}),timeout=25) as response: raw=response.read();status=response.status
   break
  except Exception as error:
   print(f'{name}: attempt {attempt+1}: {error}',flush=True)
   if attempt==2: return {'path':name,'url':url,'matchesRetained':False,'error':str(error)}
   time.sleep(attempt+1)
 local=(root/'public'/name).read_bytes()
 assert raw==local,f'Upstream differs: {name}'
 return {'path':name,'url':url,'status':status,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'matchesRetained':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(compare,urls.items()))
assert all(row['matchesRetained'] for row in results), results
record={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Fresh complete upstream responses compared with retained bytes; no replacements','files':results}
out=root/'test-results/source-refetch.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(record,indent=2)+'\n');print(f'Independently refetched and matched {len(results)} primary source files; {out.relative_to(root)}')
