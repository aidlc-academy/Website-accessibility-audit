import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type VisualizerMode = 'observatory' | 'shader' | 'matrix' | 'pour-core';

export const VisualizersView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<VisualizerMode>('observatory');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // --- Visualizer 1: Observatory (Browser Layers + Inspection Lens + Scanner Beam) ---
  useEffect(() => {
    if (activeMode !== 'observatory' || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x0e1322, 1.8);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 3.5, 30);
    cyanLight.position.set(3, 4, 3);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0x8b5cf6, 3.0, 30);
    violetLight.position.set(-3, -2, 2);
    scene.add(violetLight);

    const goldLight = new THREE.PointLight(0xf59e0b, 1.8, 20);
    goldLight.position.set(0, 3, -2);
    scene.add(goldLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Layered Browser Plates
    const plateGroup = new THREE.Group();
    const plates: THREE.Mesh[] = [];
    const plateMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x111827, specular: 0x00f2fe, shininess: 80, transparent: true, opacity: 0.7 }),
      new THREE.MeshPhongMaterial({ color: 0x161f30, specular: 0x8b5cf6, shininess: 90, transparent: true, opacity: 0.8 }),
      new THREE.MeshPhongMaterial({ color: 0x0f172a, specular: 0x00f2fe, shininess: 100, transparent: true, opacity: 0.9 })
    ];

    for (let i = 0; i < 3; i++) {
      const pGeo = new THREE.BoxGeometry(2.6, 1.7, 0.04);
      const pMesh = new THREE.Mesh(pGeo, plateMaterials[i]);
      pMesh.position.set(-0.3 + (i * 0.35), -0.4 + (i * 0.3), -1.2 + (i * 0.9));
      pMesh.rotation.set(-0.15, 0.45, 0.08);

      const wireGeo = new THREE.EdgesGeometry(pGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: i === 1 ? 0x00f2fe : 0x8b5cf6, transparent: true, opacity: 0.45 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      pMesh.add(wire);

      const nodeGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const n1 = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      n1.position.set(-0.7, 0.4, 0.04);
      pMesh.add(n1);

      const n2 = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      n2.position.set(0.3, -0.2, 0.04);
      pMesh.add(n2);

      const n3 = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0x00f2fe }));
      n3.position.set(0.8, 0.5, 0.04);
      pMesh.add(n3);

      plateGroup.add(pMesh);
      plates.push(pMesh);
    }
    masterGroup.add(plateGroup);

    // Inspection Lens Core
    const lensGroup = new THREE.Group();
    lensGroup.position.set(0.6, 0.3, 0.4);

    const outerRingGeo = new THREE.TorusGeometry(1.35, 0.065, 20, 90);
    const outerRingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8, emissive: 0x06182c });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    lensGroup.add(outerRing);

    const innerRingGeo = new THREE.TorusGeometry(1.22, 0.03, 16, 80);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    lensGroup.add(innerRing);

    const glassGeo = new THREE.CylinderGeometry(1.18, 1.18, 0.08, 48);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x00f2fe, transmission: 0.9, opacity: 0.8, transparent: true, roughness: 0.05, ior: 1.5 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = Math.PI / 2;
    lensGroup.add(glass);

    const orbitGeo = new THREE.TorusGeometry(1.68, 0.02, 16, 100);
    const orbitMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9, emissive: 0x3b2405 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 3;
    orbit.rotation.y = Math.PI / 6;
    lensGroup.add(orbit);

    const coneGeo = new THREE.ConeGeometry(1.2, 2.5, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(coneGeo, coneMat);
    beam.rotation.x = -Math.PI / 2;
    beam.position.z = -1.25;
    lensGroup.add(beam);

    masterGroup.add(lensGroup);

    // Depth Particle Dust
    const partCount = 45;
    const partGeo = new THREE.BufferGeometry();
    const partPositions = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i += 3) {
      partPositions[i] = (Math.random() - 0.5) * 8;
      partPositions[i + 1] = (Math.random() - 0.5) * 6;
      partPositions[i + 2] = (Math.random() - 0.5) * 5;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
    const partMat = new THREE.PointsMaterial({ color: 0x00f2fe, size: 0.045, transparent: true, opacity: 0.55 });
    const particleSystem = new THREE.Points(partGeo, partMat);
    scene.add(particleSystem);

    let mouseX = 0, mouseY = 0;
    let targetRotX = 0, targetRotY = 0;
    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = mouseX * 0.4;
      targetRotX = -mouseY * 0.3;
    };
    container.addEventListener('mousemove', handleMove);

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      masterGroup.position.y = Math.sin(elapsed * 0.8) * 0.08;
      masterGroup.rotation.y += (targetRotY - masterGroup.rotation.y) * 0.05;
      masterGroup.rotation.x += (targetRotX - masterGroup.rotation.x) * 0.05;

      innerRing.rotation.z = elapsed * 0.8;
      orbit.rotation.z = -elapsed * 0.5;
      orbit.rotation.y = Math.sin(elapsed * 0.4) * 0.4 + Math.PI / 6;
      beam.material.opacity = 0.08 + Math.sin(elapsed * 2.5) * 0.06;

      plates.forEach((p, idx) => {
        p.position.z = -1.2 + (idx * 0.9) + Math.sin(elapsed * 1.2 + idx) * 0.04;
      });

      particleSystem.rotation.y = elapsed * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMove);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeMode]);

  // --- Visualizer 2: WebGL GLSL Cybernetic Aurora Shader ---
  useEffect(() => {
    if (activeMode !== 'shader' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xyxy + s0.xyxy * sh.xxyy;
    vec4 a1 = b1.xyxy + s1.xyxy * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;
    vec2 mouse = u_mouse / u_resolution;
    float t = u_time * 0.18;
    vec3 pos = vec3(st * 2.8, t);
    float n1 = snoise(pos);
    float n2 = snoise(pos + vec3(4.8, 1.2, t * 0.6));
    
    vec3 color1 = vec3(0.09, 0.11, 0.19); // #171C30 Midnight
    vec3 color2 = vec3(0.32, 0.27, 0.80); // #5145CD Indigo
    vec3 color3 = vec3(0.0, 0.95, 1.0);   // Cyan highlight
    
    vec3 col = mix(color1, color2, smoothstep(-0.8, 0.9, n1 + n2));
    
    float d = distance(st, mouse * vec2(u_resolution.x / u_resolution.y, 1.0));
    float wave = sin(d * 18.0 - u_time * 3.5) * 0.5 + 0.5;
    col += color3 * (1.0 - smoothstep(0.0, 0.45, d)) * 0.4 * wave;
    
    vec2 grid = abs(fract(st * 12.0 - 0.5) - 0.5) / 0.08;
    float line = min(grid.x, grid.y);
    float gridFactor = 1.0 - min(line, 1.0);
    col += color2 * gridFactor * 0.12;
    
    gl_FragColor = vec4(col, 1.0);
}`;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
    };
    canvas.addEventListener('mousemove', handleMove);

    let animId: number;
    let start = performance.now();
    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 550;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      const t = (performance.now() - start) * 0.001;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', handleMove);
    };
  }, [activeMode]);

  // --- Visualizer 3: Matrix / Accessibility Inspection Tree (3D Icosahedrons) ---
  useEffect(() => {
    if (activeMode !== 'matrix' && activeMode !== 'pour-core') return;
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0x5145cd, 3, 50);
    light1.position.set(6, 6, 6);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x00f2fe, 2, 50);
    light2.position.set(-6, -6, 4);
    scene.add(light2);

    const group = new THREE.Group();
    scene.add(group);

    if (activeMode === 'pour-core') {
      // 4 POUR Pillars in Quad Formation
      const colors = [0x5145cd, 0x10b981, 0xf59e0b, 0xef4444];
      colors.forEach((col, idx) => {
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(1.6 + idx * 0.4, 0.08, 16, 80),
          new THREE.MeshStandardMaterial({ color: col, roughness: 0.2, metalness: 0.8 })
        );
        torus.rotation.x = Math.PI / (idx + 1);
        torus.rotation.y = Math.PI / (idx + 2);
        group.add(torus);
      });

      const octa = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.4, 1),
        new THREE.MeshPhysicalMaterial({ color: 0x9286ff, transmission: 0.8, roughness: 0.1 })
      );
      group.add(octa);
    } else {
      // Matrix constellation
      const geo = new THREE.IcosahedronGeometry(0.7, 0);
      for (let i = 0; i < 24; i++) {
        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshStandardMaterial({
            color: i % 3 === 0 ? 0xef4444 : i % 2 === 0 ? 0x5145cd : 0x00f2fe,
            wireframe: i % 2 === 0,
            roughness: 0.3
          })
        );
        mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
        mesh.scale.setScalar(Math.random() * 0.8 + 0.4);
        group.add(mesh);
      }
    }

    const clock = new THREE.Clock();
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      group.rotation.y = elapsed * 0.2;
      group.rotation.x = Math.sin(elapsed * 0.3) * 0.2;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [activeMode]);

  return (
    <section aria-labelledby="visualizer-heading" className="flex flex-col w-full">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant/20">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-primary/20">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">view_in_ar</span>
            Stitch 3D Studio Visualizers
          </div>
          <h1 id="visualizer-heading" className="font-manrope text-2xl font-extrabold text-on-surface">
            Interactive 3D &amp; Shader Visualizer Suite
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Real-time WebGL shaders, depth layers, and WCAG accessibility inspection cores.
          </p>
        </div>

        {/* Mode Pills */}
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 flex-wrap">
          <button
            onClick={() => setActiveMode('observatory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-target-size ${
              activeMode === 'observatory'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Observatory 3D
          </button>
          <button
            onClick={() => setActiveMode('shader')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-target-size ${
              activeMode === 'shader'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            GLSL Aurora Shader
          </button>
          <button
            onClick={() => setActiveMode('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-target-size ${
              activeMode === 'matrix'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Issue Matrix
          </button>
          <button
            onClick={() => setActiveMode('pour-core')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-target-size ${
              activeMode === 'pour-core'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            POUR Core
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Stage */}
      <div className="glass-card bg-surface-container-low rounded-2xl p-4 sm:p-6 shadow-sm border border-outline-variant/20 relative overflow-hidden mb-6">
        <div className="relative w-full h-[540px] rounded-2xl overflow-hidden bg-slate-950/90 border border-outline-variant/20 shadow-inner flex items-center justify-center">
          {activeMode === 'shader' ? (
            <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
          ) : (
            <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          )}

          {/* Interactive Overlay Badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white text-xs flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono font-semibold">
              {activeMode === 'observatory' && 'OBSERVATORY: Multi-Layer Viewport & Optical Lens'}
              {activeMode === 'shader' && 'GLSL SHADER: Simplex Noise Cybernetic Aurora'}
              {activeMode === 'matrix' && 'CONSTELLATION: DOM Issue Node Clusters'}
              {activeMode === 'pour-core' && 'POUR CORE: Perceivable · Operable · Understandable · Robust'}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 text-[11px] pointer-events-none">
            Move mouse or drag to interact in real-time
          </div>
        </div>
      </div>

      {/* Feature Cards for Selected Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-[18px]">layers</span>
            <span className="font-bold text-xs uppercase tracking-wider">DOM Depth Mapping</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Projects DOM z-index hierarchies, fixed overlays, and keyboard focus obscuring layers into true spatial 3D.
          </p>
        </div>

        <div className="glass-card bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-[18px]">stream</span>
            <span className="font-bold text-xs uppercase tracking-wider">Real-time Shaders</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            High-performance hardware-accelerated fragment shaders calculating contrast gradient waves at 60 FPS.
          </p>
        </div>

        <div className="glass-card bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-[18px]">accessibility_new</span>
            <span className="font-bold text-xs uppercase tracking-wider">POUR Principle Nodes</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Multi-spectral nodes color-coded according to WCAG 2.2 AA severities (Critical, Serious, Moderate, Minor).
          </p>
        </div>
      </div>
    </section>
  );
};
