import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CoffeeOrigin, CoffeeWeight, GrindType, BagFinish } from '../types';
import { createCoffeeBag, CoffeeBagBundle } from './createCoffeeBag';
import { BeanPhysicsSystem } from './BeanPhysicsSystem';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  initialOrigin: CoffeeOrigin;
  initialWeight: CoffeeWeight;
  initialGrind: GrindType;
  initialFinish: BagFinish;
  autoRotate: boolean;
}

export class CoffeeSceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private bag: CoffeeBagBundle;
  private beanSystem: BeanPhysicsSystem;
  private clock = new THREE.Clock();
  private frameId: number = 0;
  private isDestroyed = false;
  private isSoftwareGl: boolean;

  // Camera animation
  private targetCamPos = new THREE.Vector3(0, 1.7, 4.2);
  private targetLookAt = new THREE.Vector3(0, 1.05, 0);
  private isAnimatingCam = false;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Horizon Fog Setup (Warm cafe studio ambiance)
    this.scene = new THREE.Scene();
    const bgWarmBeige = new THREE.Color('#EAE3D6');
    this.scene.background = bgWarmBeige;
    this.scene.fog = new THREE.Fog(bgWarmBeige, 6, 20);

    // 3. Studio Environment Map (PMREM + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    // 4. Camera Setup
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, 1.7, 4.2);

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.05, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 7.5;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // Don't go below floor
    this.controls.autoRotate = options.autoRotate;
    this.controls.autoRotateSpeed = 1.2;

    this.controls.addEventListener('start', () => {
      this.isAnimatingCam = false;
    });

    // 6. Floor & Stage
    this.setupFloor();

    // 7. Lighting Rig
    this.setupLighting();

    // 8. Coffee Bag Hero Subject
    this.bag = createCoffeeBag(
      options.initialOrigin,
      options.initialWeight,
      options.initialGrind,
      options.initialFinish,
      this.renderer
    );
    this.scene.add(this.bag.group);

    // 9. Bean Physics Particle System
    this.beanSystem = new BeanPhysicsSystem(this.scene);

    // 10. Event Listeners
    window.addEventListener('resize', this.onResize);

    // Start loop
    this.animate();
  }

  private setupFloor() {
    // Large warm beige floor with subtle micro concentric texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const ctx = floorCanvas.getContext('2d')!;

    // Soft warm gradient with subtle circular cafe podium rings
    const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
    grad.addColorStop(0, '#F5EDE2');
    grad.addColorStop(0.55, '#ECE2D3');
    grad.addColorStop(0.85, '#DFD3C2');
    grad.addColorStop(1, '#D8CCBA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine concentric aesthetic rings
    ctx.strokeStyle = 'rgba(150, 130, 110, 0.09)';
    ctx.lineWidth = 1.5;
    for (let r = 50; r < 240; r += 32) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.wrapS = THREE.ClampToEdgeWrapping;
    floorTexture.wrapT = THREE.ClampToEdgeWrapping;

    const floorGeo = new THREE.PlaneGeometry(24, 24);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.9,
      metalness: 0.02,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = 0;
    this.scene.add(floorMesh);
  }

  private setupLighting() {
    // 1. Hemisphere Light (Soft ambient balance between warm ceiling & earthy floor)
    const hemiLight = new THREE.HemisphereLight(0xfff7ee, 0xd2c2b0, 0.85);
    hemiLight.position.set(0, 15, 0);
    this.scene.add(hemiLight);

    // 2. Key Light (Warm directional sunlight casting soft shadows)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.3);
    keyLight.position.set(3.5, 6.0, 4.0);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1.0;
      keyLight.shadow.camera.far = 16.0;
      const d = 2.8;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // 3. Fill Light (Soft cool lavender-blue fill to enrich shadow depth)
    const fillLight = new THREE.DirectionalLight(0xe2ecff, 0.65);
    fillLight.position.set(-4.0, 4.0, -2.0);
    this.scene.add(fillLight);

    // 4. Warm Rim/Back Light (Separates bag silhouette from beige background)
    const rimLight = new THREE.DirectionalLight(0xffdfc4, 1.1);
    rimLight.position.set(0, 3.5, -4.5);
    this.scene.add(rimLight);
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private animate = () => {
    if (this.isDestroyed) return;

    const delta = this.clock.getDelta();

    // Update controls
    this.controls.update();

    // Smooth camera transition if active
    if (this.isAnimatingCam) {
      this.camera.position.lerp(this.targetCamPos, THREE.MathUtils.clamp(delta * 4.5, 0, 1));
      this.controls.target.lerp(this.targetLookAt, THREE.MathUtils.clamp(delta * 4.5, 0, 1));
      if (this.camera.position.distanceTo(this.targetCamPos) < 0.02) {
        this.camera.position.copy(this.targetCamPos);
        this.controls.target.copy(this.targetLookAt);
        this.isAnimatingCam = false;
      }
    }

    // Tick bag animation (damping scale, color lerp)
    this.bag.tick(delta);

    // Tick coffee bean physics
    this.beanSystem.update(delta, this.bag.group.scale);

    // Render
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.animate);
  };

  // Public API methods
  public spawnBeans(count = 45) {
    const topPos = this.bag.getTopPourPosition();
    this.beanSystem.spawnBeans(count, topPos);
  }

  public clearBeans() {
    this.beanSystem.clearAll();
  }

  public getBeanCount(): number {
    return this.beanSystem.getActiveCount();
  }

  public setOrigin(origin: CoffeeOrigin, finish: BagFinish) {
    this.bag.updateOrigin(origin, finish);
  }

  public setWeight(weight: CoffeeWeight) {
    this.bag.updateWeight(weight);
  }

  public setGrind(grind: GrindType) {
    this.bag.updateGrind(grind);
  }

  public setFinish(finish: BagFinish) {
    this.bag.updateFinish(finish);
  }

  public setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled;
  }

  public setCameraView(preset: 'front' | 'angled' | 'top' | 'close') {
    this.isAnimatingCam = true;
    switch (preset) {
      case 'front':
        this.targetCamPos.set(0, 1.25, 3.8);
        this.targetLookAt.set(0, 1.05, 0);
        break;
      case 'angled':
        this.targetCamPos.set(2.6, 2.0, 3.2);
        this.targetLookAt.set(0, 1.05, 0);
        break;
      case 'top':
        this.targetCamPos.set(0, 4.3, 0.8);
        this.targetLookAt.set(0, 0.8, 0);
        break;
      case 'close':
        this.targetCamPos.set(0, 1.1, 2.4);
        this.targetLookAt.set(0, 1.05, 0);
        break;
    }
  }

  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.frameId);

    this.controls.dispose();
    this.bag.dispose();
    this.beanSystem.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
