import * as THREE from '../vendor/three.module.min.js';

export class ChromeScene {
  constructor(canvas, reduced) {
    this.reduced = reduced;
    this.pointer = {x:0,y:0};
    this.fallback = document.querySelector('#object-fallback');
    try {
      this.renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
      this.renderer.setClearColor(0x000000);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.025,60);

      // A painted studio environment: reflections without an HDRI download.
      const studio = document.createElement('canvas'); studio.width=1024; studio.height=512;
      const ctx = studio.getContext('2d');
      ctx.fillStyle='#080a10';ctx.fillRect(0,0,1024,512);
      const gradient=ctx.createLinearGradient(0,0,0,512);
      gradient.addColorStop(0,'#485363');gradient.addColorStop(.42,'#14171c');gradient.addColorStop(.55,'#020203');gradient.addColorStop(1,'#313740');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
      for (const [x,y,w,h,color] of [[90,35,110,280,'#ffffff'],[440,80,220,90,'#e5eaf4'],[800,120,34,310,'#ffffff'],[260,390,310,25,'#9cabc0']]) {
        ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
      }
      const map=new THREE.CanvasTexture(studio);map.mapping=THREE.EquirectangularReflectionMapping;
      const pmrem=new THREE.PMREMGenerator(this.renderer);
      this.environment=pmrem.fromEquirectangular(map);
      this.scene.environment=this.environment.texture;
      map.dispose();pmrem.dispose();
      this.material=new THREE.MeshStandardMaterial({color:0xd5dce6,metalness:1,roughness:.16,envMapIntensity:1.65});
      this.geometry=new THREE.TorusKnotGeometry(1.08,.37,240,40,2,3);
      // Organic asymmetry, still a watertight parametric mesh.
      const pos=this.geometry.attributes.position;
      for(let i=0;i<pos.count;i++) {
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const a=.16*y;
        pos.setXYZ(i,(x*Math.cos(a)-z*Math.sin(a))*1.06,y*.95,z*Math.cos(a)+x*Math.sin(a));
      }
      this.geometry.computeVertexNormals();
      this.mesh=new THREE.Mesh(this.geometry,this.material);
      this.scene.add(this.mesh);
      const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(3,5,4);
      const rim=new THREE.DirectionalLight(0xb7c7e6,2);rim.position.set(-4,1,-2);
      const fill=new THREE.PointLight(0xffffff,16);fill.position.set(0,-3,2);
      this.scene.add(key,rim,fill);
      this.resize();
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.failed=true;this.fallback.hidden=false;});
    } catch(error) {
      this.failed=true;canvas.hidden=true;this.fallback.hidden=false;
      // A non-WebGL browser can still finish the experience.
      console.info('WebGL unavailable; using the lightweight sculpture fallback.');
    }
  }

  resize() {
    if(this.failed)return;
    this.camera.aspect=innerWidth/innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth,innerHeight,false);
    this.startZ=innerWidth<600?10.5:7.1;
  }

  update(t,progress,reveal) {
    if(this.failed) {
      this.fallback.style.opacity=reveal;
      this.fallback.style.scale=1+progress*3;
      return;
    }
    this.rotationPhase=(this.rotationPhase||0)+(this.reduced?0:Math.min(t-(this.lastT??t),.05)*.11*(1-progress));
    this.lastT=t;
    const movement=this.rotationPhase;
    this.mesh.rotation.set(.22+Math.sin(movement*.6)*.1+this.pointer.y*.035,movement+.4+this.pointer.x*.045,-.3);
    // Only the initial point-to-sculpture reveal scales the mesh. Scroll moves the camera.
    this.mesh.scale.setScalar(.015+.985*reveal);
    const travel=progress*progress*(3-2*progress);
    this.camera.position.set(.22*travel,0,this.startZ+(0.32-this.startZ)*travel);
    this.camera.lookAt(.12*travel,0,0);
    this.material.roughness=.16-progress*.065;
    this.renderer.toneMappingExposure=1.15+progress*.22;
    this.renderer.render(this.scene,this.camera);
  }
}
