/**
 * AccessLens — Three.js 3D Immersive Canvas
 * Generates an interactive 3D Access Lens with orbiting accessibility nodes.
 */

class ThreeSceneManager {
  constructor(containerId = 'canvas-container') {
    this.container = document.getElementById(containerId);
    this.isEnabled = true;
    this.animationFrameId = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.group = null;
    this.prism = null;
    this.nodes = [];
    this.clock = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.checkReducedMotion();
    this.init();
  }

  checkReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = mediaQuery.matches;
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  init() {
    if (!this.container || typeof THREE === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x5145CD, 3.5, 60);
    pointLight.position.set(6, 6, 6);
    this.scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xd5d9f4, 2.5, 60);
    pointLight2.position.set(-6, -6, 3);
    this.scene.add(pointLight2);

    // Group for the 3D Access Lens
    this.group = new THREE.Group();

    // Outer Lens Ring (Torus)
    const ringGeo = new THREE.TorusGeometry(1.6, 0.14, 20, 100);
    const ringMat = new THREE.MeshPhongMaterial({
      color: 0x5145CD,
      shininess: 120,
      specular: 0xd5d9f4,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(ring);

    // Inner Core Diamond / Prism
    const prismGeo = new THREE.OctahedronGeometry(0.85, 0);
    const prismMat = new THREE.MeshPhongMaterial({
      color: 0x7c72f5,
      shininess: 140,
      emissive: 0x221a66,
      transparent: true,
      opacity: 0.95
    });
    this.prism = new THREE.Mesh(prismGeo, prismMat);
    this.group.add(this.prism);

    // Orbiting Accessibility Nodes (POUR principles)
    const nodeCount = 6;
    const nodeLabels = ['Perceivable', 'Operable', 'Understandable', 'Robust', 'Target Size 24px', 'Focus Visible'];
    this.nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const sphereGeo = new THREE.SphereGeometry(0.18, 20, 20);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x5145CD : 0x10b981,
        emissive: i % 2 === 0 ? 0x221a66 : 0x064e3b,
        shininess: 100
      });
      const node = new THREE.Mesh(sphereGeo, sphereMat);
      node.userData = {
        angle: angle,
        speed: 0.4 + i * 0.15,
        radius: 2.6,
        label: nodeLabels[i]
      };
      this.scene.add(node);
      this.nodes.push(node);
    }

    this.scene.add(this.group);

    // Mouse Listeners
    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Resize Listener
    window.addEventListener('resize', () => this.onResize());

    this.clock = new THREE.Clock();
    this.animate();
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (!this.isEnabled) return;

    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.prefersReducedMotion) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const elapsedTime = this.clock.getElapsedTime();

    this.targetX += (this.mouseX - this.targetX) * 0.05;
    this.targetY += (this.mouseY - this.targetY) * 0.05;

    if (this.group) {
      this.group.rotation.x = elapsedTime * 0.2 + this.targetY * 0.4;
      this.group.rotation.y = elapsedTime * 0.3 + this.targetX * 0.4;
    }

    if (this.prism) {
      this.prism.rotation.y -= 0.012;
      this.prism.rotation.z += 0.008;
    }

    this.nodes.forEach((node, idx) => {
      const a = node.userData.angle + elapsedTime * node.userData.speed;
      node.position.x = Math.cos(a) * node.userData.radius;
      node.position.z = Math.sin(a) * node.userData.radius;
      node.position.y = Math.sin(elapsedTime * 1.5 + idx) * 0.6;
    });

    this.renderer.render(this.scene, this.camera);
  }

  toggle(enabled) {
    this.isEnabled = enabled;
    if (this.container) {
      this.container.style.display = enabled ? 'block' : 'none';
    }
    if (enabled && !this.animationFrameId) {
      this.animate();
    } else if (!enabled && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

window.ThreeSceneManager = ThreeSceneManager;
