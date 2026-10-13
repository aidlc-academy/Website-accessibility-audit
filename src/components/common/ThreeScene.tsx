import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  enabled: boolean;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteractive, setIsInteractive] = useState<boolean>(true);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', onMotionChange);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.pointerEvents = isInteractive ? 'auto' : 'none';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0x5145cd, 4, 60);
    mainLight.position.set(10, 10, 10);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x9286ff, 3, 50);
    rimLight.position.set(-10, -8, 5);
    scene.add(rimLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 2.5, 40);
    emeraldLight.position.set(0, 8, -5);
    scene.add(emeraldLight);

    // Main 3D Groups
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // --- Object 1: Audit Lens & Quantum Ring ---
    const lensGroup = new THREE.Group();
    rootGroup.add(lensGroup);

    const torusGeo = new THREE.TorusGeometry(3.2, 0.22, 24, 120);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x5145cd,
      roughness: 0.25,
      metalness: 0.8,
      wireframe: false,
    });
    const outerRing = new THREE.Mesh(torusGeo, torusMat);
    lensGroup.add(outerRing);

    const innerRingGeo = new THREE.TorusGeometry(2.4, 0.1, 16, 80);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x9286ff,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    lensGroup.add(innerRing);

    // Central Multi-faceted Core (POUR Core)
    const coreGeo = new THREE.OctahedronGeometry(1.6, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x7c72f5,
      roughness: 0.15,
      metalness: 0.7,
      transparent: true,
      opacity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    lensGroup.add(coreMesh);

    // Orbiting WCAG POUR Pillar Nodes
    const pourColors = [0x5145cd, 0x10b981, 0x3b82f6, 0x8b5cf6, 0xec4899, 0xf59e0b];
    const nodes: THREE.Mesh[] = [];
    pourColors.forEach((color, i) => {
      const nodeGeo = new THREE.SphereGeometry(0.32, 24, 24);
      const nodeMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.5,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / pourColors.length) * Math.PI * 2;
      node.userData = {
        angle,
        speed: 0.35 + i * 0.08,
        radius: 4.5 + (i % 2) * 0.8,
      };
      lensGroup.add(node);
      nodes.push(node);
    });

    // --- Object 2: Floating 3D Geometric Audit Nodes (Icosahedrons) ---
    const particlesGroup = new THREE.Group();
    rootGroup.add(particlesGroup);

    const geoIcosa = new THREE.IcosahedronGeometry(0.65, 0);
    const matWire = new THREE.MeshStandardMaterial({
      color: 0x5145cd,
      wireframe: true,
      roughness: 0.3,
    });
    const matSolid = new THREE.MeshStandardMaterial({
      color: 0x9286ff,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8,
    });

    const particles: Array<{
      mesh: THREE.Mesh;
      rotX: number;
      rotY: number;
      initialY: number;
      speed: number;
    }> = [];

    for (let i = 0; i < 30; i++) {
      const mesh = new THREE.Mesh(geoIcosa, i % 2 === 0 ? matWire : matSolid);
      const scale = Math.random() * 1.5 + 0.6;
      mesh.scale.set(scale, scale, scale);
      mesh.position.x = (Math.random() - 0.5) * 32;
      mesh.position.y = (Math.random() - 0.5) * 20;
      mesh.position.z = (Math.random() - 0.5) * 16 - 3;
      particlesGroup.add(mesh);
      particles.push({
        mesh,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
        initialY: mesh.position.y,
        speed: Math.random() * 0.02 + 0.01,
      });
    }

    // --- Interactive Mouse & Drag Rotation ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const normalizedX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normalizedY = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseX = normalizedX;
      mouseY = normalizedY;

      if (isDragging && isInteractive) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      // Only drag on canvas background
      if ((e.target as HTMLElement)?.tagName === 'CANVAS') {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
      }

      const elapsed = clock.getElapsedTime();

      // Camera gentle parallax
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Root Group Rotation (User drag + gentle auto spin)
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08 + 0.002;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;

      // Lens Component Animation
      outerRing.rotation.x = elapsed * 0.25;
      outerRing.rotation.y = elapsed * 0.35;
      innerRing.rotation.y = -elapsed * 0.4;
      innerRing.rotation.z = elapsed * 0.2;

      coreMesh.rotation.x = -elapsed * 0.3;
      coreMesh.rotation.y = elapsed * 0.45;

      // Orbiting POUR Nodes
      nodes.forEach((node, i) => {
        const u = node.userData;
        const a = u.angle + elapsed * u.speed;
        node.position.x = Math.cos(a) * u.radius;
        node.position.z = Math.sin(a) * u.radius;
        node.position.y = Math.sin(elapsed * 1.5 + i) * 1.2;
      });

      // Floating Particle Animation
      particles.forEach((p, idx) => {
        p.mesh.rotation.x += p.rotX;
        p.mesh.rotation.y += p.rotY;
        p.mesh.position.y = p.initialY + Math.sin(elapsed * p.speed + idx) * 1.2;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', onMotionChange);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      geoIcosa.dispose();
      matWire.dispose();
      matSolid.dispose();
    };
  }, [enabled, isInteractive]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-0 overflow-hidden"
        style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
        aria-hidden="true"
      />
      {/* 3D Floating Interactive HUD Controls in Bottom Right */}
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 bg-surface-container-lowest/85 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-outline-variant/30 text-xs select-none">
        <div className="flex items-center gap-1.5 text-on-surface font-semibold">
          <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">view_in_ar</span>
          <span className="hidden sm:inline">Interactive 3D Lens</span>
        </div>
        <div className="h-4 w-px bg-outline-variant/40" />
        <button
          type="button"
          onClick={() => setIsInteractive(!isInteractive)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            isInteractive
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          }`}
          title={isInteractive ? 'Click to lock background' : 'Click to enable 3D mouse rotation'}
        >
          {isInteractive ? 'Orbit Active' : 'Orbit Paused'}
        </button>
      </div>
    </>
  );
};
