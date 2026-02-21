
import * as THREE from 'three';
import { FRUIT_TYPES, FruitType, GRAVITY } from './definitions';
import { Fruit, SliceHalf, ParticleSystem } from './entities';
import { distToSegment, vibrate } from './utils';
import { GameSettings, defaultSettings } from './settings';

type PointerPoint = { x: number; y: number; age: number };

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  trailCanvas: HTMLCanvasElement;
  trailCtx: CanvasRenderingContext2D;
  
  fruits: Fruit[] = [];
  halves: SliceHalf[] = [];
  particles: ParticleSystem;

  lastTime: number = 0;
  spawnTimer: number = 0;
  
  activePointers: Map<number, { active: boolean, path: PointerPoint[] }> = new Map();
  
  score: number = 0;
  lives: number = 3;
  isPlaying: boolean = false;
  settings: GameSettings = defaultSettings;

  width: number = 0;
  height: number = 0;

  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameOver: () => void;
  onFlash: () => void;

  constructor(
    webglCanvas: HTMLCanvasElement, 
    trailCanvas: HTMLCanvasElement,
    events: {
      onScoreChange: (s: number) => void;
      onLivesChange: (l: number) => void;
      onGameOver: () => void;
      onFlash: () => void;
    }
  ) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.z = 15;

    this.renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true, antialias: true });
    this.trailCanvas = trailCanvas;
    this.trailCtx = this.trailCanvas.getContext('2d')!;

    this.particles = new ParticleSystem(this.scene);

    this.onScoreChange = events.onScoreChange;
    this.onLivesChange = events.onLivesChange;
    this.onGameOver = events.onGameOver;
    this.onFlash = events.onFlash;

    this.setupLighting();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Input Handling
    const target = document.body;
    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('pointercancel', this.onPointerUp);

    requestAnimationFrame(t => this.loop(t));
  }

  setupLighting() {
    const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(5, 10, 10);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(-5, 0, -10);
    this.scene.add(backLight);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.trailCanvas.width = this.width;
    this.trailCanvas.height = this.height;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  start(settings: GameSettings) {
    this.settings = settings;
    this.score = 0;
    this.lives = this.settings.lives;
    this.isPlaying = true;
    this.spawnTimer = 0;
    this.activePointers.clear();
    
    // Clean up old
    this.fruits.forEach(f => this.scene.remove(f.mesh));
    this.halves.forEach(h => this.scene.remove(h.mesh));
    this.fruits = [];
    this.halves = [];

    this.onScoreChange(this.score);
    this.onLivesChange(this.lives);
  }

  spawnFruits() {
    const num = Math.floor(Math.random() * 3) + 1; // 1 to 3
    for (let i = 0; i < num; i++) {
       const isBombChance = this.settings.bombsEnabled ? Math.random() < 0.15 : false;
       const types = FRUIT_TYPES.filter(t => isBombChance ? t.isBomb : !t.isBomb);
       const type = types[Math.floor(Math.random() * types.length)];
       
       const startX = (Math.random() - 0.5) * 12;
       const startY = -12;
       
       const vx = -startX * 0.2 + (Math.random() - 0.5) * 2;
       const vy = 18 + Math.random() * 4;
       
       const fruit = new Fruit(
         type, 
         new THREE.Vector3(startX, startY, 0),
         new THREE.Vector3(vx, vy, (Math.random() - 0.5) * 2)
       );
       this.fruits.push(fruit);
       this.scene.add(fruit.mesh);
    }
  }

  onPointerDown = (e: PointerEvent) => {
    if (!this.isPlaying) return;
    this.activePointers.set(e.pointerId, {
      active: true,
      path: [{ x: e.clientX, y: e.clientY, age: 0 }]
    });
  }

  onPointerMove = (e: PointerEvent) => {
    if (!this.isPlaying) return;
    
    const pointer = this.activePointers.get(e.pointerId);
    if (!pointer || !pointer.active) return;
    
    const currPoint = { x: e.clientX, y: e.clientY, age: 0 };
    const prevPoint = pointer.path[pointer.path.length - 1];
    
    pointer.path.push(currPoint);
    
    if (prevPoint) {
      this.checkSlice(prevPoint.x, prevPoint.y, currPoint.x, currPoint.y);
    }
  }

  onPointerUp = (e: PointerEvent) => {
    const pointer = this.activePointers.get(e.pointerId);
    if (pointer) {
      pointer.active = false;
    }
  }

  checkSlice(x1: number, y1: number, x2: number, y2: number) {
    if (x1 === x2 && y1 === y2) return;

    const v2d = new THREE.Vector2(x2 - x1, y2 - y1).normalize();
    const cutNormal = new THREE.Vector2(-v2d.y, v2d.x);

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      if (!fruit.isActive) continue;

      const screenPos = fruit.mesh.position.clone().project(this.camera);
      const px = (screenPos.x * 0.5 + 0.5) * this.width;
      const py = (-(screenPos.y * 0.5) + 0.5) * this.height;
      
      const edgePos = fruit.mesh.position.clone();
      edgePos.x += fruit.radius;
      edgePos.project(this.camera);
      const edgePx = (edgePos.x * 0.5 + 0.5) * this.width;
      const screenRadius = Math.abs(edgePx - px) * 1.2;

      const dist = distToSegment(px, py, x1, y1, x2, y2);
      
      if (dist < screenRadius) {
        this.sliceFruit(fruit, i, cutNormal);
      }
    }
  }

  sliceFruit(fruit: Fruit, index: number, cutNormal: THREE.Vector2) {
    fruit.isActive = false;
    this.fruits.splice(index, 1);
    this.scene.remove(fruit.mesh);

    if (fruit.type.isBomb) {
      this.onFlash();
      vibrate([200, 100, 200]);
      this.loseLife();
      this.particles.emit(fruit.mesh.position, 0xffaa00, 30);
    } else {
      vibrate(50);
      this.score += fruit.type.score;
      this.onScoreChange(this.score);

      const h1 = new SliceHalf(fruit.type, fruit.mesh.position, fruit.velocity, cutNormal, true, fruit.mesh.rotation);
      const h2 = new SliceHalf(fruit.type, fruit.mesh.position, fruit.velocity, cutNormal, false, fruit.mesh.rotation);
      
      this.halves.push(h1, h2);
      this.scene.add(h1.mesh, h2.mesh);

      this.particles.emit(fruit.mesh.position, fruit.type.insideColor, 15);
    }
  }

  loseLife() {
    this.lives--;
    this.onLivesChange(this.lives);
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.isPlaying = false;
    this.onGameOver();
  }

  drawTrail(dt: number) {
    this.trailCtx.clearRect(0, 0, this.width, this.height);

    this.trailCtx.lineCap = 'round';
    this.trailCtx.lineJoin = 'round';

    for (const [id, pointer] of this.activePointers.entries()) {
      for (let i = pointer.path.length - 1; i >= 0; i--) {
        pointer.path[i].age += dt;
        if (pointer.path[i].age > 0.15) { 
          pointer.path.splice(i, 1);
        }
      }

      if (pointer.path.length < 2) {
        if (!pointer.active && pointer.path.length === 0) {
          this.activePointers.delete(id);
        }
        continue;
      }

      this.trailCtx.beginPath();
      this.trailCtx.moveTo(pointer.path[0].x, pointer.path[0].y);
      for (let i = 1; i < pointer.path.length - 1; i++) {
          const p1 = pointer.path[i];
          const p2 = pointer.path[i+1];
          const xc = (p1.x + p2.x) / 2;
          const yc = (p1.y + p2.y) / 2;
          this.trailCtx.quadraticCurveTo(p1.x, p1.y, xc, yc);
      }
      const last = pointer.path[pointer.path.length - 1];
      this.trailCtx.lineTo(last.x, last.y);

      this.trailCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.trailCtx.lineWidth = 12;
      this.trailCtx.shadowColor = '#00faff';
      this.trailCtx.shadowBlur = 10;
      this.trailCtx.stroke();
      
      this.trailCtx.strokeStyle = '#ffffff';
      this.trailCtx.lineWidth = 6;
      this.trailCtx.shadowBlur = 0;
      this.trailCtx.stroke();
    }
  }

  loop(time: number) {
    requestAnimationFrame(t => this.loop(t));
    
    let dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    
    if (this.isPlaying) {
      dt *= this.settings.gameSpeed;
      this.spawnTimer += dt;
      let interval = Math.max(0.8, 2.5 - this.score * 0.02);
      if (this.spawnTimer > interval) {
        this.spawnTimer = 0;
        this.spawnFruits();
      }

      for (let i = this.fruits.length - 1; i >= 0; i--) {
        const f = this.fruits[i];
        f.update(dt);
        if (f.mesh.position.y < -15) {
          this.scene.remove(f.mesh);
          this.fruits.splice(i, 1);
          if (!f.type.isBomb) {
            this.loseLife();
          }
        }
      }
    }

    for (let i = this.halves.length - 1; i >= 0; i--) {
      const h = this.halves[i];
      h.update(dt);
      if (h.mesh.position.y < -15 || h.life >= h.maxLife) {
        this.scene.remove(h.mesh);
        this.halves.splice(i, 1);
      }
    }

    this.particles.update(dt);
    this.drawTrail(dt);

    this.renderer.render(this.scene, this.camera);
  }
}
