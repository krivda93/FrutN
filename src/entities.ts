
import * as THREE from 'three';
import { FruitType, GRAVITY } from './definitions';

// Caches for geometries and materials to keep performance smooth
const fullGeoCache = new Map<string, THREE.BufferGeometry>();
const halfGeoTopCache = new Map<string, THREE.BufferGeometry>();
const halfGeoBotCache = new Map<string, THREE.BufferGeometry>();
const capGeoTopCache = new Map<string, THREE.BufferGeometry>();
const capGeoBotCache = new Map<string, THREE.BufferGeometry>();

const extMatCache = new Map<string, THREE.Material>();
const intMatCache = new Map<string, THREE.Material>();
const particleMatCache = new Map<number, THREE.Material>();

// Shared decorators
const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25);
const leafGeo = new THREE.SphereGeometry(0.15, 8, 8);
leafGeo.scale(1, 0.2, 2);
const dotGeo = new THREE.SphereGeometry(0.05, 8, 8);
const fuseGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);

const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const fuseMat = new THREE.MeshStandardMaterial({ color: 0x884400 });

function getScales(typeId: string): [number, number, number] {
  if (typeId === 'watermelon') return [1.25, 1.0, 1.1];
  if (typeId === 'lemon') return [0.85, 1.25, 0.85];
  if (typeId === 'orange' || typeId === 'apple') return [1.0, 0.95, 1.0];
  return [1, 1, 1];
}

function getFullGeo(type: FruitType) {
  if (fullGeoCache.has(type.id)) return fullGeoCache.get(type.id)!;
  const geo = new THREE.SphereGeometry(type.radius, 32, 16);
  geo.scale(...getScales(type.id));
  fullGeoCache.set(type.id, geo);
  return geo;
}

function getHalfGeo(type: FruitType, isTop: boolean) {
  const cache = isTop ? halfGeoTopCache : halfGeoBotCache;
  if (cache.has(type.id)) return cache.get(type.id)!;
  const geo = new THREE.SphereGeometry(
      type.radius, 32, 16, 
      0, Math.PI*2, 
      isTop ? 0 : Math.PI/2, Math.PI/2
  );
  geo.scale(...getScales(type.id));
  cache.set(type.id, geo);
  return geo;
}

function getCapGeo(type: FruitType, isTop: boolean) {
  const cache = isTop ? capGeoTopCache : capGeoBotCache;
  if (cache.has(type.id)) return cache.get(type.id)!;
  const geo = new THREE.CircleGeometry(type.radius, 32);
  geo.rotateX(isTop ? Math.PI / 2 : -Math.PI / 2);
  geo.scale(...getScales(type.id));
  cache.set(type.id, geo);
  return geo;
}

function getExteriorMaterial(type: FruitType): THREE.Material {
  if (extMatCache.has(type.id)) return extMatCache.get(type.id)!;
  let mat: THREE.Material;

  if (type.id === 'watermelon') {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a3a11'; ctx.fillRect(0,0,512,512);
      ctx.fillStyle = '#11aa33';
      for (let i=0; i<10; i++) {
          ctx.beginPath();
          const startX = (i / 10) * 512;
          ctx.moveTo(startX, 0);
          for(let y=0; y<=512; y+=20) {
              ctx.lineTo(startX + (Math.random()-0.5)*20, y);
          }
          ctx.lineTo(startX + 20, 512);
          for(let y=512; y>=0; y-=20) {
              ctx.lineTo(startX + 20 + (Math.random()-0.5)*20, y);
          }
          ctx.fill();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.1 });
  } else if (type.id === 'orange') {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#' + type.color.toString(16).padStart(6, '0');
      ctx.fillRect(0,0,256,256);
      ctx.fillStyle = '#e67a00';
      for (let i=0; i<3000; i++) ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, bumpMap: tex, bumpScale: 0.01 });
  } else {
      mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.4, metalness: 0.1 });
  }

  extMatCache.set(type.id, mat);
  return mat;
}

function getInteriorMaterial(type: FruitType): THREE.Material {
  if (intMatCache.has(type.id)) return intMatCache.get(type.id)!;
  if (type.isBomb) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      intMatCache.set(type.id, mat);
      return mat;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128, cy = 128, r = 128;
  
  ctx.fillStyle = '#' + type.insideColor.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 256, 256);
  
  if (type.id === 'watermelon') {
      ctx.fillStyle = '#111';
      for(let i=0; i<16; i++) {
          const angle = (i/16) * Math.PI * 2;
          const sr = 60 + (i%2)*25; 
          const sx = cx + Math.cos(angle)*sr;
          const sy = cy + Math.sin(angle)*sr;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI*2); ctx.fill();
          ctx.restore();
      }
  } else if (type.id === 'orange' || type.id === 'lemon') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      for(let i=0; i<10; i++) {
          const angle = (i/10) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r);
          ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(cx, cy, r-4, 0, Math.PI*2); ctx.stroke();
  } else if (type.id === 'apple') {
      ctx.fillStyle = '#e0d5a1';
      ctx.beginPath();
      for(let i=0; i<5; i++) {
         const angle = (i/5) * Math.PI * 2;
         ctx.arc(cx + Math.cos(angle)*18, cy + Math.sin(angle)*18, 15, 0, Math.PI*2);
      }
      ctx.fill();
      
      ctx.fillStyle = '#3a2318';
      for(let i=0; i<2; i++) {
          const angle = (i/2) * Math.PI * 2;
          const sx = cx + Math.cos(angle)*12;
          const sy = cy + Math.sin(angle)*12;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.beginPath(); ctx.ellipse(0, 0, 3, 7, 0, 0, Math.PI*2); ctx.fill();
          ctx.restore();
      }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  intMatCache.set(type.id, mat);
  return mat;
}

