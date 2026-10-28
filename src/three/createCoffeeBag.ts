import * as THREE from 'three';
import { CoffeeOrigin, CoffeeWeight, GrindType, BagFinish } from '../types';
import { createLabelTexture, updateLabelTexture } from './createLabelTexture';
import { WEIGHT_OPTIONS } from '../constants/coffeeData';

export interface CoffeeBagBundle {
  group: THREE.Group;
  updateOrigin: (origin: CoffeeOrigin, finish: BagFinish) => void;
  updateWeight: (weight: CoffeeWeight) => void;
  updateGrind: (grind: GrindType) => void;
  updateFinish: (finish: BagFinish) => void;
  tick: (delta: number) => void;
  dispose: () => void;
  getCenterPosition: () => THREE.Vector3;
  getTopPourPosition: () => THREE.Vector3;
}

export function createCoffeeBag(
  initialOrigin: CoffeeOrigin,
  initialWeight: CoffeeWeight,
  initialGrind: GrindType,
  initialFinish: BagFinish,
  renderer: THREE.WebGLRenderer
): CoffeeBagBundle {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'CoffeeBagRoot';

  // Base dimensions of the stylized pouch
  const w = 1.45;    // width
  const h = 2.05;    // main pouch height
  const d = 0.95;    // depth
  const foldH = 0.42;// folded top height

  // 1. Procedural Custom Geometry for Low-Poly Gusseted Coffee Bag
  // We construct the pouch vertices so side gussets fold inward slightly and top tapers
  const bagGeometry = createLowPolyPouchGeometry(w, h, d);
  bagGeometry.computeVertexNormals();

  // Bag Body Material
  const bagColor = new THREE.Color(initialOrigin.color);
  const bagMaterial = new THREE.MeshStandardMaterial({
    color: bagColor,
    roughness: initialFinish === 'kraft' ? 0.82 : 0.45,
    metalness: initialFinish === 'kraft' ? 0.02 : 0.08,
    bumpScale: 0.02,
  });

  const bagMesh = new THREE.Mesh(bagGeometry, bagMaterial);
  bagMesh.castShadow = true;
  bagMesh.receiveShadow = true;
  bagMesh.position.y = 0;
  rootGroup.add(bagMesh);

  // 2. Folded Top Crimp & Closure Flap (Characteristic Specialty Coffee Fold)
  // The top is pinched flat and folded over forward
  const topCrimpGroup = new THREE.Group();
  topCrimpGroup.position.set(0, h, 0);

  // Pinch seal crimp (heat-sealed ribbed top)
  const pinchGeo = new THREE.BoxGeometry(w * 0.98, foldH * 0.4, 0.08);
  const crimpMaterial = new THREE.MeshStandardMaterial({
    color: bagColor,
    roughness: 0.5,
    metalness: 0.1,
  });
  const pinchMesh = new THREE.Mesh(pinchGeo, crimpMaterial);
  pinchMesh.position.set(0, foldH * 0.2, 0);
  pinchMesh.castShadow = true;
  topCrimpGroup.add(pinchMesh);

  // Folded flap that flips forward
  const flapGeo = new THREE.BoxGeometry(w * 0.96, foldH * 0.55, 0.1);
  const flapMesh = new THREE.Mesh(flapGeo, crimpMaterial);
  flapMesh.position.set(0, foldH * 0.1, 0.07);
  flapMesh.rotation.x = 0.2; // slight forward fold
  flapMesh.castShadow = true;
  topCrimpGroup.add(flapMesh);

  // Tin-Tie / Seal Clip Strip across the fold
  const tinTieGeo = new THREE.BoxGeometry(w * 1.04, 0.1, 0.12);
  const tinTieMat = new THREE.MeshStandardMaterial({
    color: initialFinish === 'kraft' ? 0x2e1e16 : 0xd1b48c,
    roughness: 0.35,
    metalness: 0.3,
  });
  const tinTieMesh = new THREE.Mesh(tinTieGeo, tinTieMat);
  tinTieMesh.position.set(0, foldH * 0.22, 0.1);
  tinTieMesh.castShadow = true;
  topCrimpGroup.add(tinTieMesh);

  rootGroup.add(topCrimpGroup);

  // 3. Degassing One-Way Valve (Aroma Valve on Upper Chest)
  const valveGroup = new THREE.Group();
  valveGroup.position.set(0, h * 0.82, d * 0.5 + 0.008);

  // Outer ring
  const valveOuterGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24);
  valveOuterGeo.rotateX(Math.PI / 2);
  const valveMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.6,
    metalness: 0.2,
  });
  const valveOuter = new THREE.Mesh(valveOuterGeo, valveMat);
  valveOuter.castShadow = true;
  valveGroup.add(valveOuter);

  // Inner membrane
  const valveInnerGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.022, 24);
  valveInnerGeo.rotateX(Math.PI / 2);
  const valveInnerMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.4,
  });
  const valveInner = new THREE.Mesh(valveInnerGeo, valveInnerMat);
  valveGroup.add(valveInner);

  // 3 tiny pinhole vents in the center
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const pinGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.025, 8);
    pinGeo.rotateX(Math.PI / 2);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(Math.cos(angle) * 0.025, Math.sin(angle) * 0.025, 0.002);
    valveGroup.add(pin);
  }
  rootGroup.add(valveGroup);

  // 4. Front Label Plaque (Crisp Procedural Texture)
  const labelWidth = w * 0.78;
  const labelHeight = h * 0.64;
  const labelTexture = createLabelTexture(
    initialOrigin,
    initialWeight,
    initialGrind,
    initialFinish,
    renderer
  );

  const labelGeo = new THREE.PlaneGeometry(labelWidth, labelHeight);
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: initialFinish === 'kraft' ? 0.8 : 0.4,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, h * 0.38, d * 0.5 + 0.004);
  labelMesh.receiveShadow = true;
  rootGroup.add(labelMesh);

  // 5. Contact Shadow Disk (Directly on Floor Underneath)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(30, 20, 10, 0.55)');
  grad.addColorStop(0.4, 'rgba(40, 25, 15, 0.35)');
  grad.addColorStop(0.7, 'rgba(50, 30, 20, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(w * 1.9, d * 2.2);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.003;
  rootGroup.add(shadowMesh);

  // State & Animation
  let currentOrigin = initialOrigin;
  let currentWeight = initialWeight;
  let currentGrind = initialGrind;
  let currentFinish = initialFinish;

  // Scale animation targets
  const initialOpt = WEIGHT_OPTIONS.find(o => o.id === initialWeight) || WEIGHT_OPTIONS[0];
  const targetScale = new THREE.Vector3(...initialOpt.scale);
  const currentScale = new THREE.Vector3(...initialOpt.scale);
  rootGroup.scale.copy(currentScale);

  // Target color for smooth color transitions
  const targetColor = new THREE.Color(initialOrigin.color);

  function updateOrigin(origin: CoffeeOrigin, finish: BagFinish) {
    currentOrigin = origin;
    currentFinish = finish;
    targetColor.set(origin.color);
    updateLabelTexture(labelTexture, origin, currentWeight, currentGrind, finish);

    if (finish === 'kraft') {
      tinTieMat.color.setHex(0x2e1e16);
      bagMaterial.roughness = 0.82;
      labelMat.roughness = 0.8;
    } else {
      tinTieMat.color.set(origin.accentColor);
      bagMaterial.roughness = 0.45;
      labelMat.roughness = 0.4;
    }
  }

  function updateWeight(weight: CoffeeWeight) {
    currentWeight = weight;
    const opt = WEIGHT_OPTIONS.find(o => o.id === weight) || WEIGHT_OPTIONS[0];
    targetScale.set(...opt.scale);
    updateLabelTexture(labelTexture, currentOrigin, weight, currentGrind, currentFinish);
  }

  function updateGrind(grind: GrindType) {
    currentGrind = grind;
    updateLabelTexture(labelTexture, currentOrigin, currentWeight, grind, currentFinish);
  }

  function updateFinish(finish: BagFinish) {
    currentFinish = finish;
    updateOrigin(currentOrigin, finish);
  }

  function tick(delta: number) {
    // Smooth damping for scale change
    const lambda = 8.0;
    currentScale.x = THREE.MathUtils.damp(currentScale.x, targetScale.x, lambda, delta);
    currentScale.y = THREE.MathUtils.damp(currentScale.y, targetScale.y, lambda, delta);
    currentScale.z = THREE.MathUtils.damp(currentScale.z, targetScale.z, lambda, delta);
    rootGroup.scale.copy(currentScale);

    // Smooth bag color lerp
    bagMaterial.color.lerp(targetColor, THREE.MathUtils.clamp(delta * 6, 0, 1));
    crimpMaterial.color.lerp(targetColor, THREE.MathUtils.clamp(delta * 6, 0, 1));
  }

  function dispose() {
    bagGeometry.dispose();
    bagMaterial.dispose();
    pinchGeo.dispose();
    crimpMaterial.dispose();
    flapGeo.dispose();
    tinTieGeo.dispose();
    tinTieMat.dispose();
    valveOuterGeo.dispose();
    valveMat.dispose();
    valveInnerGeo.dispose();
    valveInnerMat.dispose();
    labelGeo.dispose();
    labelMat.dispose();
    labelTexture.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
    shadowTexture.dispose();
  }

  function getCenterPosition() {
    return new THREE.Vector3(0, (h / 2) * currentScale.y, 0);
  }

  function getTopPourPosition() {
    return new THREE.Vector3(0, (h + foldH) * currentScale.y + 0.8, 0);
  }

  return {
    group: rootGroup,
    updateOrigin,
    updateWeight,
    updateGrind,
    updateFinish,
    tick,
    dispose,
    getCenterPosition,
    getTopPourPosition,
  };
}

