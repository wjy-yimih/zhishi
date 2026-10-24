/* Shared by the offline planner and reminder tooling; calendar arithmetic uses UTC dates. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.StudyPlanEngine=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DAY=86400000, REVIEW_MINUTES=4, REFLECTION_MINUTES=10, MAX_DAYS=366;
  const blocked=new Set(['__proto__','prototype','constructor']);
  const validId=id=>typeof id==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(id)&&!blocked.has(id);
  const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
  function parseISO(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('日期请使用 YYYY-MM-DD 格式。');
    const [year,month,day]=value.split('-').map(Number),date=new Date(0);
    if(year<1||month<1||month>12||day<1||day>31)throw Error('日期不存在。');
    date.setUTCHours(0,0,0,0);date.setUTCFullYear(year,month-1,day);
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw Error('日期不存在。');
    return date;
  }
  function toISO(value){
    const date=typeof value==='string'?parseISO(value):value;
    if(!(date instanceof Date)||!Number.isFinite(date.getTime())||date.getUTCFullYear()<1||date.getUTCFullYear()>9999)throw Error('日期超出支持范围。');
    return String(date.getUTCFullYear()).padStart(4,'0')+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0');
  }
  function addDays(value,amount){
    if(!Number.isInteger(amount)||Math.abs(amount)>3660000)throw Error('天数必须是有效整数。');
    return toISO(new Date(parseISO(value).getTime()+amount*DAY));
  }
  function addMonths(value,amount=2){
    if(!Number.isInteger(amount)||Math.abs(amount)>120000)throw Error('月数必须是有效整数。');
    const date=parseISO(value),day=date.getUTCDate();
    date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+amount);
    const next=new Date(date.getTime());next.setUTCMonth(next.getUTCMonth()+1);next.setUTCDate(0);
    date.setUTCDate(Math.min(day,next.getUTCDate()));return toISO(date);
  }
  const daysBetween=(start,end)=>Math.round((parseISO(end)-parseISO(start))/DAY);
  function today(timeZone='Asia/Shanghai'){
    try{
      const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
      return ['year','month','day'].map(type=>parts.find(p=>p.type===type).value).join('-');
    }catch{throw Error('时区无效，请使用 Asia/Shanghai 等 IANA 时区。');}
  }
  function catalog(courses){
    if(!Array.isArray(courses)||courses.length>30)throw Error('课程目录无效。');
    const result=[],courseIds=new Set(),lessonIds=new Set();
    for(let ci=0;ci<courses.length;ci++){
      const course=courses[ci];
      if(!course||!validId(course.id)||courseIds.has(course.id)||!Array.isArray(course.chapters))throw Error('课程编号或章节重复、缺失。');
      courseIds.add(course.id);
      for(let chi=0;chi<course.chapters.length;chi++){
        const chapter=course.chapters[chi];if(!chapter||!Array.isArray(chapter.lessons))throw Error('章节内容无效。');
        for(let li=0;li<chapter.lessons.length;li++){
          const lesson=chapter.lessons[li];
          if(!lesson||!validId(lesson.id)||lessonIds.has(lesson.id))throw Error('知识点编号重复或无效。');
          const minutes=lesson.minutes===undefined?20:lesson.minutes;
          if(typeof minutes!=='number'||!Number.isFinite(minutes)||minutes<1||minutes>1440)throw Error('知识点学习时长无效。');
          lessonIds.add(lesson.id);
          result.push({id:lesson.id,title:String(lesson.title||lesson.id).slice(0,500),courseId:course.id,courseTitle:String(course.title||course.id).slice(0,200),chapterTitle:String(chapter.title||'').slice(0,250),minutes:Math.round(minutes),order:result.length,courseOrder:ci,chapterOrder:chi,lessonOrder:li});
          if(result.length>10000)throw Error('目录过大，请分批规划。');
        }
      }
    }
    return result;
  }
  function windowDates(startDate,endDate){
    parseISO(startDate);const end=endDate===undefined?addDays(addMonths(startDate,2),-1):toISO(endDate);
    const length=daysBetween(startDate,end)+1;
    if(length<1||length>MAX_DAYS)throw Error('规划范围需要在 1—366 天之间，截止日期不能早于开始日期。');
    return {startDate,endDate:end,length};
  }
  function budget(value){
    if(!Number.isInteger(value)||value<15||value>1440)throw Error('每日学习时间请填写 15—1440 之间的整数分钟。');
    return value;
  }
  function cleanCompleted(values,ids,strict=false){
    if(!Array.isArray(values))throw Error('已完成记录应为列表。');
    const result=[],seen=new Set();
    for(const id of values){
      if(!validId(id)||!ids.has(id)||seen.has(id)){if(strict)throw Error('已完成知识点编号重复或无效。');continue;}
      seen.add(id);result.push(id);
    }
    return result;
  }
  function measuredDay(date,index,kind,lessonIds,reviewIds,byId){
    const newMinutes=lessonIds.reduce((n,id)=>n+byId.get(id).minutes,0),reviewMinutes=reviewIds.length*REVIEW_MINUTES;
    const reflectionMinutes=kind==='review'&&reviewIds.length?REFLECTION_MINUTES:0;
    return {date,index,kind,lessonIds,reviewIds,newMinutes,reviewMinutes,reflectionMinutes,minutes:newMinutes+reviewMinutes+reflectionMinutes};
  }
  function summarize(days,records,completedAtBuild,dailyMinutes){
    const scheduled=days.flatMap(d=>d.lessonIds),byId=new Map(records.map(l=>[l.id,l]));
    const totalMinutes=days.reduce((n,d)=>n+d.minutes,0),peakMinutes=Math.max(0,...days.map(d=>d.minutes));
    const newMinutes=scheduled.reduce((n,id)=>n+byId.get(id).minutes,0);
    const subjectCounts=days.map(d=>new Set(d.lessonIds.map(id=>byId.get(id).courseId)).size);
    return {totalLessons:records.length,scheduledLessons:scheduled.length,alreadyCompleted:completedAtBuild.length,totalMinutes,newMinutes,reviewMinutes:days.reduce((n,d)=>n+d.reviewMinutes,0),reflectionMinutes:days.reduce((n,d)=>n+d.reflectionMinutes,0),studyDays:days.filter(d=>d.lessonIds.length).length,reviewDays:days.filter(d=>d.kind==='review').length,pureReviewDays:days.filter(d=>d.kind==='review'&&!d.lessonIds.length).length,calendarDays:days.length,averageMinutes:days.length?Math.ceil(totalMinutes/days.length):0,peakMinutes,dailyMinutes,daysOverBudget:days.filter(d=>d.minutes>dailyMinutes).length,budgetExceeded:peakMinutes>dailyMinutes,extraMinutes:days.reduce((n,d)=>n+Math.max(0,d.minutes-dailyMinutes),0),subjectLimitExceeded:subjectCounts.some(n=>n>2),maximumSubjects:Math.max(0,...subjectCounts),threeSubjectDays:subjectCounts.filter(n=>n>2).length,coverageComplete:scheduled.length+completedAtBuild.length===records.length};
  }
  function build({courses,startDate,endDate,dailyMinutes=180,completed=[],nowDate}={}){
    const records=catalog(courses),byId=new Map(records.map(l=>[l.id,l])),range=windowDates(startDate,endDate);
    budget(dailyMinutes);if(nowDate!==undefined)parseISO(nowDate);
    const completedAtBuild=cleanCompleted(completed,byId),complete=new Set(completedAtBuild);
    const remaining=records.filter(l=>!complete.has(l.id));
    const days=Array.from({length:range.length},(_,i)=>({date:addDays(startDate,i),index:i+1,kind:range.length>=7&&((i+1)%7===0||(range.length>=8&&i===range.length-1))?'review':'study',lessonIds:[],reviewIds:[]}));
    const pureStudyDays=days.filter(d=>d.kind==='study');
    const remainingMinutes=remaining.reduce((n,l)=>n+l.minutes,0);
    // A two-month pass is the primary goal. Keep whole review days only when the
    // reading-time budget can afford them; otherwise the weekly checkpoint mixes
    // retrieval with new lessons instead of creating avoidable three-hour spikes.
    const hybridReview=remainingMinutes>pureStudyDays.length*Math.max(1,dailyMinutes-12);
    const studyDays=hybridReview?days:pureStudyDays;
    const weights=studyDays.map(d=>hybridReview&&d.kind==='review'?.86:1);
    const weightSum=weights.reduce((n,v)=>n+v,0),averageWeight=weightSum/studyDays.length;
    // Allocate two subject slots per study day in proportion to the supplied reading times.
    // Each subject's sequential lessons are then split into contiguous, nearly equal-time chunks.
    const queues=[];
    for(const lesson of remaining){
      let queue=queues.find(q=>q.id===lesson.courseId);
      if(!queue){queue={id:lesson.courseId,lessons:[],minutes:0,slots:1,leftSlots:0,lastDay:-1,order:queues.length};queues.push(queue);}
      queue.lessons.push(lesson);queue.minutes+=lesson.minutes;
    }
    if(queues.length<=studyDays.length*2){
      const capacity=Math.min(studyDays.length*2,remaining.length);
      let slots=queues.length;
      while(slots<capacity){
        const available=queues.filter(q=>q.slots<Math.min(q.lessons.length,studyDays.length));
        if(!available.length)break;
        available.sort((a,b)=>(b.minutes/b.slots)-(a.minutes/a.slots)||a.order-b.order);
        available[0].slots++;slots++;
      }
      queues.forEach(q=>q.leftSlots=q.slots);
      for(let di=0;di<studyDays.length;di++){
        const active=queues.filter(q=>q.leftSlots>0).sort((a,b)=>b.leftSlots-a.leftSlots||a.lastDay-b.lastDay||a.order-b.order).slice(0,2);
        for(const q of active){
          const target=q.minutes/q.leftSlots*(weights[di]/averageWeight),maxTake=q.lessons.length-(q.leftSlots-1);
          let take=1,minutes=q.lessons[0].minutes;
          while(take<maxTake&&(q.leftSlots===1||Math.abs(minutes+q.lessons[take].minutes-target)<=Math.abs(minutes-target))){minutes+=q.lessons[take].minutes;take++;}
          studyDays[di].lessonIds.push(...q.lessons.splice(0,take).map(l=>l.id));q.minutes-=minutes;q.leftSlots--;q.lastDay=di;
        }
      }
    }else{
      // A very short custom deadline can make two subjects per day mathematically impossible.
      // Cover every lesson anyway and surface subjectLimitExceeded rather than dropping content.
      let pendingMinutes=remaining.reduce((n,l)=>n+l.minutes,0),cursor=0;
      for(let di=0;di<studyDays.length;di++){
        const target=pendingMinutes/(studyDays.length-di),maxTake=remaining.length-cursor-(studyDays.length-di-1);
        let minutes=0;
        while(cursor<remaining.length&&(minutes<target||studyDays[di].lessonIds.length===0)&&studyDays[di].lessonIds.length<Math.max(1,maxTake)){
          const lesson=remaining[cursor++];studyDays[di].lessonIds.push(lesson.id);minutes+=lesson.minutes;
        }
        pendingMinutes-=minutes;
      }
      if(cursor<remaining.length)studyDays[studyDays.length-1].lessonIds.push(...remaining.slice(cursor).map(l=>l.id));
    }
    if(queues.some(q=>q.leftSlots>0||q.lessons.length>0)&&queues.length<=studyDays.length*2)throw Error('调度未完成，请重新生成。');
    // Lesson durations are indivisible. Move only boundary lessons to another
    // nearby occurrence of the same subject; this preserves prerequisite order
    // while using slack that equal-size chunks can leave in neighboring days.
    // A conservative review allowance keeps the subsequent retrieval step inside
    // the chosen daily budget whenever such a two-subject arrangement is found.
    const loads=days.map(d=>d.lessonIds.reduce((n,id)=>n+byId.get(id).minutes,0));
    const reviewCaps=days.map((d,i)=>Math.max(0,dailyMinutes-(i===0?0:d.kind==='review'?34:12)));
    for(let stage=0;stage<2;stage++){
      if(stage===1&&(!hybridReview||remainingMinutes>days.length*dailyMinutes))break;
      const caps=stage===0?reviewCaps:days.map(()=>dailyMinutes);
      for(let pass=0;pass<remaining.length*4;pass++){
      let best=null;
      const overloaded=days.map((d,i)=>i).filter(i=>loads[i]>caps[i]).sort((a,b)=>(loads[b]-caps[b])-(loads[a]-caps[a]));
      for(const si of overloaded){
        const subjectIds=[...new Set(days[si].lessonIds.map(id=>byId.get(id).courseId))];
        for(const cid of subjectIds){
          const ids=days[si].lessonIds.filter(id=>byId.get(id).courseId===cid);
          let prev=si-1,next=si+1;
          while(prev>=0&&!days[prev].lessonIds.some(id=>byId.get(id).courseId===cid))prev--;
          while(next<days.length&&!days[next].lessonIds.some(id=>byId.get(id).courseId===cid))next++;
          for(const direction of [-1,1]){
            const id=direction<0?ids[0]:ids[ids.length-1],minutes=byId.get(id).minutes;
            const from=direction<0?Math.max(0,prev):si+1,to=direction<0?si-1:Math.min(days.length-1,next);
            for(let ti=from;ti<=to;ti++){
              const targetSubjects=new Set(days[ti].lessonIds.map(lesson=>byId.get(lesson).courseId));
              if((!targetSubjects.has(cid)&&targetSubjects.size>=(stage===0?2:3))||loads[ti]+minutes>caps[ti])continue;
              const improvement=Math.min(minutes,loads[si]-caps[si]);
              const score=improvement*1000-(loads[ti]+minutes)-Math.abs(ti-si)*2;
              if(!best||score>best.score)best={si,ti,id,cid,minutes,direction,score};
            }
          }
        }
      }
      if(!best)break;
      const {si,ti,id,cid,minutes,direction}=best;
      days[si].lessonIds.splice(days[si].lessonIds.indexOf(id),1);
      const target=days[ti].lessonIds;
      if(direction>0){const at=target.findIndex(x=>byId.get(x).courseId===cid);if(at<0)target.push(id);else target.splice(at,0,id);}
      else {let at=-1;for(let i=0;i<target.length;i++)if(byId.get(target[i]).courseId===cid)at=i;if(at<0)target.push(id);else target.splice(at+1,0,id);}
      loads[si]-=minutes;loads[ti]+=minutes;
      }
    }
    // Retrieval prompts draw only from lessons assigned before this day, at 1/3/7/14 day lags.
    const previous=[];
    for(let i=0;i<days.length;i++){
      const day=days[i];if(!day.lessonIds.length)day.kind='review';
      const newMinutes=day.lessonIds.reduce((n,id)=>n+byId.get(id).minutes,0);
      const available=Math.max(0,dailyMinutes-newMinutes-(day.kind==='review'?REFLECTION_MINUTES:0));
      const reviews=[],limit=Math.min(day.kind==='review'?6:3,Math.floor(available/REVIEW_MINUTES));
      for(const lag of [1,3,7,14]){
        const earlier=days[i-lag];
        if(earlier?.lessonIds.length){const sample=earlier.lessonIds[Math.min(earlier.lessonIds.length-1,Math.floor(earlier.lessonIds.length/2))];if(!reviews.includes(sample))reviews.push(sample);}
      }
      if(day.kind==='review'){
        const seenCourses=new Set(reviews.map(id=>byId.get(id).courseId));
        for(let j=previous.length-1;j>=0&&reviews.length<limit;j--){const id=previous[j],cid=byId.get(id).courseId;if(!seenCourses.has(cid)&&!reviews.includes(id)){reviews.push(id);seenCourses.add(cid);}}
      }
      Object.assign(day,measuredDay(day.date,day.index,day.kind,day.lessonIds,reviews.slice(0,limit),byId));
      previous.push(...day.lessonIds);
    }
    const plan={version:1,startDate:range.startDate,endDate:range.endDate,dailyMinutes,completedAtBuild,days,summary:summarize(days,records,completedAtBuild,dailyMinutes),estimation:'新课使用站内每篇标注时长（未标注时按20分钟）；每个提取复习任务按4分钟，复习日另留10分钟整理。是首轮学习参考，练习难度和熟悉程度会改变实际用时。'};
    if(nowDate!==undefined)plan.createdForDate=nowDate;
    return plan;
  }
  function normalizePlan(raw,courses){
    try{
      if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1)return null;
      const records=catalog(courses),byId=new Map(records.map(l=>[l.id,l])),range=windowDates(raw.startDate,raw.endDate),dailyMinutes=budget(raw.dailyMinutes);
      if(!Array.isArray(raw.days)||raw.days.length!==range.length||!own(raw,'completedAtBuild'))return null;
      const completedAtBuild=cleanCompleted(raw.completedAtBuild,byId,true),seen=new Set(completedAtBuild),prior=new Set(completedAtBuild),days=[],lastOrder=new Map();
      const list=(value,max)=>{if(!Array.isArray(value)||value.length>max)throw Error('任务列表无效。');const found=new Set();return value.map(id=>{if(!validId(id)||!byId.has(id)||found.has(id))throw Error('任务编号无效。');found.add(id);return id;});};
      for(let i=0;i<raw.days.length;i++){
        const source=raw.days[i],date=addDays(range.startDate,i);
        if(!source||typeof source!=='object'||source.date!==date||source.index!==i+1||!['study','review'].includes(source.kind))return null;
        const lessonIds=list(source.lessonIds,records.length),reviewIds=list(source.reviewIds,6);
        if(source.kind==='study'&&!lessonIds.length)return null;
        for(const id of lessonIds){const lesson=byId.get(id);if(seen.has(id)||(lastOrder.has(lesson.courseId)&&lesson.order<=lastOrder.get(lesson.courseId)))return null;seen.add(id);lastOrder.set(lesson.courseId,lesson.order);}
        if(reviewIds.some(id=>!prior.has(id)))return null;
        days.push(measuredDay(date,i+1,source.kind,lessonIds,reviewIds,byId));lessonIds.forEach(id=>prior.add(id));
      }
      if(seen.size!==records.length)return null;
      const plan={version:1,startDate:range.startDate,endDate:range.endDate,dailyMinutes,completedAtBuild,days,summary:summarize(days,records,completedAtBuild,dailyMinutes),estimation:'新课使用站内每篇标注时长（未标注时按20分钟）；每个提取复习任务按4分钟，复习日另留10分钟整理。是首轮学习参考，练习难度和熟悉程度会改变实际用时。'};
      if(typeof raw.createdForDate==='string'){parseISO(raw.createdForDate);plan.createdForDate=raw.createdForDate;}
      return plan;
    }catch{return null;}
  }
  return Object.freeze({catalog,parseISO,toISO,addDays,addMonths,daysBetween,today,build,normalizePlan,REVIEW_MINUTES,REFLECTION_MINUTES});
});
