import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  enabled: boolean;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x5145cd, 3.5, 60);
    pointLight1.position.set(6, 6, 6);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xd5d9f4, 2.5, 60);
    pointLight2.position.set(-6, -6, 3);
    scene.add(pointLight2);

    // Group for Lens
    const group = new THREE.Group();

    // Outer Torus Ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.14, 20, 100);
    const ringMat = new THREE.MeshPhongMaterial({
      color: 0x5145cd,
      shininess: 120,
      specular: 0xd5d9f4,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Inner Prism
    const prismGeo = new THREE.OctahedronGeometry(0.85, 0);
    const prismMat = new THREE.MeshPhongMaterial({
      color: 0x7c72f5,
      shininess: 140,
      emissive: 0x221a66,
      transparent: true,
      opacity: 0.95
    });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    group.add(prism);

    // Orbiting Nodes (POUR)
    const nodeCount = 6;
    const nodes: THREE.Mesh[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.18, 20, 20);

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const sphereMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x5145cd : 0x10b981,
        emissive: i % 2 === 0 ? 0x221a66 : 0x064e3b,
        shininess: 100
      });
      const node = new THREE.Mesh(sphereGeo, sphereMat);
      node.userData = {
        angle: angle,
        speed: 0.4 + i * 0.15,
        radius: 2.6
      };
      scene.add(node);
      nodes.push(node);
    }

    scene.add(group);

    // Mouse Listeners
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Resize Handler
    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
      }

      const elapsedTime = clock.getElapsedTime();
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      group.rotation.x = elapsedTime * 0.2 + targetY * 0.4;
      group.rotation.y = elapsedTime * 0.3 + targetX * 0.4;

      prism.rotation.y -= 0.012;
      prism.rotation.z += 0.008;

      nodes.forEach((node, idx) => {
        const a = node.userData.angle + elapsedTime * node.userData.speed;
        node.position.x = Math.cos(a) * node.userData.radius;
        node.position.z = Math.sin(a) * node.userData.radius;
        node.position.y = Math.sin(elapsedTime * 1.5 + idx) * 0.6;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      mediaQuery.removeEventListener('change', onMotionChange);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      prismGeo.dispose();
      prismMat.dispose();
      sphereGeo.dispose();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
