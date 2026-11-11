import React, { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Points, BufferGeometry, BufferAttribute, ShaderMaterial,
  AdditiveBlending, NormalBlending, Color, Vector3,
} from 'three';

// A GPU particle universe. Tens of thousands of points live in ONE draw call; every position is
// computed in the vertex shader, so the CPU only sends a handful of numbers per frame.
// The cloud morphs between shapes (sphere, torus knot, galaxy, floating pages, your own word),
// repels from the cursor, ripples when you click, and adapts its count to the device.

const SHAPES = ['sphere', 'knot', 'galaxy', 'pages', 'word'];

const VERT = /* glsl */ `
  attribute vec3 aA; attribute vec3 aB; attribute vec3 aC; attribute vec3 aD; attribute vec3 aE;
  attribute vec4 aRand;
  uniform float uTime, uProg, uPulseT, uSize, uPixel, uScroll;
  uniform int uFrom, uTo;
  uniform vec3 uPointer, uPulseO;
  uniform float uPointerOn;
  varying float vMix; varying float vGlow;

  vec3 pick(int i){ return i==0?aA : i==1?aB : i==2?aC : i==3?aD : aE; }
  float ease(float x){ return x*x*(3.0-2.0*x); }

  void main(){
    float stagger = aRand.x * 0.55;
    float t = ease(clamp((uProg - stagger) / 0.45, 0.0, 1.0));
    vec3 from = pick(uFrom); vec3 to = pick(uTo);
    vec3 p = mix(from, to, t);

    // On the way between shapes particles swirl outward instead of flying in straight lines.
    float travel = sin(t * 3.14159);
    vec3 swirl = normalize(vec3(aRand.y - 0.5, aRand.z - 0.5, aRand.w - 0.5) + 0.001);
    p += swirl * travel * (1.2 + aRand.w * 1.6);
    p.xy = mat2(cos(travel*1.4), -sin(travel*1.4), sin(travel*1.4), cos(travel*1.4)) * p.xy;

    // Breathing: low-cost flow field, different phase per particle.
    float ph = aRand.y * 6.2831;
    p += 0.07 * vec3(sin(p.y*2.7 + uTime*0.8 + ph), sin(p.z*2.7 + uTime*0.9 + ph), sin(p.x*2.7 + uTime*0.7 + ph));

    // Cursor repulsion with soft falloff.
    vec3 d = p - uPointer;
    float rep = exp(-dot(d, d) * 0.9) * uPointerOn;
    p += normalize(d + 0.0001) * rep * 0.95;

    // Click shockwave travelling outward through the shape.
    float r = uPulseT * 5.5;
    vec3 dp = p - uPulseO;
    float dl = length(dp);
    float wave = exp(-pow((dl - r) * 1.6, 2.0)) * exp(-uPulseT * 1.1);
    p += normalize(dp + 0.0001) * wave * 1.1;

    vMix = clamp(p.y * 0.22 + 0.5 + (aRand.z - 0.5) * 0.6, 0.0, 1.0);
    vGlow = wave + rep * 0.7 + travel * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.65 + 0.35 * sin(uTime * 2.0 + aRand.x * 40.0);
    gl_PointSize = uSize * uPixel * (0.55 + aRand.w * 0.9) * tw * (1.0 + vGlow * 1.6) * (6.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColA, uColB, uHot; uniform float uAlpha;
  varying float vMix; varying float vGlow;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 1.6);
    vec3 col = mix(uColA, uColB, vMix);
    col = mix(col, uHot, clamp(vGlow, 0.0, 1.0) * 0.8);
    gl_FragColor = vec4(col, a * uAlpha);
  }
`;

const rnd = (n) => Math.random() * n;
const fill = (N, fn) => { const a = new Float32Array(N * 3); for (let i = 0; i < N; i += 1) fn(i, a, i * 3); return a; };

