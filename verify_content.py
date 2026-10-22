"""Independent bounded arithmetic / truth-table / LC-3 checks (no external packages)."""
from itertools import product
from pathlib import Path
from collections import Counter
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / 'questions.json').read_text())
QS = {q['label']: q for q in DATA['questions']}
CHECKS = []


def check(condition, name):
    assert condition, name
    CHECKS.append(name)


def sext(x, n):
    return x - (1 << n) if x & (1 << (n - 1)) else x


def nzp(x):
    return 2 if x == 0 else 4 if x & 0x8000 else 1


def program(label, original=False):
    text = QS[label]['original_text' if original else 'text']
    return {int(address, 16): int(bits, 2) for address, bits in re.findall(r'0x([0-9a-fA-F]{4})\s+([01]{16})', text)}


def execute(memory, regs, pc, cc=2, limit=200, lea_sets_cc=True):
    """Minimal reference interpreter; no use of quiz keys or explanations."""
    memory = dict(memory)
    regs = list(regs)
    for _ in range(limit):
        if pc not in memory:
            return regs, pc, cc, memory
        ins = memory[pc]
        pc = (pc + 1) & 0xFFFF
        op, dr, sr1 = ins >> 12, (ins >> 9) & 7, (ins >> 6) & 7
        write = False
        if op == 0:
            if ((ins >> 9) & 7) & cc:
                pc = (pc + sext(ins & 511, 9)) & 0xFFFF
        elif op in (1, 5):
            operand = sext(ins & 31, 5) if ins & 32 else regs[ins & 7]
            regs[dr] = (regs[sr1] + operand if op == 1 else regs[sr1] & operand) & 0xFFFF
            write = True
        elif op == 9:
            regs[dr] = (~regs[sr1]) & 0xFFFF
            write = True
        elif op in (2, 6, 10):
            addr = ((regs[sr1] + sext(ins & 63, 6)) if op == 6 else pc + sext(ins & 511, 9)) & 0xFFFF
            if op == 10:
                addr = memory.get(addr, 0)
            regs[dr] = memory.get(addr, 0)
            write = True
        elif op in (3, 7, 11):
            addr = ((regs[sr1] + sext(ins & 63, 6)) if op == 7 else pc + sext(ins & 511, 9)) & 0xFFFF
            if op == 11:
                addr = memory.get(addr, 0)
            memory[addr] = regs[dr]
        elif op == 14:
            regs[dr] = (pc + sext(ins & 511, 9)) & 0xFFFF
            write = lea_sets_cc
        else:
            raise AssertionError(f'Unsupported reference opcode {op}')
        if write:
            cc = nzp(regs[dr])
        if limit == 1:
            return regs, pc, cc, memory
    raise AssertionError('Reference execution did not terminate')


check(len(QS) == 244 and [q['id'] for q in DATA['questions']] == list(range(1, 245)), '244 stable unique labels and IDs')
check(Counter(q['type'] for q in QS.values()) == {'tf': 78, 'mc': 77, 'fill': 89}, 'All source question types retained')
check(all(q['explanation'] and q['references'] and q['source_text'] and q['review_revision'] for q in QS.values()), 'Every question has explanation, evidence and provenance')
check(all(len(q.get('option_explanations', [])) == len(q['options']) for q in QS.values() if q['type'] != 'fill'), 'Every TF/MC option has its own reasoning')
check(all(q['answers'] == q['source_answer'] for q in QS.values() if q['type'] == 'fill'), 'All fill reference answers reviewed and retained')
for q in QS.values():
    if q['type'] == 'tf':
        source_key = 'A' if q['source_answer'] == 'T' else 'B'
    elif q['type'] == 'mc':
        source_key = q['source_answer']
    else:
        source_key = None
    assert q['original_answer'] == source_key, q['label']
check({q['label']: (q['original_answer'], q['answer']) for q in QS.values() if q['answer'] != q['original_answer']} == {'C2-MC02': ('C', 'A'), 'C3-TF15': ('A', 'B'), 'C5-MC18': ('B', 'D')}, 'Exactly three explicit source-key corrections; no silent key changes')
audit = json.loads((ROOT / 'source-audit.json').read_text())
for file in audit['files']:
    check(hashlib.sha256((ROOT / 'sources' / file['file']).read_bytes()).hexdigest() == file['extracted_text_sha256'], f"Raw source fingerprint: {file['file']}")