/**
 * Creates custom low-poly stylized stand-up pouch geometry.
 * Sits flush on the floor at Y = 0.
 * Includes side gusset crease indentation and tapered shoulders towards the pinch top.
 */
function createLowPolyPouchGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w * 0.5;
  const hd = d * 0.5;

  // Levels along height:
  // y0: 0.0 (bottom base, sitting flush on floor)
  // y1: h * 0.25 (lower body swell)
  // y2: h * 0.72 (upper body chest)
  // y3: h (tapered pinch neck)
  const y0 = 0.0;
  const y1 = h * 0.25;
  const y2 = h * 0.75;
  const y3 = h;

  // Positions array for indexed geometry
  // Vertices for each layer:
  // Front-Left, Front-Center, Front-Right, Right-Gusset-Fold, Back-Right, Back-Center, Back-Left, Left-Gusset-Fold
  // Layer 0 (Base - rectangular flat bottom)
  const p0 = [
    [-hw * 0.95, y0,  hd * 0.9],
    [ 0,         y0,  hd * 0.95],
    [ hw * 0.95, y0,  hd * 0.9],
    [ hw * 0.95, y0,  0],
    [ hw * 0.95, y0, -hd * 0.9],
    [ 0,         y0, -hd * 0.95],
    [-hw * 0.95, y0, -hd * 0.9],
    [-hw * 0.95, y0,  0],
  ];

  // Layer 1 (Lower mid - slightly puffed outward, authentic pouch volume)
  const p1 = [
    [-hw * 1.0, y1,  hd * 1.0],
    [ 0,        y1,  hd * 1.03],
    [ hw * 1.0, y1,  hd * 1.0],
    [ hw * 0.9, y1,  0], // gusset tucks in slightly
    [ hw * 1.0, y1, -hd * 1.0],
    [ 0,        y1, -hd * 1.03],
    [-hw * 1.0, y1, -hd * 1.0],
    [-hw * 0.9, y1,  0],
  ];

  // Layer 2 (Upper chest - starts narrowing)
  const p2 = [
    [-hw * 0.98, y2,  hd * 0.88],
    [ 0,         y2,  hd * 0.90],
    [ hw * 0.98, y2,  hd * 0.88],
    [ hw * 0.82, y2,  0], // gusset tucks deeper
    [ hw * 0.98, y2, -hd * 0.88],
    [ 0,         y2, -hd * 0.90],
    [-hw * 0.98, y2, -hd * 0.88],
    [-hw * 0.82, y2,  0],
  ];

  // Layer 3 (Pinch neck - depth collapses into a thin seal line)
  const p3 = [
    [-hw * 0.95, y3,  0.04],
    [ 0,         y3,  0.04],
    [ hw * 0.95, y3,  0.04],
    [ hw * 0.85, y3,  0],
    [ hw * 0.95, y3, -0.04],
    [ 0,         y3, -0.04],
    [-hw * 0.95, y3, -0.04],
    [-hw * 0.85, y3,  0],
  ];

  const allVertices: number[] = [];
  const addRing = (ring: number[][]) => {
    ring.forEach(([x, y, z]) => allVertices.push(x, y, z));
  };

  addRing(p0); // indices 0 - 7
  addRing(p1); // indices 8 - 15
  addRing(p2); // indices 16 - 23
  addRing(p3); // indices 24 - 31

  // Bottom center vertex for bottom cap
  const bCenterIdx = 32;
  allVertices.push(0, y0, 0);

  const indices: number[] = [];

  // Helper to bridge ring A to ring B
  const bridgeRings = (offsetA: number, offsetB: number) => {
    for (let i = 0; i < 8; i++) {
      const next = (i + 1) % 8;
      const a1 = offsetA + i;
      const a2 = offsetA + next;
      const b1 = offsetB + i;
      const b2 = offsetB + next;

      indices.push(a1, b1, a2);
      indices.push(a2, b1, b2);
    }
  };

  bridgeRings(0, 8);   // Layer 0 to 1
  bridgeRings(8, 16);  // Layer 1 to 2
  bridgeRings(16, 24); // Layer 2 to 3

  // Bottom cap
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;
    indices.push(bCenterIdx, next, i);
  }

  // Top cap (pinched thin seal)
  // Connect 24, 25, 26 with 30, 29, 28
  indices.push(24, 26, 25);
  indices.push(24, 30, 26);
  indices.push(26, 30, 28);
  indices.push(30, 29, 28);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
  geometry.setIndex(indices);

  // Compute UVs for nice texturing
  const uvs: number[] = [];
  for (let i = 0; i < allVertices.length; i += 3) {
    const x = allVertices[i];
    const y = allVertices[i + 1];
    const u = (x / w) + 0.5;
    const v = y / h;
    uvs.push(u, v);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  return geometry;
}
