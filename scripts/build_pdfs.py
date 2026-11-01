"""Generate the two downloadable classroom PDFs from shared lesson data."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'lesson.json').read_text(encoding='utf-8'))
pdfmetrics.registerFont(TTFont('Note',str(ROOT/'assets/NanumGothic-Regular.ttf')))
INK='#2d2840'; PURPLE='#7157b7'; MUTED='#655e75'; LINE='#e1d9eb'
W,H=595.28,841.89

def text(c,value,x,y,width=505,size=10,leading=17,color=INK):
    p=Paragraph(escape(value).replace('\n','<br/>'),ParagraphStyle('p',fontName='Note',fontSize=size,leading=leading,textColor=HexColor(color),wordWrap='CJK'))
    _,height=p.wrap(width,1000)
    if y>=53 and y-height<43: raise ValueError('Text exceeds page: '+value[:40])
    p.drawOn(c,x,y-height)
    return y-height

def header(c,n,kind,title,subtitle):
    c.setFillColor(HexColor('#eee8fa'));c.rect(0,H-17,W,17,fill=1,stroke=0)
    text(c,DATA['title'],45,805,size=8,leading=12,color=PURPLE)
    text(c,kind,415,805,width=135,size=8,leading=12,color=PURPLE)
    text(c,title,45,770,size=25,leading=34)
    text(c,subtitle,45,722,size=10,leading=16,color=MUTED)
    c.setStrokeColor(HexColor(LINE));c.line(45,53,550,53)
    text(c,'청주여자중학교 3학년 · 기술·가정 · 생명기술',45,42,size=8,leading=10,color=MUTED)
    text(c,f'{n:02}',525,42,width=25,size=8,leading=10,color=PURPLE)

def box(c,title,body,y,fill='#f4f0fa',height=None):
    style=ParagraphStyle('measure',fontName='Note',fontSize=10,leading=17,wordWrap='CJK')
    p=Paragraph(escape(body).replace('\n','<br/>'),style);_,h=p.wrap(465,1000)
    height=height or h+62
    c.setFillColor(HexColor(fill));c.roundRect(45,y-height,505,height,12,fill=1,stroke=0)
    text(c,title,63,y-16,width=465,size=13,leading=20,color=PURPLE)
    text(c,body,63,y-44,width=465,size=10,leading=17)
    return y-height-12

def field(c,f,y,height):
    text(c,f['title'],45,y,size=13,leading=19,color=PURPLE)
    qy=text(c,f['prompt'],45,y-25,size=9,leading=15,color=MUTED)
    bottom=y-height
    c.setStrokeColor(HexColor(LINE));c.setLineWidth(.6)
    line=qy-25
    while line>bottom+6:c.line(45,line,550,line);line-=22
    return bottom-17

def new_canvas(name):
    c=canvas.Canvas(str(ROOT/'downloads'/name),pagesize=(W,H))
    c.setTitle(DATA['title']);c.setAuthor('청주여자중학교 수업 자료');return c

def kit():
    c=new_canvas('bio-learning-kit.pdf')
    header(c,1,'LEARNING / 01','작은 생명에서, 더 나은 내일로.','학습자료 1 · 우리 동네에서 시작하는 생명기술 | 45분 · 3~4인 모둠')
    y=680
    y=box(c,'우리 곁의 바이오 연구, 청주 오송','오송에는 생명과학단지와 첨단의료복합단지가 있다. 신약과 의료기기 연구를 돕는 지역 기반을 출발점으로 생명기술을 탐구하자. 아래 연구 의뢰는 수업용 가상 상황이며 특정 기관의 실제 사업이 아니다.',y,'#e5f3ed')
    for item in DATA['concepts']:y=box(c,item['label']+' | '+item['title'],item['body'],y)
    text(c,'오늘의 도착점',45,y,size=12,leading=19,color=PURPLE)
    for objective in DATA['objectives']:y-=24;text(c,'• '+objective,45,y,size=9,leading=15)
    c.showPage()
    header(c,2,'LEARNING / 02','생명기술의 과정을 연결해요','학습자료 2 · 기술 시스템, 그리고 책임 있는 선택')
    y=680
    for s in DATA['system']:y=box(c,s['name'],s['body'],y,'#e5f3ed' if s['name']!='되먹임' else '#eee8fa')
    y=box(c,'과정 카드의 순서를 찾아보자','A. 회수·가공·정제   B. 생산 미생물 준비\nC. 품질 확인   D. 조건을 관리하며 배양\n올바른 순서: (     ) → (     ) → (     ) → (     )\n질문: 품질 확인 결과가 좋지 않다면 무엇을 바꿔 볼까?',y,'#fff6e6')
    text(c,'생산량만 늘면 충분할까?',45,y,size=12,leading=20,color=PURPLE)
    y=text(c,'도움: 필요한 의약품을 안정적으로 생산할 가능성.\n함께 볼 점: 품질, 생산 비용과 접근성, 에너지와 폐기물 관리.\n근거 없이 “항상 안전하다”, “모두에게 저렴하다”고 단정하지 않는다.',45,y-26,size=9,leading=16)
    text(c,'근거: 청주시 오송읍 기본현황 · KBIOHealth 첨복단지 소개 · 미국 FDA, 100 Years of Insulin. 자세한 링크는 웹페이지 자료 출처에서 확인.',45,y-15,size=8,leading=13,color=MUTED)
    c.showPage()
    header(c,3,'WORKSHEET / 01','나의 생각을 연구로 바꾸기','빈 활동지 1 · 개인 생각과 모둠 연구 제안')
    text(c,'3학년 (     )반 (     )번   이름/별칭 (                  )   모둠 (                  )',45,681,size=10)
    y=641
    for f,h in zip(DATA['fields'][:4],[100,148,100,120]):y=field(c,f,y,h)
    c.showPage()
    header(c,4,'WORKSHEET / 02','좋은 기술에는 책임이 따라요','빈 활동지 2 · 영향 평가, 동료 피드백, 나의 성찰')
    y=681
    for f,h in zip(DATA['fields'][4:],[137,137,100,100]):y=field(c,f,y,h)
    text(c,'스스로 점검: □ 원리를 정확하게 설명했다  □ 효과의 근거를 썼다  □ 우려와 대책을 연결했다',45,y,size=9,leading=16,color=PURPLE)
    c.save()

def teacher():
    c=new_canvas('bio-teacher-guide.pdf')
    header(c,1,'TEACHER / 01','45분, 오송 바이오 연구팀','2026학년도 중3 기술·가정 · 교사용 수업 운영안')
    y=box(c,'수업 준비','학생 개인 기기와 3~4인 모둠. 인터넷 연결과 PDF 저장 위치를 먼저 확인한다. 기기가 부족하면 학습자료·활동지 4쪽을 인쇄한다. 모둠 역할은 자료 탐색·원리 설명·윤리 검토·기록 및 공유로 나눈다.',680,'#e5f3ed')
    schedule=[('0~5분 | 도입','오송의 바이오 연구 기반을 소개하고 첫 생각을 쓴다. “작은 미생물이 의약품을 만드는 데 어떻게 도움을 줄까?”로 시작한다.'),('5~15분 | 개념 학습','생명기술의 뜻과 유전 정보의 역할을 설명한다. 인슐린은 단백질이며, 미생물을 사람으로 바꾸는 기술이 아님을 확인한다.'),('15~23분 | 시스템 탐구','과정 배열과 시스템 활동지를 작성한다. 품질 검사는 과정의 일부이고 그 결과로 공정을 고치는 것이 되먹임임을 구분한다.'),('23~38분 | 모둠 제안','품질·낭비·접근성 중 한 문제에 집중한다. 원리 → 방법 → 기대 효과와 근거 → 우려와 대책 순으로 작성한다.'),('38~45분 | 공유와 성찰','짝 모둠끼리 2분 공유, 개념 퀴즈 3분, 출구 질문과 PDF 저장 2분. 학생은 학교에서 안내한 방식으로 PDF를 제출한다.')]
    for title,body in schedule:y=box(c,title,body,y,height=83)
    text(c,'운영 조정: 시간이 부족하면 개념 퀴즈를 구두 확인하고 성찰은 한 문장으로 쓴다. 모둠 결과를 공유하더라도 최종 성찰은 개인별로 작성한다.',45,y,size=9,leading=15,color=MUTED)
    c.showPage()
    header(c,2,'TEACHER / 02','답보다, 근거를 함께 살펴요','예시 답안 · 예상 오개념 · 형성평가 기준')
    y=box(c,'과정 배열과 개념 퀴즈','카드 순서: B → D → A → C. 웹 퀴즈 정답: ②, ③, ①.\n되먹임 예: 오염 여부와 생산량을 확인하고 배양 환경·공정 관리를 개선한다. 품질 확인은 최종 단계에서만 한다는 뜻은 아니며, 실제 공정에는 여러 단계의 검사가 있다.',680,'#e5f3ed')
    y=box(c,'모둠 제안 예시 | 품질을 일정하게','문제: 생산 조건이 달라지면 생산량과 품질 관리에 어려움이 생길 수 있다.\n제안: 배양 조건과 검사 결과를 함께 기록하고, 기준에서 벗어나면 원인을 찾아 공정을 조정한다.\n기대 효과: 개인에게는 믿을 수 있는 의약품 이용에, 사회에는 안정적인 공급에 도움을 줄 수 있다.\n우려·대책: 관리 설비와 검사 비용이 늘 수 있다. 필요한 관리 항목을 비교해 개선 효과와 비용을 함께 평가한다. 실제 효과는 검증이 필요하다.',y)
    y=box(c,'예상 오개념을 바로잡는 질문','“미생물을 사람으로 바꾸나요?” → 특정 단백질 생산 정보를 이용하는 것이다.\n“배양액이 곧 약인가요?” → 회수·가공·정제·품질 확인이 필요하다.\n“많이 만들면 누구나 싸게 쓰나요?” → 가격과 공급, 제도 등도 영향을 미친다.\n“의료기기는 모두 생명기술인가요?” → 생물 또는 생명 현상의 활용 여부를 따져 본다.',y,'#fff6e6')
    text(c,'형성평가 | 각 항목 0~2점, 피드백 중심',45,y,size=12,leading=19,color=PURPLE)
    rubric=['원리의 정확성: 2 시스템과 생물 역할을 연결 / 1 일부만 설명 / 0 설명 없음 또는 핵심 오류','효과의 근거: 2 개인·사회 효과와 자료 근거 제시 / 1 효과만 제시 / 0 근거 없는 단정','책임 있는 대안: 2 우려·대책·확인 방법 연결 / 1 우려와 대책 일부 제시 / 0 대책 없음']
    for r in rubric:y=text(c,r,45,y-25,size=9,leading=15)
    c.showPage()
    header(c,3,'TEACHER / 03','교육과정과 자료의 근거','2015 개정과 2022 개정을 구분하여 활용합니다')
    y=box(c,'2026학년도 중3 | 2015 개정','[9기가04-08] 생명 기술 시스템의 각 단계별 세부 요소 및 생명 기술의 활용 분야를 이해하고 생명 기술의 발달 전망을 예측한다.\n[9기가04-09] 생명 기술의 특징을 이해하고 생명 기술의 발달이 개인과 사회에 미치는 영향을 구체적으로 설명한다.\n교육부 고시 제2015-74호 별책 10, 인쇄 쪽수 22~23쪽(파일 26~27쪽) 확인. 시스템 사례 설명, 탐구·토의·토론, 윤리적 문제 판단을 반영했다. 본 차시는 시스템·영향 분석 중심이며 단원 전체를 대체하지 않는다.',680)
    y=box(c,'후속 연결 | MCP에서 확인한 2022 개정','[9기가04-10] 의료 분야 생명기술 사례 조사와 개인·사회 영향 평가.\n[9기가04-11] 생명기술 관련 문제의 해결 방안 탐색·실현·평가, 생명 존중·윤리.\n중3에는 2027학년도부터 적용한다. 위 코드의 뜻은 2015 개정과 다르므로 코드만으로 혼용하지 않는다. MCP의 세부 주제는 원문을 바탕으로 만든 후보 자료이며 공식 지도서 자체는 아니다.',y,'#e5f3ed')
    text(c,'자료 출처 · 확인일 2026-11-01',45,y,size=12,leading=19,color=PURPLE);y-=30
    for s in DATA['sources']:
        y=text(c,s['title']+' — '+s['use'],45,y,size=8,leading=13)-3
        # Link human-readable source titles; avoid long URL strings overwhelming the page.
        c.linkURL(s['url'],(45,y+3,550,y+18),relative=0,thickness=0)
        y-=8
    text(c,'수업용 가상 의뢰이며 특정 기관의 실제 연구 또는 학교의 공식 사업을 뜻하지 않는다. 학생의 건강 정보나 가족 병력은 묻지 않는다. 교사용 자료는 공개되어 있으므로 평가 보안용 정답지로 사용하지 않는다.',45,y-4,size=9,leading=15,color=MUTED)
    c.save()

if __name__=='__main__':
    kit();teacher();print('Created learning kit (4 pages) and teacher guide (3 pages).')
