"""Independent decimal-free account check, including withheld branches."""
import json,sys
from fractions import Fraction
count=0
for line in sys.stdin:
 r=json.loads(line);v=r['voyage'];a=r['account'];count+=1
 if v['departure'] is None or v['outcome']!='safe':
  assert a['debt'] is None and a['deficiency'] is None
  continue
 rate=Fraction(3,10) if v['departure']>0 else Fraction(9,40)
 gross=Fraction(3000)*(1+rate)
 if v['loss']=='enemies' or (v['loss']=='jettison' and v['consent']): gross-=v['lossAmount']
 assert gross.denominator==1 and a['debt']==gross.numerator
 if v['days']>20:
  # Conservation of claim after applying the sale, without assuming recovery.
  assert a['fromSale']+a['deficiency']==gross
  assert a['fromSale']<=v['sale'] and a['deficiency']>=0
 else: assert a['deficiency'] is None
print(f'Independent Fraction oracle: {count} voyage accounts checked.')
