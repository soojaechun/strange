/* Each visible glyph is paired with a Matter rigid body, in screen pixels. */
export class GravityText {
  constructor(container) {
    this.container = container;
    this.items = [];
    this.engine = Matter.Engine.create({enableSleeping: true});
    this.engine.gravity.y = 1.35;
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 8;
  }

  start(headline) {
    this.clear();
    const font = getComputedStyle(headline).fontSize;
    for (const glyph of headline.querySelectorAll('.glyph')) {
      const r = glyph.getBoundingClientRect();
      const el = document.createElement('span');
      el.className = 'fallen';
      el.textContent = glyph.dataset.char;
      Object.assign(el.style, {fontSize: font, width: `${r.width}px`, height: `${r.height}px`});
      this.container.append(el);
      const body = Matter.Bodies.rectangle(r.x + r.width/2, r.y + r.height/2, Math.max(5,r.width*.87), r.height*.84, {
        restitution: .29, friction: .48, frictionStatic: .8, frictionAir: .012,
        sleepThreshold: 55, density: .002, chamfer: {radius: 3}
      });
      Matter.Body.setAngle(body, (Math.random()-.5)*.13);
      Matter.Body.setVelocity(body, {x:(Math.random()-.5)*3.6, y:Math.random()*.8});
      Matter.Body.setAngularVelocity(body, (Math.random()-.5)*.12);
      this.items.push({body,el,w:r.width,h:r.height});
    }
    Matter.Composite.add(this.engine.world,this.items.map(i=>i.body));
    this.makeWalls();
    this.paint();
  }

  makeWalls() {
    if (this.walls) Matter.Composite.remove(this.engine.world,this.walls);
    const w = innerWidth, h = innerHeight;
    this.walls = [
      Matter.Bodies.rectangle(w/2,h+35,w+200,100,{isStatic:true,friction:.85}),
      Matter.Bodies.rectangle(-45,h/2,100,h*4,{isStatic:true}),
      Matter.Bodies.rectangle(w+45,h/2,100,h*4,{isStatic:true})
    ];
    Matter.Composite.add(this.engine.world,this.walls);
    this.size = {w,h};
  }

  resize() {
    if (!this.items.length) return;
    const sx = innerWidth/this.size.w, sy = innerHeight/this.size.h;
    const scale = Math.min(sx,sy);
    for (const i of this.items) {
      Matter.Body.scale(i.body,scale,scale);
      i.w *= scale; i.h *= scale;
      i.el.style.width = `${i.w}px`; i.el.style.height = `${i.h}px`;
      i.el.style.fontSize = `${parseFloat(i.el.style.fontSize)*scale}px`;
      Matter.Body.setPosition(i.body, {x:Math.max(i.w/2,Math.min(innerWidth-i.w/2,i.body.position.x*sx)),y:Math.min(innerHeight-i.h/2-15,i.body.position.y*sy)});
      Matter.Sleeping.set(i.body,false);
    }
    this.makeWalls();
    this.paint();
  }

  update() {
    Matter.Engine.update(this.engine,1000/60);
    this.paint();
  }

  paint() {
    for (const {body,el,w,h} of this.items) {
      el.style.transform = `translate3d(${body.position.x-w/2}px,${body.position.y-h/2}px,0) rotate(${body.angle}rad)`;
    }
  }

  get settled() {return this.items.every(i=>i.body.isSleeping || (i.body.speed<.25 && Math.abs(i.body.angularSpeed)<.015));}

  clear() {
    Matter.Composite.clear(this.engine.world,false);
    Matter.Engine.clear(this.engine);
    this.container.replaceChildren(); this.items=[]; this.walls=null;
  }
}