function sphereShape(N) {
  const g = Math.PI * (3 - Math.sqrt(5));
  return fill(N, (i, a, o) => {
    const y = 1 - (i / (N - 1)) * 2; const r = Math.sqrt(1 - y * y); const th = g * i;
    const R = 2.15 + (Math.random() - 0.5) * 0.12;
    a[o] = Math.cos(th) * r * R; a[o + 1] = y * R; a[o + 2] = Math.sin(th) * r * R;
  });
}
function knotShape(N) {
  return fill(N, (i, a, o) => {
    const t = (i / N) * Math.PI * 2 * 1; const p = 2; const q = 3;
    const r = 1.1 + 0.45 * Math.cos(q * t);
    const cx = r * Math.cos(p * t) * 1.55; const cy = r * Math.sin(p * t) * 1.55; const cz = 0.95 * Math.sin(q * t);
    const ang = rnd(Math.PI * 2); const tube = 0.1 + rnd(0.2);
    a[o] = cx + Math.cos(ang) * tube; a[o + 1] = cy + Math.sin(ang) * tube; a[o + 2] = cz + (Math.random() - 0.5) * 0.35;
  });
}
function galaxyShape(N) {
  return fill(N, (i, a, o) => {
    const arm = i % 3; const dist = Math.pow(Math.random(), 0.7) * 3.3;
    const ang = (arm / 3) * Math.PI * 2 + dist * 1.15 + (Math.random() - 0.5) * 0.45;
    a[o] = Math.cos(ang) * dist; a[o + 2] = Math.sin(ang) * dist * 0.9;
    a[o + 1] = (Math.random() - 0.5) * 0.35 * (1.2 - dist / 4);
  });
}
function pagesShape(N) {
  const CARDS = 5;
  return fill(N, (i, a, o) => {
    const c = i % CARDS; const off = c - (CARDS - 1) / 2; const W = 1.5; const H = 2.05;
    let x; let y;
    if (Math.random() < 0.5) { // frame
      const side = Math.floor(rnd(4)); const u = Math.random();
      if (side === 0) { x = (u - 0.5) * W; y = H / 2; } else if (side === 1) { x = (u - 0.5) * W; y = -H / 2; }
      else if (side === 2) { x = -W / 2; y = (u - 0.5) * H; } else { x = W / 2; y = (u - 0.5) * H; }
    } else { // "text lines"
      const line = Math.floor(rnd(5)); y = 0.62 - line * 0.34; x = (Math.random() - 0.5) * (line === 4 ? 0.7 : 1.2) - (line === 4 ? 0.25 : 0);
    }
    const ry = -off * 0.28; const px = off * 0.95; const pz = -Math.abs(off) * 0.4;
    a[o] = px + x * Math.cos(ry); a[o + 1] = y + Math.sin(off * 1.3) * 0.15; a[o + 2] = pz + x * Math.sin(ry) * -1 + (Math.random() - 0.5) * 0.04;
  });
}
function wordShape(N, word) {
  const cv = document.createElement('canvas'); cv.width = 900; cv.height = 260;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let size = 190; ctx.font = `800 ${size}px system-ui, sans-serif`;
  while (ctx.measureText(word).width > 840 && size > 40) { size -= 10; ctx.font = `800 ${size}px system-ui, sans-serif`; }
  ctx.fillText(word, 450, 135);
  const px = ctx.getImageData(0, 0, 900, 260).data; const hits = [];
  for (let y = 0; y < 260; y += 2) for (let x = 0; x < 900; x += 2) if (px[(y * 900 + x) * 4 + 3] > 128) hits.push(x, y);
  const n = hits.length / 2;
  return fill(N, (i, a, o) => {
    if (!n) { a[o] = (Math.random() - 0.5) * 5; a[o + 1] = (Math.random() - 0.5); a[o + 2] = 0; return; }
    const k = Math.floor(rnd(n)) * 2;
    a[o] = (hits[k] - 450) / 900 * 6.4 + (Math.random() - 0.5) * 0.02;
    a[o + 1] = -(hits[k + 1] - 135) / 900 * 6.4;
    a[o + 2] = (Math.random() - 0.5) * 0.35;
  });
}

const cssVar = (name, fb) => { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; };
const luminance = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/**
 * variant "hero": fills its parent, click for a shockwave, auto-cycles shapes.
 * variant "page": fixed full-screen backdrop that morphs as the visitor scrolls.
 */
