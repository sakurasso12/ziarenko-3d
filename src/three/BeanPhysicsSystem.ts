import * as THREE from 'three';
import { sound } from '../utils/sound';

interface BeanParticle {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
  scale: THREE.Vector3;
  bounces: number;
  isSleeping: boolean;
  radius: number;
}

export class BeanPhysicsSystem {
  public mesh: THREE.InstancedMesh;
  private maxBeans = 320;
  private beans: BeanParticle[] = [];
  private dummy = new THREE.Object3D();
  private lastSoundTime = 0;
  private beanRadius = 0.055;

  constructor(scene: THREE.Scene) {
    const geometry = createStylizedBeanGeometry();
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x482e1e, // Rich dark roasted coffee bean brown
      roughness: 0.38,
      metalness: 0.08,
      bumpScale: 0.02,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, this.maxBeans);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;

    // Initialize bean pool
    const roastedTones = [
      new THREE.Color(0x381f13), // Deep french roast
      new THREE.Color(0x442819), // Dark chocolate
      new THREE.Color(0x4f3120), // Medium-dark espresso
      new THREE.Color(0x5a3925), // Medium roast
      new THREE.Color(0x64422b), // Cinnamon/Vienna roast
    ];

    for (let i = 0; i < this.maxBeans; i++) {
      this.beans.push({
        active: false,
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(0, 0, 0),
        rotVel: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        bounces: 0,
        isSleeping: true,
        radius: this.beanRadius,
      });

      // Individual bean tone
      const c = roastedTones[Math.floor(Math.random() * roastedTones.length)];
      this.mesh.setColorAt(i, c);

      // Hide offscreen initially
      this.dummy.position.set(0, -100, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    scene.add(this.mesh);
  }

  /**
   * Spawns a cascade of coffee beans falling from above the bag
   */
  public spawnBeans(count = 45, spawnOrigin?: THREE.Vector3) {
    const origin = spawnOrigin || new THREE.Vector3(0, 3.2, 0);
    let spawned = 0;

    for (let i = 0; i < this.maxBeans && spawned < count; i++) {
      const b = this.beans[i];
      if (!b.active || b.isSleeping) {
        // Reuse sleeping or inactive bean
        b.active = true;
        b.isSleeping = false;
        b.bounces = 0;

        // Spread in a soft funnel above the bag
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.45;
        b.pos.set(
          origin.x + Math.cos(angle) * dist,
          origin.y + (Math.random() * 0.6) + (spawned * 0.02),
          origin.z + Math.sin(angle) * dist
        );

        // Initial velocity with natural downward impulse and slight outward drift
        b.vel.set(
          (Math.random() - 0.5) * 1.6,
          -1.0 - Math.random() * 2.2,
          (Math.random() - 0.5) * 1.6
        );

        // Random spin
        b.rot.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        b.rotVel.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        );

        // Slight scale variation
        const s = 0.85 + Math.random() * 0.35;
        b.scale.set(s, s, s);
        b.radius = this.beanRadius * s;

        spawned++;
      }
    }

    sound.playPourChime();
  }

  public getActiveCount(): number {
    return this.beans.filter(b => b.active).length;
  }

