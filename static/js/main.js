import {GravityText} from './gravity-text.js';
import {ChromeScene} from './three-scene.js';
import {PixelWorld} from './pixel-world.js';

const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const headline=$('#headline'),veil=$('#blackout'),hint=$('#hint');
const scenes={type:$('#type-scene'),object:$('#object-scene'),pixel:$('#pixel-scene')};
const symbols='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&?!/+';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
let state='black',age=0,clock=0,last=0,accumulator=0,progress=0,target=0,quiet=0,scrollIntent=0;
let glyphs=[],chrome,pixels,gravity;

function stage(name){
  state=name;age=0;document.body.dataset.scene=name;
  hint.classList.remove('visible');
}
function show(name){
  for(const [key,node] of Object.entries(scenes)){
    node.classList.toggle('active',key===name);node.setAttribute('aria-hidden',String(key!==name));
  }
}
function makeText(){
  headline.replaceChildren();glyphs=[];
  for(const word of ['CREATE','SOMETHING','STRANGE.']){
    const line=document.createElement('span');line.className='line';line.setAttribute('aria-hidden','true');
    for(const char of word){
      const span=document.createElement('span');span.className='glyph';span.dataset.char=char;span.textContent=char;line.append(span);glyphs.push(span);
    }
    headline.append(line);
  }
  // Fix character advances before scrambling so random letters never move the layout.
  for(const el of glyphs){el.style.width=`${el.getBoundingClientRect().width}px`;}
}
function reset(){
  gravity?.clear();progress=target=0;quiet=0;scrollIntent=0;
  headline.style.visibility='visible';scenes.type.style.opacity='';
  makeText();show('type');veil.style.opacity=1;stage('black');
  $('#again').blur();$('#status').textContent='';
}
function forward(delta){
  if(state==='type'&&age>.8){
    scrollIntent=Math.max(0,scrollIntent+delta);
    if(scrollIntent<35)return;
    if(reduced){stage('type-fade');return;}
    gravity.start(headline);headline.style.visibility='hidden';quiet=0;stage('gravity');
    $('#status').textContent='The letters fall and settle. A new space opens.';
  }else if(state==='object'&&age>1.4){
    target=clamp(target+delta/(innerWidth<600?1300:1900));
    if(target>.015)hint.classList.remove('visible');
  }
}
addEventListener('wheel',e=>{
  if(e.ctrlKey)return;
  e.preventDefault();
  const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
  forward(clamp(e.deltaY*unit,-190,190));
},{passive:false});
let touchY=null;
addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY??null;},{passive:true});
addEventListener('touchmove',e=>{
  if(e.touches.length!==1||touchY===null)return;
  e.preventDefault();const y=e.touches[0].clientY;forward((touchY-y)*2.3);touchY=y;
},{passive:false});
addEventListener('touchend',()=>{touchY=null;});
addEventListener('keydown',e=>{
  if(e.target.closest('button'))return;
  const deltas={ArrowDown:130,PageDown:320,' ':240,ArrowUp:-130,PageUp:-320};
  if(e.key in deltas){e.preventDefault();forward(deltas[e.key]);}
});
addEventListener('pointermove',e=>{
  const x=e.clientX/innerWidth*2-1,y=e.clientY/innerHeight*2-1;
  if(chrome&&!reduced)chrome.pointer={x,y};if(pixels&&!reduced)pixels.pointer={x,y};
});
addEventListener('resize',()=>{
  if(['black','scramble','type'].includes(state)){
    // Remove locked advances before measuring at the new responsive font size.
    for(const el of glyphs){el.style.width='';el.textContent=el.dataset.char;}
    for(const el of glyphs)el.style.width=`${el.getBoundingClientRect().width}px`;
  }
  gravity?.resize();chrome?.resize();pixels?.resize();
});
$('#again').addEventListener('click',()=>{if(state==='pixel')stage('again');});

function frame(now){
  const dt=Math.min((now-last)/1000||0, .05);last=now;
  if(document.hidden){requestAnimationFrame(frame);return;}
  age+=dt;clock+=dt;
  if(state==='black'){
    if(age>.65){stage('scramble');veil.style.opacity=0;}
  }else if(state==='scramble'){
    for(let i=0;i<glyphs.length;i++){
      const el=glyphs[i],done=age>(reduced?.15:.55+i*.053);
      el.classList.toggle('scrambling',!done);
      el.textContent=done?el.dataset.char:symbols[(Math.floor(age*23+i*7.7)+Math.floor(Math.random()*symbols.length))%symbols.length];
    }
    if(age>(reduced?.3:2.1)){
      for(const el of glyphs){el.textContent=el.dataset.char;el.classList.remove('scrambling');}
      stage('type');$('#status').textContent='Create something strange. Scroll down, swipe up, or press Arrow Down.';
    }
  }else if(state==='type'){
    if(age>1)hint.classList.add('visible');
  }else if(state==='gravity'){
    accumulator+=dt;
    while(accumulator>=1/60){gravity.update();accumulator-=1/60;}
    quiet=gravity.settled?quiet+dt:0;
    if(age>3.8&&quiet>.65)stage('type-fade');
    // Sleep a rare stubborn stack gently; never skip the visible fall.
    if(age>12){for(const i of gravity.items)Matter.Sleeping.set(i.body,true);}
  }else if(state==='type-fade'){
    veil.style.opacity=ease(age/1.1);
    if(age>1.65){
      gravity.clear();show('object');stage('object-reveal');
      $('#status').textContent='A chrome sculpture. Scroll to move into it.';
    }
  }else if(state==='object-reveal'){
    veil.style.opacity=1-ease(age/.9);
    chrome.update(clock,0,reduced?1:ease(age/1.65));
    if(age>1.8)stage('object');
  }else if(state==='object'){
    progress+=(target-progress)*(1-Math.exp(-dt*6));
    chrome.update(clock,reduced?0:progress,1);
    if(age>1.4&&target<.015)hint.classList.add('visible');
    if(progress>.985){stage('enter');}
  }else if(state==='enter'){
    chrome.update(clock,reduced?0:Math.min(1,progress+age*.025),1);
    veil.style.opacity=ease(age/.28);
    if(age>.62){show('pixel');pixels.draw(clock);stage('pixel-reveal');}
  }else if(state==='pixel-reveal'){
    pixels.draw(clock);veil.style.opacity=1-ease(age/1.4);
    if(age>1.4){stage('pixel');$('#status').textContent='Another world. A quiet living landscape. Use the again button to begin again.';}
  }else if(state==='pixel'){
    pixels.draw(clock);
  }else if(state==='again'){
    pixels.draw(clock,reduced?1:1+Math.pow(clamp(age/1.1),2)*48);
    veil.style.opacity=ease((age-.6)/.7);
    if(age>1.55)reset();
  }
  requestAnimationFrame(frame);
}

async function init(){
  await document.fonts.ready;
  gravity=new GravityText($('#letters'));
  chrome=new ChromeScene($('#chrome'),reduced);
  pixels=new PixelWorld($('#pixels'),reduced);
  reset();last=performance.now();requestAnimationFrame(frame);
}
init();