export default function ParticleField({ variant = 'hero', word = 'FORGE', colorA, colorB, background, intensity = 1 }) {
  const mountRef = useRef(null);
  const propsRef = useRef({});
  propsRef.current = { colorA, colorB, background };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const page = variant === 'page';
    let renderer;
    try { renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return undefined; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 760px)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const N = Math.round((small ? 16000 : 42000) * (page ? 0.6 : 1) * intensity);
    const geo = new BufferGeometry();
    const attrs = { aA: sphereShape(N), aB: knotShape(N), aC: galaxyShape(N), aD: pagesShape(N), aE: wordShape(N, String(word || 'FORGE').toUpperCase().slice(0, 12)) };
    Object.entries(attrs).forEach(([k, v]) => geo.setAttribute(k, new BufferAttribute(v, 3)));
    geo.setAttribute('position', new BufferAttribute(attrs.aA, 3));
    const rand = new Float32Array(N * 4); for (let i = 0; i < rand.length; i += 1) rand[i] = Math.random();
    geo.setAttribute('aRand', new BufferAttribute(rand, 4));
    geo.boundingSphere = null;

    const uni = {
      uTime: { value: 0 }, uProg: { value: 1 }, uPulseT: { value: 99 }, uSize: { value: page ? 2.1 : 2.6 }, uPixel: { value: dpr }, uScroll: { value: 0 },
      uFrom: { value: 0 }, uTo: { value: 0 }, uPointer: { value: new Vector3(99, 99, 99) }, uPulseO: { value: new Vector3() }, uPointerOn: { value: 0 },
      uColA: { value: new Color('#e9b6da') }, uColB: { value: new Color('#ff6a2b') }, uHot: { value: new Color('#ffffff') }, uAlpha: { value: page ? 0.5 : 0.95 },
    };
    const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni, transparent: true, depthWrite: false, blending: AdditiveBlending });
    const points = new Points(geo, mat);
    points.frustumCulled = false;
    const scene = new Scene(); scene.add(points);
    const camera = new PerspectiveCamera(42, 1, 0.1, 60); camera.position.set(0, 0, page ? 9 : 8);

    const applyColors = () => {
      const p = propsRef.current;
      const a = new Color(p.colorA || cssVar('--primary', '#e9b6da'));
      const b = new Color(p.colorB || cssVar('--cta', '#ff6a2b'));
      const bg = new Color(p.background || cssVar('--bg', '#2b1338'));
      const light = luminance(bg) > 0.55; // additive glow vanishes on light backgrounds
      mat.blending = light ? NormalBlending : AdditiveBlending;
      if (light) { a.multiplyScalar(0.55); b.multiplyScalar(0.7); }
      uni.uColA.value.copy(a); uni.uColB.value.copy(b);
      uni.uHot.value.set(light ? '#000000' : '#ffffff');
      mat.needsUpdate = true;
    };
    applyColors();
    const themeObs = new MutationObserver(applyColors);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const state = { from: 0, to: 0, prog: 1, auto: 0, tx: 0, ty: 0, rx: 0, ry: 0, t: 0, pulse: 99, pointerOn: 0, ndc: [0, 0] };
    const goto = (idx) => { state.from = state.to; state.to = idx; state.prog = 0; };
    const next = () => goto((state.to + 1) % SHAPES.length);

    const rectOf = () => (page ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } : mount.getBoundingClientRect());
    const onMove = (e) => {
      const r = rectOf();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1; const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      state.ndc = [nx, ny];
      const inside = page || (nx >= -1 && nx <= 1 && ny >= -1 && ny <= 1);
      state.pointerOn = inside ? 1 : 0;
      state.tx = Math.max(-1, Math.min(1, nx)); state.ty = Math.max(-1, Math.min(1, ny));
    };
    const onLeave = () => { state.pointerOn = 0; };
    const onClick = (e) => {
      if (page) return;
      const r = mount.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      onMove(e); next(); state.pulse = 0; state.auto = 0;
      uni.uPulseO.value.copy(localPointer());
    };
    const tmp = new Vector3();
    const localPointer = () => {
      tmp.set(state.ndc[0], state.ndc[1], 0.5).unproject(camera).sub(camera.position).normalize();
      const k = -camera.position.z / tmp.z;
      const w = new Vector3().copy(camera.position).addScaledVector(tmp, k);
      return points.worldToLocal(w);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onClick, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = page ? window.innerWidth : mount.clientWidth || 300; const h = page ? window.innerHeight : mount.clientHeight || 300;
      renderer.setSize(w, h); camera.aspect = w / h;
      camera.position.z = page ? (w / h < 1 ? 11 : 9) : (w / h < 1.1 ? 11 : 8);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(page ? document.documentElement : mount);

    let visible = true; let raf = 0; let last = performance.now(); let slow = 0; let frames = 0; let reduced = false;
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      // Adaptive quality: if the first second runs slowly, halve the particle count once.
      frames += 1; if (frames > 10 && frames <= 70) slow += dt > 0.032 ? 1 : 0;
      if (frames === 70 && slow > 35 && !reduced) { reduced = true; geo.setDrawRange(0, Math.floor(N * 0.5)); }
      state.t += dt;
      if (page) {
        const doc = document.documentElement; const max = Math.max(1, doc.scrollHeight - window.innerHeight);
        const f = Math.min(1, Math.max(0, window.scrollY / max)) * (SHAPES.length - 1);
        const i = Math.min(SHAPES.length - 2, Math.floor(f)); const frac = f - i;
        uni.uFrom.value = i; uni.uTo.value = i + 1;
        state.prog += ((frac * 1.0) - state.prog) * 0.08; uni.uProg.value = Math.min(1.0, state.prog * 1.0);
      } else {
        state.auto += dt; if (state.auto > 6.5) { state.auto = 0; next(); }
        state.prog = Math.min(1, state.prog + dt / 2.1);
        uni.uFrom.value = state.from; uni.uTo.value = state.to; uni.uProg.value = state.prog;
      }
      state.pulse += dt; uni.uPulseT.value = state.pulse;
      uni.uTime.value = state.t;
      state.rx += (state.ty * -0.3 - state.rx) * 0.05; state.ry += (state.tx * 0.5 - state.ry) * 0.05;
      points.rotation.y = state.ry + state.t * (page ? 0.04 : 0.09); points.rotation.x = state.rx;
      uni.uPointerOn.value += (state.pointerOn * (coarse ? 0 : 1) - uni.uPointerOn.value) * 0.12;
      if (uni.uPointerOn.value > 0.01) uni.uPointer.value.copy(localPointer());
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reduce) { uni.uProg.value = 1; renderer.render(scene, camera); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }, { threshold: 0.01 });
    io.observe(mount);
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis);
    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); themeObs.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onClick);
      document.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', onVis);
      geo.dispose(); mat.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [variant, word, intensity]);

  return <div className={variant === 'page' ? 'pf-backdrop' : 'hero3d'} ref={mountRef} />;
}
