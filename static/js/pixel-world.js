/* Original, procedural pixel art. No images, APIs, or game input. */
const palette={sky:'#3c365d',haze:'#a26683',rose:'#de8c87',peach:'#f8bb8f',sun:'#ffe0a3',far:'#866b8e',mountain:'#666583',near:'#354e68',water:'#517c87',deep:'#223b4b',grass:'#89965c',light:'#b7b975',trunk:'#303c43',leaf:'#354e4c',leafLight:'#536b54'};
function random(seed){let n=seed;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}

export class PixelWorld {
  constructor(canvas,reduced){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.reduced=reduced;
    this.pointer={x:0,y:0};this.look={x:0,y:0};this.resize();
  }
  resize(){
    this.w=Math.round(270*innerWidth/innerHeight);this.w=Math.max(96,Math.min(960,this.w));this.h=270;
    this.canvas.width=this.w;this.canvas.height=this.h;
    this.scene=document.createElement('canvas');this.scene.width=this.w;this.scene.height=this.h;
    this.c=this.scene.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;
    const rng=random(2803);
    this.stars=Array.from({length:32},()=>({x:rng()*this.w,y:rng()*87,phase:rng()*6}));
    this.ripples=Array.from({length:95},()=>({x:rng()*this.w,y:180+rng()*90,length:2+rng()*13,phase:rng()*6}));
    this.plants=Array.from({length:150},()=>({x:rng()*this.w,y:232+rng()*38,h:2+rng()*5,phase:rng()*6}));
  }
  rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h));}
  poly(points,color){const c=this.c;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
  cloud(x,y,s=1){
    this.rect(x,y,41*s,3*s,'#dba3a0');this.rect(x+7*s,y-3*s,30*s,3*s,'#edb4a6');
    this.rect(x+13*s,y-7*s,15*s,4*s,'#edb4a6');this.rect(x+4*s,y+3*s,29*s,2*s,'#ac7e94');
  }
  mountains(base,amplitude,color,seed,shift){
    const rng=random(seed),pts=[[-30,base+80]];
    for(let x=-30;x<this.w+50;x+=11){pts.push([x+shift,base-rng()*amplitude]);}
    pts.push([this.w+50,base+80]);this.poly(pts,color);
  }
  tree(x,y,s,t,foreground=false){
    const sway=this.reduced?0:Math.round(Math.sin(t*.7+x)*1.2);
    const dark=foreground?'#233c3d':palette.leaf;
    this.rect(x-3*s,y-57*s,6*s,57*s,palette.trunk);
    this.poly([[x-3*s,y-20*s],[x-22*s,y-39*s],[x-19*s,y-42*s],[x+2*s,y-28*s]],palette.trunk);
    this.poly([[x+1*s,y-33*s],[x+19*s,y-52*s],[x+22*s,y-49*s],[x+3*s,y-25*s]],palette.trunk);
    for(const [dx,dy,w,h] of [[-31,-64,28,17],[-16,-78,39,18],[12,-63,26,20],[-24,-51,50,14],[-4,-88,20,15]]){
      this.rect(x+dx*s+sway,y+dy*s,w*s,h*s,dark);
      this.rect(x+dx*s+sway,y+dy*s,w*s*.7,3*s,foreground?'#476250':'#718465');
      this.rect(x+(dx+3)*s+sway,y+(dy+4)*s,5*s,2*s,foreground?'#385347':'#8e966c');
    }
  }
  house(x,y){
    this.rect(x,y,27,23,'#d7b695');this.rect(x+19,y,8,23,'#a6857d');
    this.poly([[x-5,y+1],[x+12,y-13],[x+32,y+1]],'#563e57');
    this.poly([[x-5,y-1],[x+12,y-15],[x+32,y-1],[x+28,y+1],[x+12,y-10],[x-1,y+1]],'#986270');
    this.rect(x+22,y-15,4,11,'#9d7d7b');this.rect(x+21,y-17,6,2,'#64465d');
    this.rect(x+5,y+8,6,7,'#625065');this.rect(x+6,y+9,4,5,'#ffe2a4');this.rect(x+8,y+9,1,5,'#b47f70');
    this.rect(x+17,y+10,6,13,'#564958');this.rect(x-3,y+22,33,3,'#a39d70');
  }
  draw(time,pixelation=1){
    const t=this.reduced?time*.18:time,w=this.w,h=this.h,c=this.c;
    this.look.x+=(this.pointer.x-this.look.x)*.025;this.look.y+=(this.pointer.y-this.look.y)*.025;
    const drift=this.reduced?0:this.look.x;
    // Dithered sunset bands preserve the low-resolution palette.
    const gradient=c.createLinearGradient(0,0,0,174);
    gradient.addColorStop(0,palette.sky);gradient.addColorStop(.4,palette.haze);gradient.addColorStop(.77,palette.rose);gradient.addColorStop(1,palette.peach);
    c.fillStyle=gradient;c.fillRect(0,0,w,h);
    for(const star of this.stars){if(Math.sin(t*.55+star.phase)>.15)this.rect(star.x+drift*.3,star.y,1,1,'#eac5b6');}
    const sunX=w*.62+drift*.5,sunY=112;
    // Stepped circle and horizontal atmospheric cuts.
    for(let y=-29;y<=29;y++){const half=Math.floor(Math.sqrt(29*29-y*y));this.rect(sunX-half,sunY+y,half*2,1,palette.sun);}
    for(const y of [121,126,133,138])this.rect(sunX-33,y,66,y>130?3:1,'#e7a18b');
    this.cloud(((w*.1+t*.9)%(w+75))-45+drift,54,1.1);
    this.cloud(((w*.63+t*.55)%(w+70))-35+drift*.8,38,.7);
    this.cloud(((w*.91+t*.7)%(w+80))-40+drift*.7,86,.8);
    this.mountains(164,48,palette.far,713,drift*1.2);
    this.mountains(178,46,palette.mountain,42,drift*2);
    this.mountains(189,29,palette.near,389,drift*3);
    this.rect(0,178,w,92,palette.water);
    this.rect(0,197,w,73,'#4b7781');this.rect(0,223,w,47,'#406974');
    // A broken gold reflection underneath the sun.
    for(let y=181;y<259;y+=4){const spread=(y-172)*.28;const offset=Math.sin(y*2+t)*4;
      this.rect(sunX-spread+offset,y,spread*2,1,y<210?'#d8b193':'#92a494');
    }
    for(const r of this.ripples){this.rect((r.x+Math.sin(t*.4+r.phase)*3+w)%w,r.y,r.length,1,Math.sin(t+r.phase)>.6?'#85a89e':'#416c7c');}
    // Far-bank reeds and two quiet, tiny islands.
    this.poly([[w*.74,185],[w*.79,180],[w*.87,181],[w*.91,185]],'#34545b');
    this.tree(w*.82+drift*3,181,.35,t);
    this.poly([[-10,210],[w*.12,201],[w*.26,203],[w*.34,218],[w*.46,223],[w*.52,239],[w*.7,244],[w*.82,257],[w+10,255],[w+10,280],[-10,280]],'#293e48');
    this.poly([[-10,201],[w*.11,196],[w*.26,201],[w*.36,213],[w*.47,218],[w*.52,231],[w*.7,239],[w*.82,252],[w+10,250],[w+10,280],[-10,280]],palette.grass);
    this.poly([[0,213],[w*.2,211],[w*.34,221],[w*.48,226],[w*.55,239],[w*.76,250],[w*.75,254],[w*.5,242],[w*.44,232],[w*.3,228],[w*.16,220],[0,219]],'#c6b587');
    // A little house on the bank, with chimney smoke.
    const hx=w*.22+drift*4,hy=186;
    this.house(hx,hy);
    for(let i=0;i<3;i++){const p=(t*.15+i/3)%1;this.rect(hx+24+Math.sin(t*.6+i)*3+p*5,hy-19-p*17,3+p*3,2,'#ba9caa');}
    this.tree(w*.055+drift*5,211,.9,t);
    // Fence follows the trail into the scene.
    for(let i=0;i<6;i++){let x=w*.33+i*8,y=213+i*.45;this.rect(x,y,2,8,'#766d59');this.rect(x,y+2,9,1,'#aa9b74');}
    // Unhurried traveller: a red coat, a satchel, alternating two-pixel feet.
    const walk=(t*2.4)%(w*.25),x=w*.04+walk,y=216+Math.max(0,(x-w*.16)*.22),step=Math.sin(t*5)>0?1:0;
    this.rect(x-2,y+1,9,2,'#787c57');this.rect(x,y-9,5,5,'#df987b');
    this.rect(x-1,y-12,6,3,'#403d4b');this.rect(x+3,y-10,3,2,'#efbc93');
    this.rect(x,y-5,5,6,'#b55c61');this.rect(x-2,y-5,3,4,'#e6b16e');
    this.rect(x+step,y+1,2,3,'#3d4351');this.rect(x+3-step,y+1,2,3,'#3d4351');
    // Foreground grass, occasional flowers; deliberately sparse detail.
    for(const p of this.plants){
      const terrain=211+p.x/w*48;if(p.y<terrain)continue;
      const sway=Math.round(Math.sin(t+p.phase));
      this.rect(p.x+drift*7,p.y,1,p.h,'#546f51');this.rect(p.x-1+sway+drift*7,p.y-1,2,1,p.phase>5?'#e4b17c':'#a5ad6c');
    }
    this.tree(w*.97+drift*8,276,1.45,t,true);
    // A bird pair quietly crosses the open sky every cycle.
    const bird=(t*7)%(w+140)-70;
    for(let i=0;i<2;i++){
      const bx=bird-i*13,by=83+i*5+Math.sin(t*.6)*3,flap=Math.sin(t*4+i)>0?1:-1;
      this.rect(bx,by,2,1,'#605a76');this.rect(bx-2,by-flap,2,1,'#605a76');this.rect(bx+2,by-flap,2,1,'#605a76');
    }
    for(let i=0;i<6;i++){if(Math.sin(t*.8+i*1.7)>.78)this.rect(w*(.13+i*.105)+Math.sin(t*.6+i)*2,229+Math.cos(t*.5+i)*7,1,1,'#f8d899');}
    // Render into an increasingly coarse backing buffer for the loop transition.
    if(pixelation>1){
      if(!this.coarse)this.coarse=document.createElement('canvas');
      this.coarse.width=Math.max(5,Math.floor(w/pixelation));this.coarse.height=Math.max(3,Math.floor(h/pixelation));
      const small=this.coarse.getContext('2d');small.imageSmoothingEnabled=false;
      small.drawImage(this.scene,0,0,this.coarse.width,this.coarse.height);
      this.ctx.drawImage(this.coarse,0,0,w,h);
    }else this.ctx.drawImage(this.scene,0,0);
  }
}
