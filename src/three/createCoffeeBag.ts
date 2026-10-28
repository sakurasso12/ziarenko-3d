import * as THREE from 'three';
import { CoffeeOrigin, CoffeeWeight, GrindType, BagFinish } from '../types';
import { createLabelTexture, updateLabelTexture } from './createLabelTexture';
import { WEIGHT_OPTIONS } from '../constants/coffeeData';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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

  // 1. Bag body: one closed rounded box standing on the floor (no open faces, no gaps)
  const bagGeometry = new RoundedBoxGeometry(w, h, d, 4, 0.12);
  bagGeometry.translate(0, h / 2, 0);

  // Bag Body Material
  const bagColor = new THREE.Color(initialOrigin.color);
  const bagMaterial = new THREE.MeshStandardMaterial({
    color: bagColor,
    roughness: initialFinish === 'kraft' ? 0.82 : 0.45,
    metalness: initialFinish === 'kraft' ? 0.02 : 0.08,
  });

  const bagMesh = new THREE.Mesh(bagGeometry, bagMaterial);
  bagMesh.castShadow = true;
  bagMesh.receiveShadow = true;
  rootGroup.add(bagMesh);

  // 2. Heat-sealed top strip, sunk slightly into the body so there is no visible gap
  const topCrimpGroup = new THREE.Group();
  topCrimpGroup.position.set(0, h, 0);

  const pinchGeo = new RoundedBoxGeometry(w * 0.96, foldH, 0.1, 2, 0.03);
  pinchGeo.translate(0, foldH / 2 - 0.03, 0);
  const crimpMaterial = new THREE.MeshStandardMaterial({
    color: bagColor,
    roughness: 0.5,
    metalness: 0.1,
  });
  const pinchMesh = new THREE.Mesh(pinchGeo, crimpMaterial);
  pinchMesh.castShadow = true;
  topCrimpGroup.add(pinchMesh);

  // Tin-tie wrapped around the seal strip
  const tinTieGeo = new THREE.BoxGeometry(w * 0.98, 0.07, 0.13);
  const tinTieMat = new THREE.MeshStandardMaterial({
    color: initialFinish === 'kraft' ? 0x2e1e16 : 0xd1b48c,
    roughness: 0.35,
    metalness: 0.3,
  });
  const tinTieMesh = new THREE.Mesh(tinTieGeo, tinTieMat);
  tinTieMesh.position.set(0, foldH * 0.7, 0);
  tinTieMesh.castShadow = true;
  topCrimpGroup.add(tinTieMesh);

  rootGroup.add(topCrimpGroup);

  // 3. Degassing valve, its back face resting on the flat front wall
  const valveGroup = new THREE.Group();
  valveGroup.position.set(0, h * 0.82, d * 0.5 + 0.01);

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

  const valveInnerGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.022, 24);
  valveInnerGeo.rotateX(Math.PI / 2);
  const valveInnerMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.4,
  });
  const valveInner = new THREE.Mesh(valveInnerGeo, valveInnerMat);
  valveGroup.add(valveInner);

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

  // 4. Front label, lying on the flat part of the front wall
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
  labelMesh.position.set(0, h * 0.4, d * 0.5 + 0.002);
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