function getParticleMaterial(color: number) {
  if (!particleMatCache.has(color)) {
    particleMatCache.set(color, new THREE.MeshStandardMaterial({ 
      color, 
      roughness: 0.3, 
      metalness: 0.1 
    }));
  }
  return particleMatCache.get(color)!;
}

export class Fruit {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  type: FruitType;
  isActive: boolean = true;
  radius: number;

  constructor(type: FruitType, startPos: THREE.Vector3, velocity: THREE.Vector3) {
    this.type = type;
    this.radius = type.radius;
    this.velocity = velocity;
    this.angularVelocity = new THREE.Vector3(
      Math.random() * 4 - 2,
      Math.random() * 4 - 2,
      Math.random() * 4 - 2
    );

    this.mesh = new THREE.Group();
    const shell = new THREE.Mesh(getFullGeo(type), getExteriorMaterial(type));
    
    if (type.id === 'apple') {
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = type.radius * 0.95;
      this.mesh.add(stem);
      
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0.12, type.radius * 0.95, 0.12);
      leaf.rotation.set(0.2, 0.5, 0);
      this.mesh.add(leaf);
    } else if (type.id === 'orange') {
      const dot = new THREE.Mesh(dotGeo, leafMat);
      dot.position.y = type.radius * 0.95;
      this.mesh.add(dot);
    }
    
    if (type.isBomb) {
      const fuse = new THREE.Mesh(fuseGeo, fuseMat);
      fuse.position.y = this.radius;
      this.mesh.add(fuse);
    }

    this.mesh.add(shell);
    this.mesh.position.copy(startPos);
  }

  update(dt: number) {
    this.velocity.y += GRAVITY * dt;
    this.mesh.position.addScaledVector(this.velocity, dt);
    
    this.mesh.rotation.x += this.angularVelocity.x * dt;
    this.mesh.rotation.y += this.angularVelocity.y * dt;
    this.mesh.rotation.z += this.angularVelocity.z * dt;
  }
}

export class SliceHalf {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  life: number = 0;
  maxLife: number = 2;

  constructor(type: FruitType, position: THREE.Vector3, velocity: THREE.Vector3, cutNormal: THREE.Vector2, isTop: boolean, rotation: THREE.Euler) {
    this.velocity = velocity.clone();
    
    const impulse = 4;
    const sign = isTop ? 1 : -1;
    this.velocity.x += cutNormal.x * impulse * sign;
    this.velocity.y += cutNormal.y * impulse * sign;
    this.velocity.z += (Math.random() - 0.5) * 5;

    this.angularVelocity = new THREE.Vector3(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    );

    this.mesh = new THREE.Group();
    // Inherit the exact rotation so the cut looks natural no matter the angle
    this.mesh.rotation.copy(rotation);

    const half = new THREE.Mesh(getHalfGeo(type, isTop), getExteriorMaterial(type));
    const cap = new THREE.Mesh(getCapGeo(type, isTop), getInteriorMaterial(type));
    
    if (isTop) {
      if (type.id === 'apple') {
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = type.radius * 0.95;
        this.mesh.add(stem);
        
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0.12, type.radius * 0.95, 0.12);
        leaf.rotation.set(0.2, 0.5, 0);
        this.mesh.add(leaf);
      } else if (type.id === 'orange') {
        const dot = new THREE.Mesh(dotGeo, leafMat);
        dot.position.y = type.radius * 0.95;
        this.mesh.add(dot);
      }
    }

    this.mesh.add(half);
    this.mesh.add(cap);
    this.mesh.position.copy(position);
  }

  update(dt: number) {
    this.life += dt;
    this.velocity.y += GRAVITY * dt;
    this.mesh.position.addScaledVector(this.velocity, dt);
    
    this.mesh.rotation.x += this.angularVelocity.x * dt;
    this.mesh.rotation.y += this.angularVelocity.y * dt;
    this.mesh.rotation.z += this.angularVelocity.z * dt;
    
    const scale = 1 - (this.life / this.maxLife) * 0.5;
    this.mesh.scale.setScalar(Math.max(0, scale));
  }
}

export class ParticleSystem {
  particles: { mesh: THREE.Mesh, vel: THREE.Vector3, life: number }[] = [];
  container: THREE.Group;
  geo = new THREE.SphereGeometry(0.1, 8, 8);

  constructor(scene: THREE.Scene) {
    this.container = new THREE.Group();
    scene.add(this.container);
  }

  emit(position: THREE.Vector3, color: number, count: number) {
    const mat = getParticleMaterial(color);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.position.copy(position);
      
      mesh.position.x += (Math.random() - 0.5) * 0.5;
      mesh.position.y += (Math.random() - 0.5) * 0.5;
      mesh.position.z += (Math.random() - 0.5) * 0.5;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10 + 5,
        (Math.random() - 0.5) * 10
      );
      
      const scale = Math.random() * 1.5 + 0.5;
      mesh.scale.setScalar(scale);

      this.container.add(mesh);
      this.particles.push({ mesh, vel, life: 1 });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.container.remove(p.mesh);
        this.particles.splice(i, 1);
      } else {
        p.vel.y += GRAVITY * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.scale.setScalar(Math.max(0, p.life));
      }
    }
  }
}
