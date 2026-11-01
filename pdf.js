(function(root){
  'use strict';
  async function buildAnswerPdf(lesson,state,fontBytes,lib,kit){
    const {PDFDocument,rgb}=lib;
    const pdf=await PDFDocument.create(); pdf.registerFontkit(kit);
    const font=await pdf.embedFont(fontBytes,{subset:true});
    const supported=new Set(font.getCharacterSet());
    const safe=value=>Array.from(String(value??'')).map(c=>c==='\n'||c==='\t'||supported.has(c.codePointAt(0))?c:'[U+'+c.codePointAt(0).toString(16).toUpperCase()+']').join('').replace(/\t/g,'    ');
    const ink=rgb(.18,.16,.25),purple=rgb(.40,.29,.63),muted=rgb(.4,.37,.46);
    let page,y,pageNo=0;
    function newPage(){page=pdf.addPage([595.28,841.89]);pageNo++;y=775;page.drawRectangle({x:0,y:820,width:595.28,height:22,color:rgb(.92,.89,.97)});page.drawText(safe('중학교 3학년 생명기술 연구노트 · 내 답안'),{x:45,y:800,size:9,font,color:purple});page.drawText(String(pageNo),{x:540,y:27,size:9,font,color:muted});page.drawText(safe('청주여자중학교 3학년 | 기술·가정 | 2026'),{x:45,y:27,size:8,font,color:muted});}
    function ensure(h){if(y-h<55)newPage();}
    function write(value,size=11,color=ink,gap=7){
      const lineHeight=size*1.7; const maxWidth=505;
      const lines=[];
      for(const paragraph of safe(value).split('\n')){
        let line='';
        for(const c of paragraph){if(font.widthOfTextAtSize(line+c,size)>maxWidth&&line){lines.push(line);line=c;}else line+=c;}
        lines.push(line);
      }
      for(const line of lines){ensure(lineHeight);if(line)page.drawText(line,{x:45,y,size,font,color});y-=lineHeight;}y-=gap;
    }
    newPage();pdf.setTitle('중학교 3학년 생명기술 연구노트 - 내 활동지');pdf.setAuthor('청주여자중학교 수업 자료');pdf.setSubject('2026학년도 중3 기술·가정 생명기술');
    write('중학교 3학년 생명기술 연구노트',23,purple,15);
    const identity=state.identity||{},answers=state.answers||{};
    write('반: '+(identity.classroom||'미입력')+'   번호: '+(identity.number||'미입력'),11);
    write('이름 / 별칭: '+(identity.student||'미입력')+'   모둠: '+(identity.team||'미입력'),11);
    write('기기에서 작성한 개인 기록입니다. PDF 파일을 선생님이 안내한 방식으로 제출하세요.',9,muted,14);
    for(const field of lesson.fields){ensure(100);write(field.title,14,purple,3);write(field.prompt,9,muted,6);write(answers[field.id]?.trim()||'(아직 작성하지 않았어요.)',11,ink,15);}
    ensure(100);write('과정 배열 기록',14,purple,4);
    write((state.order||[]).map((id,i)=>(i+1)+'. '+(lesson.steps.find(s=>s.id===id)?.title||'')).join('\n')||'(아직 기록이 없어요.)');
    write('개념 확인 기록',14,purple,4);
    for(let i=0;i<lesson.quizzes.length;i++){const q=lesson.quizzes[i];const choice=state.quiz?.[i];ensure(70);write((i+1)+'. '+q.question,10);write('나의 선택: '+(Number.isInteger(choice)?q.choices[choice]:'미응답'),10,muted);}
    write('글꼴에 없는 특수 기호는 [U+코드]로 기록합니다. 원래 글자의 유니코드 값입니다.',8,muted);
    return pdf.save();
  }
  root.BioPDF={buildAnswerPdf};
  if(typeof module!=='undefined')module.exports=root.BioPDF;
})(typeof window!=='undefined'?window:globalThis);
