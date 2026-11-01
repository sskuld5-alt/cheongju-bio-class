from pathlib import Path
import pymupdf as fitz
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
for name,count in [('bio-learning-kit.pdf',4),('bio-teacher-guide.pdf',3)]:
    p=ROOT/'downloads'/name;r=PdfReader(p);assert len(r.pages)==count
    content='\n'.join(page.extract_text() for page in r.pages)
    assert '청주여자중학교' in content and '\ufffd' not in content
    print(name, count, 'pages, Korean text present')
for name in ['answer-empty.pdf','answer-long.pdf']:
    p=ROOT/'tmp'/name;r=PdfReader(p);content='\n'.join(page.extract_text() for page in r.pages)
    assert '나의 오송 바이오 연구노트' in content
    if 'long' in name:
        for marker in ['끝-firstThought','끝-systemAnswer','끝-need','끝-idea','끝-benefit','끝-care','끝-peer','끝-exit','[U+1F9EC]']:assert marker in content,marker
    d=fitz.open(p)
    for i,page in enumerate(d):
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                for s in line['spans']:
                    x0,y0,x1,y1=s['bbox'];assert x0>=0 and y0>=0 and x1<=596 and y1<=842,(name,i,s)
        page.get_pixmap(matrix=fitz.Matrix(.8,.8)).save(str(ROOT/'tmp'/f'{p.stem}-{i+1}.png'))
    print(name,len(r.pages),'pages, all answers retained and text within page bounds')
