"""Build the CPS2390 practice site from extracted, instructor-supplied TestBank text."""
from collections import Counter
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / 'sources'
CHAPTERS = [
    ('计算机系统概览', 'Welcome Aboard'),
    ('数据与运算', 'Bits, Data Types, and Operations'),
    ('数字逻辑', 'Digital Logic Structures'),
    ('冯诺依曼模型', 'The von Neumann Model'),
    ('LC-3 指令集', 'The LC-3'),
]
TYPES = {'tf': '判断题', 'mc': '选择题', 'fill': '填空题'}
CODES = {'tf': 'TF', 'mc': 'MC', 'fill': 'FB'}

# Editorial notes preserve the supplied keys, rather than silently changing them.
NOTES = {
    (1, 'tf', 1): '题库版权年份为 2004；涉及硬件规模的描述按原题历史语境理解。',
    (2, 'mc', 2): '原文答案为 C，但存在概念错误：进位不等于有符号溢出。例如 4 位补码 1111 + 1111 = 1110，并产生进位，结果 −2 仍在范围内。题库练习保留原键 C，请向老师复核。',
    (2, 'mc', 6): '原文选 C。若两个十进制数字之和超过 9，不能再用单个数字字符的 ASCII 编码表示；该表述需要限定结果仍是单个数字。',
    (2, 'mc', 12): '原文选 C。算术右移保留符号位；负数不能整除时，其舍入方向与某些语言的整数除法可能不同。',
    (2, 'mc', 14): '原文选 A，按教材比较加法器与逐位逻辑电路的延迟语境理解；不宜推广为所有处理器上两条指令的实际耗时。',
    (3, 'tf', 15): '原文为 True。互补输出的表述应限于锁存器的正常有效状态；禁止输入组合需要另行处理。',
    (5, 'mc', 18): '原文选 B。这里用减法结果的符号比较两个补码数；若发生有符号溢出，需要额外处理。',
}


def clean(text):
    return re.sub(r'[ \t]+', ' ', text).strip()


def parse():
    questions = []
    reports = []
    for chapter in range(1, 6):
        path = SOURCES / f'chap{chapter:02d}tq.txt'
        text = path.read_text()
        sections = list(re.finditer(r'^(True/False|TRUE-FALSE|Multiple Choice|Fill in (?:the )?Blanks)\s*$', text, re.M | re.I))
        assert len(sections) == 3, path
        counts = Counter()
        seen = Counter()
        numbers = {'tf': [], 'mc': [], 'fill': []}
        for i, section in enumerate(sections):
            heading = section.group(1).lower()
            kind = 'mc' if heading.startswith('multiple') else 'fill' if heading.startswith('fill') else 'tf'
            body = text[section.end():sections[i+1].start() if i+1 < len(sections) else len(text)]
            starts = list(re.finditer(r'^\s*#?(\d+)\.\s*', body, re.M))
            for j, start in enumerate(starts):
                number = int(start.group(1))
                source = body[start.end():starts[j+1].start() if j+1 < len(starts) else len(body)].strip()
                seen[kind, number] += 1
                occurrence = seen[kind, number]
                suffix = chr(96 + occurrence) if occurrence > 1 else ''
                label = f'C{chapter}-{CODES[kind]}{number:02d}{suffix}'
                note = NOTES.get((chapter, kind, number), '')
                if occurrence > 1:
                    note += ' 原文此题号重复；标签末尾 b 表示同号的第二条，题目未合并或删除。'
                q = dict(id=len(questions)+1, chapter=chapter-1, bank=kind, type=kind,
                         label=label, source_file=f'chap{chapter:02d}tq.doc', source_number=number,
                         source_occurrence=occurrence, source_text=source,
                         note=note.strip(), explanation='')
                if kind == 'tf':
                    match = re.search(r'\(\s*([TF])\s*\)\s*\.?\s*$', source, re.I)
                    assert match, (label, source)
                    q.update(text=source[:match.start()].strip(), options=['True', 'False'],
                             answer='A' if match[1].upper() == 'T' else 'B', source_answer=match[1].upper())
                elif kind == 'mc':
                    key = re.search(r'^\s*Answer\s*:\s*([a-f])\.?\s*$', source, re.M | re.I)
                    assert key, (label, source)
                    content = source[:key.start()].rstrip()
                    options = list(re.finditer(r'^\s*([a-f])\s*\.\s*', content, re.M))
                    assert 3 <= len(options) <= 6, (label, options)
                    hint = ''
                    items = []
                    for oi, option in enumerate(options):
                        assert option[1].lower() == 'abcdef'[oi], label
                        value = content[option.end():options[oi+1].start() if oi+1 < len(options) else len(content)].strip()
                        if '(Hint:' in value:
                            value, hint = value.split('(Hint:', 1)
                            hint = '(Hint:' + hint
                        items.append(clean(value))
                    stem = content[:options[0].start()].strip()
                    if hint:
                        stem += '\n\n' + hint
                    q.update(text=stem, options=items, answer=key[1].upper(), source_answer=key[1].upper())
                    assert ord(q['answer'])-ord('A') < len(items), label
                else:
                    answers = []
                    def blank(match):
                        value = match[1].strip()
                        if value == 'n' and source[match.start()-1:match.start()] == 'a':
                            return match[0]  # Preserve a(n), a grammatical parenthesis.
                        if value.startswith('by generalizing '):
                            return match[0]  # Preserve the explanatory parenthesis in C3-FB01.
                        answers.append(value)
                        return f'____[{len(answers)}]'
                    stem = re.sub(r'\(([^()]*)\)', blank, source)
                    assert answers, label
                    q.update(text=stem, options=[], answer=None, answers=answers, source_answer=answers)
                questions.append(q)
                counts[kind] += 1
                numbers[kind].append(number)
        reports.append(dict(file=path.name, extracted_text_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                            questions=sum(counts.values()), types=dict(counts), source_numbers=numbers))
    assert len({q['label'] for q in questions}) == len(questions)
    assert [q['id'] for q in questions] == list(range(1, len(questions)+1))
    chapters = [dict(name=name, english=english) for name, english in CHAPTERS]
    data = dict(course=dict(code='CPS2390', school='Wenzhou-Kean University', instructor='Qixia Zhang',
                            term='26Fall', storage_key='cps2390-testbank-v1'), chapters=chapters, questions=questions)
    (ROOT / 'questions.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    (ROOT / 'source-audit.json').write_text(json.dumps(dict(total=len(questions), files=reports), ensure_ascii=False, indent=2)+'\n')
    return data


def build():
    data = parse()
    template = (ROOT / 'template.html').read_text()
    (ROOT / 'index.html').write_text(template.replace('__QUIZ_DATA__', json.dumps(data, ensure_ascii=False).replace('</', '<\\/')))
    print(json.dumps({'questions':len(data['questions']), 'types':dict(Counter(q['type'] for q in data['questions']))}, ensure_ascii=False))


if __name__ == '__main__':
    build()
