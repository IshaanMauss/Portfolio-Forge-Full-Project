import React, { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BoxGeometry, MeshStandardMaterial,
  AmbientLight, DirectionalLight, PointLight, BufferGeometry, Float32BufferAttribute, Points,
  PointsMaterial, Color, IcosahedronGeometry, MeshBasicMaterial,
} from 'three';

const cssColor = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new Color(v || fallback);
};

// A fan of floating "portfolio pages" with drifting particles. Lightweight on purpose:
// ~10 meshes, one render per frame, paused when off-screen or the tab is hidden.
function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (err) {
      return undefined; // No WebGL: the CSS fallback behind the canvas stays visible.
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 760px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.2, 7);

    scene.add(new AmbientLight(0xffffff, 0.8));
    const key = new DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 5);
    scene.add(key);
    const glow = new PointLight(0xffffff, 18, 14);
    glow.position.set(-3, -1, 3);
    scene.add(glow);

    const root = new Group();
    scene.add(root);

    const cards = [];
    const mats = { body: [], accent: [], line: [], ring: null, dots: null };
    const COUNT = 5;
    for (let i = 0; i < COUNT; i += 1) {
      const g = new Group();
      const body = new MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 });
      const accent = new MeshStandardMaterial({ roughness: 0.4 });
      const line = new MeshStandardMaterial({ roughness: 0.6, transparent: true, opacity: 0.55 });
      mats.body.push(body); mats.accent.push(accent); mats.line.push(line);
      g.add(new Mesh(new BoxGeometry(1.5, 2, 0.06), body));
      const head = new Mesh(new BoxGeometry(1.2, 0.22, 0.04), accent); head.position.set(0, 0.7, 0.05); g.add(head);
      [0.25, -0.05, -0.35, -0.65].forEach((y, k) => {
        const bar = new Mesh(new BoxGeometry(k === 3 ? 0.7 : 1.2, 0.09, 0.03), line);
        bar.position.set(k === 3 ? -0.25 : 0, y, 0.05); g.add(bar);
      });
      const off = i - (COUNT - 1) / 2;
      g.position.set(off * 0.95, 0, -Math.abs(off) * 0.35);
      g.rotation.y = -off * 0.22;
      g.userData = { off, phase: i * 1.3 };
      root.add(g);
      cards.push(g);
    }

    const ringMat = new MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.35 });
    mats.ring = ringMat;
    const ring = new Mesh(new IcosahedronGeometry(2.6, 1), ringMat);
    ring.position.z = -2;
    root.add(ring);

    const N = small ? 70 : 140;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const dotsGeo = new BufferGeometry();
    dotsGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    const dotsMat = new PointsMaterial({ size: 0.045, transparent: true, opacity: 0.8 });
    mats.dots = dotsMat;
    const dots = new Points(dotsGeo, dotsMat);
    scene.add(dots);

    const applyColors = () => {
      const surface = cssColor('--surface-2', '#381f4a');
      const primary = cssColor('--primary', '#e9b6da');
      const cta = cssColor('--cta', '#ff6a2b');
      const text = cssColor('--text', '#f6ecf5');
      mats.body.forEach((m) => m.color.copy(surface));
      mats.accent.forEach((m, i) => m.color.copy(i % 2 ? cta : primary));
      mats.line.forEach((m) => m.color.copy(text));
      mats.ring.color.copy(primary);
      mats.dots.color.copy(primary);
      glow.color.copy(cta);
    };
    applyColors();
    const themeObserver = new MutationObserver(applyColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const target = { x: 0, y: 0 };
    const onPointer = (e) => {
      const r = mount.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const resize = () => {
      const w = mount.clientWidth || 300;
      const h = mount.clientHeight || 300;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = w / h < 1.1 ? 9.5 : 7;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let visible = true;
    let raf = 0;
    const clock = { t: 0, last: performance.now() };
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((now - clock.last) / 1000, 0.05);
      clock.last = now;
      clock.t += dt;
      const t = clock.t;
      root.rotation.y += (target.x * 0.35 - root.rotation.y) * 0.05;
      root.rotation.x += (target.y * 0.15 - root.rotation.x) * 0.05;
      cards.forEach((c) => {
        c.position.y = Math.sin(t * 0.9 + c.userData.phase) * 0.12;
        c.rotation.z = Math.sin(t * 0.5 + c.userData.phase) * 0.03;
      });
      ring.rotation.y = t * 0.12;
      ring.rotation.x = t * 0.06;
      dots.rotation.y = t * 0.03;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduceMotion) { renderer.render(scene, camera); return; }
      if (!raf) { clock.last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); }, { threshold: 0.01 });
    io.observe(mount);
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect(); resizeObserver.disconnect(); themeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="hero3d" ref={mountRef} />;
}

export default Hero3D;