  public clearAll() {
    for (let i = 0; i < this.maxBeans; i++) {
      const b = this.beans[i];
      b.active = false;
      b.isSleeping = true;
      b.pos.set(0, -100, 0);
      this.dummy.position.set(0, -100, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Physics simulation step
   */
  public update(delta: number, bagScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)) {
    const dt = Math.min(delta, 0.033);
    const gravity = -14.0;
    const floorY = 0.0;
    const bagHalfW = 0.75 * bagScale.x;
    const bagH = 2.1 * bagScale.y;
    const bagHalfD = 0.5 * bagScale.z;

    let needsUpdate = false;
    let bouncedThisFrame = false;
    const now = performance.now();

    for (let i = 0; i < this.maxBeans; i++) {
      const b = this.beans[i];
      if (!b.active || b.isSleeping) continue;

      needsUpdate = true;

      // Apply Gravity
      b.vel.y += gravity * dt;

      // Apply air resistance
      b.vel.x *= 0.995;
      b.vel.z *= 0.995;

      // Integrate position
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.pos.z += b.vel.z * dt;

      // Integrate rotation
      b.rot.x += b.rotVel.x * dt;
      b.rot.y += b.rotVel.y * dt;
      b.rot.z += b.rotVel.z * dt;
      b.rotVel.multiplyScalar(0.96);

      // 1. Collision with Coffee Bag (Low-poly box deflect)
      if (
        b.pos.y > 0 &&
        b.pos.y < bagH + 0.2 &&
        Math.abs(b.pos.x) < bagHalfW + b.radius &&
        Math.abs(b.pos.z) < bagHalfD + b.radius
      ) {
        // Deflect away from bag center
        const dx = b.pos.x;
        const dz = b.pos.z;
        const angle = Math.atan2(dz, dx);
        b.vel.x = Math.cos(angle) * (1.2 + Math.random() * 0.8);
        b.vel.z = Math.sin(angle) * (1.2 + Math.random() * 0.8);
        b.vel.y = Math.max(b.vel.y, -0.5); // slide off
        b.rotVel.x += (Math.random() - 0.5) * 10;
        b.rotVel.z += (Math.random() - 0.5) * 10;
      }

      // 2. Collision with Floor
      const groundContactY = floorY + b.radius;
      if (b.pos.y <= groundContactY) {
        b.pos.y = groundContactY;
        b.bounces++;

        // Restitution (bounce elasticity)
        const impactSpeed = Math.abs(b.vel.y);
        if (impactSpeed > 0.4) {
          b.vel.y = -b.vel.y * 0.36;
          // Floor friction on lateral axes
          b.vel.x *= 0.65;
          b.vel.z *= 0.65;

          // Sound trigger for noticeable impact
          if (impactSpeed > 1.0 && !bouncedThisFrame && now - this.lastSoundTime > 60) {
            sound.playBeanBounce(Math.min(1.0, impactSpeed / 4.0));
            this.lastSoundTime = now;
            bouncedThisFrame = true;
          }
        } else {
          // Micro settling
          b.vel.y = 0;
          b.vel.x *= 0.4;
          b.vel.z *= 0.4;
          b.rotVel.multiplyScalar(0.2);

          // Rest condition
          if (Math.abs(b.vel.x) < 0.05 && Math.abs(b.vel.z) < 0.05 && b.bounces > 2) {
            b.vel.set(0, 0, 0);
            b.rotVel.set(0, 0, 0);
            b.isSleeping = true;
          }
        }
      }

      // Update instanced transform
      this.dummy.position.copy(b.pos);
      this.dummy.rotation.copy(b.rot);
      this.dummy.scale.copy(b.scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (needsUpdate) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}

/**
 * Procedural Stylized Coffee Bean Geometry.
 * Symmetrical bean with flat belly and longitudinal curved center groove.
 */
function createStylizedBeanGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(0.065, 12, 10);
  const posAttr = geom.getAttribute('position');
  const pos = posAttr.array as Float32Array;

  // Transform sphere into an authentic coffee bean:
  // - Elongate along Y (bean length)
  // - Slightly flatten front/back (Z)
  // - Indent center crease along Z+ where X ~ 0
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];
    let y = pos[i + 1];
    let z = pos[i + 2];

    // Elongate Y
    y *= 1.45;

    // Flatten bottom side (Z < 0 is flatter, Z > 0 has the crease)
    if (z < 0) {
      z *= 0.8;
    } else {
      // Create longitudinal crease along X = 0 on front side
      const distFromCenterLine = Math.abs(x) / 0.065;
      if (distFromCenterLine < 0.35) {
        // Deep indentation along the midline
        z -= (0.35 - distFromCenterLine) * 0.055;
      }
    }

    pos[i] = x;
    pos[i + 1] = y;
    pos[i + 2] = z;
  }

  geom.computeVertexNormals();
  return geom;
}
