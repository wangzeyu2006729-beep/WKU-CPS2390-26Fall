"""Shared presentation helpers. Content and grading stay course-specific."""
from pathlib import Path
from html import escape
import hashlib
import json
import re
from urllib.parse import urlparse


def source_hash(question):
    text = json.dumps([question['text'], question['options']], ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(text.encode()).hexdigest()


def prepare_ui(root, data):
    root = Path(root)
    data['course']['ui_version'] = '2026-10-22.zh1'
    translations = json.loads((root / 'translations.json').read_text())['questions']
    assert set(translations) == {q['label'] for q in data['questions']}, 'Translation coverage must be complete'
    for q in data['questions']:
        zh = translations[q['label']]
        assert zh['source_sha256'] == source_hash(q), f"Review stale translation: {q['label']}"
        assert zh['text'].strip() and len(zh['options']) == len(q['options']), q['label']
        assert all(t.strip() for t in zh['options']), q['label']
        assert re.findall(r'____\[\d+\]', zh['text']) == re.findall(r'____\[\d+\]', q['text']), q['label']
        q['zh'] = {'text': zh['text'], 'options': zh['options']}
    courses = json.loads((root / 'course-catalog.json').read_text())['courses']
    for key in ['id', 'code', 'storage_key', 'url']:
        assert len({c[key] for c in courses}) == len(courses), f'Duplicate course {key}'
    assert all(urlparse(c['url']).scheme == 'https' and urlparse(c['url']).netloc for c in courses)
    current = next(c for c in courses if c['code'] == data['course']['code'])
    assert current['storage_key'] == data['course']['storage_key']
    assert current['questions'] == len(data['questions'])
    items = []
    for c in courses:
        active = c['id'] == current['id']
        items.append(f'<a class="course-entry" data-course="{escape(c["id"])}" href="{escape(c["url"])}"'+(' aria-current="page"' if active else '')+f'><span><strong>{escape(c["code"])}</strong><small>{escape(c["description"])} · {c["questions"]} 题</small></span><span class="course-current">'+('当前' if active else '↗')+'</span></a>')
    header = f'''<header class="topbar"><div class="study-brand"><span class="study-name">WKU Study <small>26Fall</small></span><div class="course-context"><h1 class="sr-only">{escape(current['code'])} 课程练习</h1><details id="course-switch" class="course-switch" data-current-course="{escape(current['id'])}"><summary id="course-trigger" aria-label="切换课程，当前 {escape(current['code'])}" aria-expanded="false"><span>{escape(current['code'])}</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></summary><nav class="course-panel" aria-label="本学期课程"><div class="course-panel-heading">本学期课程 <span>Fall 2026</span></div>{''.join(items)}</nav></details><span class="course-meta">{escape(current['description'])}<span> · {escape(current['instructor'])}</span></span></div></div><button id="help" class="help-btn" aria-label="使用说明与快捷键">?</button></header>'''
    return {'__COURSE_HEADER__': header, '__PRACTICE_STYLES__': (root / 'practice-ui.css').read_text(), '__PRACTICE_SCRIPT__': (root / 'practice-ui.js').read_text()}