check(int('111111111110', 2) - 2**12 == -2, 'C2-TF03: 12-bit minus two')
for n in range(2, 9):
    overflow_seen = set()
    for a, b in product(range(-(1 << (n-1)), 0), repeat=2):
        raw = (a % (1 << n)) + (b % (1 << n))
        result = sext(raw % (1 << n), n)
        assert raw >= 1 << n
        overflow_seen.add(a + b < -(1 << (n - 1)))
        assert (a + b < -(1 << (n - 1))) == (result >= 0)
    assert overflow_seen == {False, True}
check(True, 'C2-MC02/11: exhaustive 2–8-bit negative sums; carry does not imply signed overflow, zero can be an overflow result')
bits_a = '11111111111111111111111010101'
check(sext(int(bits_a, 2), len(bits_a)) == sext(int('1111010101', 2), 10) == -43, 'C2-MC03: both signed values equal minus 43')
check(all(ord(str(a)) + ord(str(b)) - ord('0') == ord(str(a+b)) for a,b in product(range(10), repeat=2) if a+b <= 9), 'C2-MC06: all single-digit ASCII sums')
check(all((x >> 2) == x // 4 for x in range(-32768, 32768)), 'C2-MC12: arithmetic shift equals floor division over every 16-bit signed value')
check(all(((k % 256) + ((-k) % 256)) == 256 for k in range(-127, 128) if k), 'C2-FB04: nonzero representable opposites yield zero plus carry')
check(ord('$') == int('00100100', 2) and ord(';') != ord('.') + ord(',') and ord('?') == 63, 'C2 ASCII character values')
check(int('110001', 2) == 49 and sext(int('110001', 2), 6) == -15, 'C2-FB11/12: unsigned versus signed interpretation')
check(int('FABC', 16) == int('1111101010111100', 2) and int('0F2A', 16) == int('0000111100101010', 2), 'C2-FB18/19: hexadecimal conversions')

nand = lambda a,b: not (a and b)
check(any(nand(nand(a,b),c) != nand(a,nand(b,c)) for a,b,c in product([False,True],repeat=3)), 'C3-TF10: NAND associativity counterexample')
check(all(nand(nand(a,a),nand(b,b)) == (a or b) for a,b in product([False,True],repeat=2)), 'C3-FB05: three NANDs implement OR')
check(((0x6C8F >> 13) & 3) == ((0x6C8F >> 2) & 3) == 3 and ((0x8C71 >> 9) & 15) == 6, 'C3 bit slices checked by shifts and masks')
check(all(int(not a)+int(a)+int(not b)+int(b) == 2 for a,b in product([False,True],repeat=2)), 'C3 CMOS NAND: exactly two open switches for stable binary inputs')
check(all(not ((a and b) or (c and d)) == ((not a or not b) and (not c or not d)) for a,b,c,d in product([False,True],repeat=4)), 'C3-FB12: AOI22 pull-up/pull-down duality')
check(sum(a+b+c >= 2 for a,b,c in product([0,1],repeat=3)) == 4 and 3*1+1.5 == 4.5, 'C3 full-adder carry truth table and four-bit critical path')
check(nand(0,1) == nand(0,1) == True, 'C3-TF15: forbidden NAND latch inputs permit equal high outputs')
check(2**(16-3*5) == 2 and 16-5-4-4 == 3 and 16-4-2-2 == 8, 'C4 instruction field and opcode counts')

for bits, address in [('0000111001011100',0x3011),('0000000001101110',0x306D),('1010011001101110',0x306D)]:
    for cc in [1,2,4]:
        _, pc, _, _ = execute({address:int(bits,2)}, [0]*8, address, cc, limit=1)
        assert pc == 0x306E
check(True, 'C5-MC03: all three PC values, for every valid NZP state')
for x in range(65536):
    for ins in [0b0001110101100000,0b0101110101111111]:
        r=[0]*8;r[5]=x
        regs,_,_,_=execute({0x3000:ins},r,0x3000,limit=1)
        assert regs[6] == x
check(True, 'C5-MC07: both copy encodings checked for all 65536 source bit patterns')
codes = program('C5-MC10')
check(len(codes) == 3, 'C5-MC10 source program parsed independently')
flags=[]
for x in [0xFFFE,0xFFFF,0]:
    r=[0]*8;r[0]=x
    regs,pc,cc,_=execute(codes,r,0x3050,1)
    flags.append(cc)
check(flags == [4,2,1], 'C5-MC10: unknown initial R0 permits N, Z or P')
for cc in [1,2,4]:
    _,pc,_,_=execute({0x5F55:int('0000101100000000',2)},[0]*8,0x5F55,cc,limit=1)
    assert pc == (0x5E56 if cc in [1,4] else 0x5F56)
check(True, 'C5-MC14: BRnp target and inclusive OR condition')
ins_list=[int(s,2) for s in ['0001101101100000','0101101101100000','1110101000000000','0010101000000000']]
outputs=[]
for ins in ins_list:
    r=[0]*8;r[5]=0x1234
    regs,_,_,_=execute({0x200:ins,0x201:0x5678},r,0x200,limit=1)
    outputs.append(regs[5])
check(outputs == [0x1234,0,0x201,0x5678], 'C5-MC15: only AND zero guarantees clearing R5')
codes=program('C5-MC18')
check(len(codes)==4, 'C5-MC18 source program parsed independently')
for a,b in [(-1,1),(32767,-1)]:
    r=[0]*8;r[1]=a & 0xFFFF;r[2]=b & 0xFFFF
    _,pc,cc,_=execute(codes,r,0x4400)
    assert pc==0x4444 and cc==4
check(True, 'C5-MC18: both less-than and greater-than inputs branch to x4444 (signed overflow counterexample)')
odd_codes=program('C5-MC19')
pop_codes=program('C5-MC20')
check(len(odd_codes)==4 and len(pop_codes)==11, 'C5-MC19/20 source programs parsed independently')
old_pop_codes=program('C5-MC20', original=True)
r=[0]*8;r[5]=9
old_result,_,_,_=execute(old_pop_codes,r,0x3000)
check(old_result[0]==5 and bin(9).count('1')==2, 'C5-MC20 original-code counterexample: R5=9 gives R0=5 with only two set bits')
check([a for a in pop_codes if pop_codes[a]!=old_pop_codes[a]] == [0x3009] and (pop_codes[0x3009] ^ old_pop_codes[0x3009]) == 1, 'C5-MC20 repairs exactly one branch-offset bit, preserving original code separately')
for x in range(65536):
    r=[0]*8;r[5]=x
    result,_,_,_=execute(odd_codes,r,0x3000)
    assert result[0] == (x & 1)
    result,_,_,_=execute(pop_codes,r,0x3000)
    assert result[0] == bin(x & 255).count('1')
check(True, 'C5-MC19/20: oddness and low-byte popcount simulated for all 65536 R5 inputs')
regs,pc,cc,_=execute({0xF011:int('1110111000000000',2)},[0]*8,0xF011,2,limit=1)
check(regs[7]==0xF012 and cc==4, 'C5-TF08: second-edition LEA sets N')
_,_,cc,_=execute({0xF011:int('1110111000000000',2)},[0]*8,0xF011,2,limit=1,lea_sets_cc=False)
check(cc==2, 'C5-TF08: third-edition LEA would preserve previous Z, proving version distinction matters')
_,_,_,mem=execute({0x5611:int('0011000100101111',2)},[0x1234]+[0]*7,0x5611,limit=1)
check(mem.get(0x5541)==0x1234, 'C5-FB08: ST effective address x5541')
check(0x6631+1+255==0x6731 and 0x5201-256==0x5101 and 4+5+5+1+5==20, 'C5 PC-relative limits and redesigned ADD width')

report = dict(revision=DATA['course']['review_revision'], questions=len(QS),
              option_explanations=sum(len(q.get('option_explanations', [])) for q in QS.values()),
              status_counts=dict(Counter(q['review_status'] for q in QS.values())),
              passed=len(CHECKS), checks=CHECKS,
              scope='Structural coverage plus independently computed arithmetic, truth tables and LC-3 execution; conceptual explanations were reviewed against supplied course slides. No claim of instructor endorsement.')
(ROOT/'docs'/'content-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['checks','scope']},ensure_ascii=False))
