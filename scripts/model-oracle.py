"""Enumerate raw days independently; check exact arithmetic with Fraction.

This checker does not import the TypeScript partition or account functions.
The historical premise is still a selected-clause reading, not an oracle for law.
"""
import json
import sys
from fractions import Fraction

accounts = claims = 0
for line in sys.stdin:
    row = json.loads(line)
    v, a = row['voyage'], row['account']
    accounts += 1
    days = [v['departure']] if v['departure'] is not None else [
        d for d in range(-30, 41) if d < v['arrival']
    ]
    rates = {300 if d > 0 else 225 for d in days}
    rate = next(iter(rates)) if len(rates) == 1 and v['route'] == 'pontus' else None
    assert a['perThousand'] == rate
    assert a['interest'] == (None if rate is None else 3 * rate)
    deduction = v['lossAmount'] if v['loss'] == 'enemies' or (
        v['loss'] == 'jettison' and v['consent']) else 0
    in_scope = v['outcome'] == 'safe' and v['route'] == 'pontus'
    debts = sorted({int(Fraction(3000) * (1 + Fraction(r, 1000))) - deduction
                    for r in rates}) if in_scope else []
    debt = debts[0] if len(debts) == 1 else None
    assert a['debt'] == debt
    if debt is None:
        assert a['balance'] is None and a['deficiency'] is None and a['stage'] == 'outside'
    else:
        assert a['balance'] == (0 if v['paid'] else debt)
        if v['days'] > 20 and not v['paid']:
            assert a['fromSale'] == min(debt, v['sale'])
            assert a['deficiency'] == max(0, debt - v['sale'])
        else:
            assert a['deficiency'] is None
    for c in row['claims']:
        claims += 1
        verdict = ('outside' if not in_scope else 'excluded' if c['amount'] not in debts
                   else 'forced' if len(debts) == 1 else 'possible')
        assert c['verdict'] == verdict
        assert c['debts'] == debts
        represented = [d for case in c['cases'] for d in range(
            case['departure']['first'], case['departure']['last'] + 1)]
        assert represented == days
        for case in c['cases']:
            d = case['departure']
            assert d['first'] <= d['witness'] <= d['last']
            expected = 3000 + 3 * d['rate'] - deduction if in_scope else None
            assert case['account']['debt'] == expected
print(f'Independent enumeration / Fraction oracle: {accounts} accounts; {claims} debt proposals checked.')
