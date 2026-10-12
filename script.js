const menu=document.getElementById('menuToggle');const nav=document.getElementById('navLinks');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));document.getElementById('year').textContent=new Date().getFullYear();const rows=[...document.querySelectorAll('#workflow li')],run=document.getElementById('runDemo'),reset=document.getElementById('resetDemo'),output=document.getElementById('demoOutput'),status=document.getElementById('demoStatus');let timers=[];function clear(){timers.forEach(clearTimeout);timers=[];rows.forEach(r=>{r.classList.remove('done','active');r.querySelector('.step-state').textContent='Waiting'});run.disabled=false;run.innerHTML='Run automation <span>→</span>';status.textContent='Ready to run';output.textContent='Your sample workflow is ready. Select an interest and run the demo.'}reset.addEventListener('click',clear);run.addEventListener('click',()=>{clear();run.disabled=true;run.textContent='Simulation running…';status.textContent='Processing';const interest=document.getElementById('interest').value;const booked=document.getElementById('scenario').value==='booked';const messages=[`Sample inquiry received: ${interest}. A contact record would be created in the CRM.`,`The contact would receive a tag: Interest — ${interest}.`,`A welcome email would be selected for the ${interest.toLowerCase()} segment.`,booked?`Appointment booked: the reminder is suppressed and no follow-up email is sent.`:`No appointment yet: a timed follow-up reminder would be queued.`,booked?`Booking confirmed: nurture stops and the appointment is recorded for reporting.`:`Lead remains unbooked: reporting tracks the open inquiry for later review. No booking is assumed.`];rows.forEach((row,i)=>{timers.push(setTimeout(()=>{if(i>0)rows[i-1].classList.remove('active');row.classList.add('active','done');row.querySelector('.step-state').textContent='Complete';output.textContent=messages[i];if(i===rows.length-1){status.textContent='Simulation complete';run.disabled=false;run.innerHTML='Run again <span>→</span>'}},550+i*850))})});

// Contact form uses Google Apps Script as a verified server-side bridge.
const inquiry=document.getElementById('inquiryForm');
if(inquiry){
 const cfg=window.PORTFOLIO_FORM_CONFIG||{};
 const note=document.getElementById('formNote');
 const button=inquiry.querySelector('button[type="submit"]');
 const ready=/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(cfg.scriptUrl||'') && cfg.turnstileSiteKey && !cfg.turnstileSiteKey.startsWith('REPLACE_');
 let captchaToken='';
 if(ready){
   button.disabled=false;
   note.textContent='Your inquiry will be sent securely. Please complete verification if prompted.';
   const widget=document.createElement('div'); widget.className='cf-turnstile';
   widget.dataset.sitekey=cfg.turnstileSiteKey;
   widget.dataset.callback='portfolioTurnstileDone';
   widget.dataset['expiredCallback']='portfolioTurnstileExpired';
   document.getElementById('turnstileContainer').append(widget);
   window.portfolioTurnstileDone=token=>{captchaToken=token};
   window.portfolioTurnstileExpired=()=>{captchaToken=''};
   const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js';script.async=true;script.defer=true;document.head.append(script);
 }
 inquiry.addEventListener('submit',e=>{
  e.preventDefault();
  if(!ready){note.textContent='Online submission is not yet activated. Please use the direct email link.';return;}
  if(!inquiry.checkValidity()){inquiry.reportValidity();return;}
  if(inquiry.elements.companyFax.value){note.textContent='Unable to process this inquiry.';return;}
  if(!captchaToken){note.textContent='Please complete the security verification first.';return;}
  const nonce=String(Date.now())+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='submission_'+nonce;frame.title='Inquiry submission';frame.className='submission-frame';document.body.append(frame);
  const transport=document.createElement('form');transport.method='POST';transport.action=cfg.scriptUrl;transport.target=frame.name;transport.className='submission-frame';
  const data=new FormData(inquiry);data.set('turnstileToken',captchaToken);data.set('nonce',nonce);
  for(const [key,value] of data.entries()){const input=document.createElement('input');input.name=key;input.value=value;transport.append(input)}
  document.body.append(transport);
  button.disabled=true;note.textContent='Sending your inquiry…';
  let finished=false;
  const cleanup=()=>{window.removeEventListener('message',receive);transport.remove();setTimeout(()=>frame.remove(),1000)};
  const timeout=setTimeout(()=>{if(!finished){finished=true;button.disabled=false;note.textContent='We could not confirm submission. Please check before trying again, or use the direct email link.';cleanup()}},25000);
  function receive(event){
   if(event.source!==frame.contentWindow || !event.data || event.data.kind!=='portfolio-inquiry' || event.data.nonce!==nonce)return;
   // Google Apps Script serves HTML through googleusercontent.com.
   if(!/^https:\/\/(?:[a-z0-9-]+\.)*googleusercontent\.com$/.test(event.origin) && event.origin!=='https://script.google.com')return;
   if(finished)return;finished=true;clearTimeout(timeout);button.disabled=false;
   if(event.data.ok){note.textContent='Thank you! Your inquiry has been received. I’ll get back to you by email.';inquiry.reset()}
   else{note.textContent=event.data.message||'Your inquiry could not be submitted. Please try again.'}
   if(window.turnstile){window.turnstile.reset();captchaToken=''}
   cleanup();
  }
  window.addEventListener('message',receive);
  transport.submit();
 });
}

// Visual CRM record and email preview; all content is simulated and local.
const previewStatus=document.getElementById('previewStatus');
const previewTag=document.getElementById('previewTag');
const previewAction=document.getElementById('previewAction');
const previewSubject=document.getElementById('previewSubject');
const previewBody=document.getElementById('previewBody');
function updatePreview(){
 const interest=document.getElementById('interest').value;
 const booked=document.getElementById('scenario').value==='booked';
 previewStatus.textContent=booked?'Appointment booked (sample)':'New inquiry (sample)';
 previewTag.textContent='Interest: '+interest;
 previewAction.textContent=booked?'Suppress follow-up; send booking confirmation':'Queue follow-up if not booked';
 previewSubject.textContent=booked?'Your consultation is confirmed':'Thanks for your interest in '+interest.toLowerCase();
 previewBody.textContent=booked?'Thanks for booking. Here is what to expect at your consultation. Your nurture reminders have been stopped.':'Thanks for reaching out about '+interest.toLowerCase()+'. Here are the next steps and a link to choose a convenient time to talk.';
}
run.addEventListener('click',updatePreview);
reset.addEventListener('click',()=>{previewStatus.textContent='Not created';previewTag.textContent='Waiting for inquiry';previewAction.textContent='Run the demo';previewSubject.textContent='Welcome email preview';previewBody.textContent='Select a service interest and run the simulation to see the sample message.'});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus();}});
