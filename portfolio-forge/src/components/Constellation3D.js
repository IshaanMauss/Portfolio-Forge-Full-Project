import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, SphereGeometry, MeshBasicMaterial, LineSegments,
  BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Color, Raycaster, Vector2, Vector3,
} from 'three';
import { buildGraph } from '../utils/constellation';
import { safeUrl, safeColor } from '../utils/escape';
import './Constellation.css';

// Interactive 3D map of the portfolio. The normal HTML portfolio stays underneath (SEO, a11y, PDF).
function Constellation3D({ data }) {
  const mountRef = useRef(null);
  const labelRefs = useRef([]);
  const [selected, setSelected] = useState(null);
  const [ok, setOk] = useState(true);
  const graph = useMemo(() => buildGraph(data), [data]);
  const theme = data?.theme || {};
  const bg = safeColor(theme.backgroundColor, '#2b1338');
  const fg = safeColor(theme.textColor, '#f6ecf5');
  const accent = safeColor(theme.accentColor, '#e9b6da');
  const api = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { setOk(false); return undefined; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 760px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0.6, 9.5);
    const root = new Group();
    scene.add(root);

    const cAccent = new Color(accent); const cFg = new Color(fg);
    const geo = new SphereGeometry(1, small ? 14 : 20, small ? 10 : 14);
    const meshes = graph.nodes.map((n) => {
      const mat = new MeshBasicMaterial({ color: n.type === 'skill' ? cFg : cAccent, transparent: true, opacity: n.type === 'skill' ? 0.85 : 1 });
      const m = new Mesh(geo, mat);
      m.position.set(...n.pos); m.scale.setScalar(n.size);
      m.userData.index = graph.nodes.indexOf(n);
      root.add(m);
      return m;
    });
    const pts = [];
    graph.edges.forEach(([a, b]) => pts.push(...graph.nodes[a].pos, ...graph.nodes[b].pos));
    const lg = new BufferGeometry();
    lg.setAttribute('position', new Float32BufferAttribute(pts, 3));
    const lm = new LineBasicMaterial({ color: cFg, transparent: true, opacity: 0.28 });
    root.add(new LineSegments(lg, lm));

    let rotY = 0.4; let rotX = 0.15; let vel = 0; let drag = null; let hover = false; let visible = true; let raf = 0; let dirty = true;
    const ray = new Raycaster(); const mouse = new Vector2(); const v = new Vector3();

    const resize = () => {
      const w = mount.clientWidth || 300; const h = mount.clientHeight || 300;
      renderer.setSize(w, h); camera.aspect = w / h; camera.position.z = w / h < 1 ? 12.5 : 9.5; camera.updateProjectionMatrix(); dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(mount);

    const positionLabels = () => {
      const w = mount.clientWidth; const h = mount.clientHeight;
      graph.nodes.forEach((n, i) => {
        const el = labelRefs.current[i]; if (!el) return;
        v.set(...n.pos).applyMatrix4(root.matrixWorld).project(camera);
        el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, 10px)`;
        el.style.opacity = String(Math.max(0.25, Math.min(1, 1.2 - v.z * 0.9)));
      });
    };
    const draw = () => { root.rotation.set(rotX, rotY, 0); root.updateMatrixWorld(); renderer.render(scene, camera); positionLabels(); dirty = false; };
    const frame = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (!drag && !hover && !reduce) { rotY += 0.0022 + vel; vel *= 0.95; dirty = true; }
      if (dirty) draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const el = renderer.domElement;
    const down = (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; el.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      rotY += dx * 0.008; rotX = Math.max(-0.6, Math.min(0.6, rotX + dy * 0.004)); vel = dx * 0.0004; dirty = true;
    };
    const up = (e) => {
      const wasTap = drag && drag.moved < 6; drag = null;
      if (!wasTap) return;
      const r = el.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects(meshes, false)[0];
      setSelected(hit ? hit.object.userData.index : null);
    };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', () => { drag = null; });
    const enter = () => { hover = true; }; const leave = () => { hover = false; };
    mount.addEventListener('pointerenter', enter); mount.addEventListener('pointerleave', leave);

    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { dirty = true; start(); } }, { threshold: 0.05 });
    io.observe(mount);
    const onVis = () => { if (!document.hidden) { dirty = true; start(); } };
    document.addEventListener('visibilitychange', onVis);
    start();

    // PNG poster (1200x627, LinkedIn link-preview ratio) composed from the live scene.
    api.current.poster = () => {
      const W = 1200; const H = 627;
      const prevW = mount.clientWidth; const prevH = mount.clientHeight; const prevPR = renderer.getPixelRatio();
      renderer.setPixelRatio(1); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
      root.rotation.set(0.15, 0.4, 0); root.updateMatrixWorld(); renderer.render(scene, camera);
      const out = document.createElement('canvas'); out.width = W; out.height = H;
      const c = out.getContext('2d');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.drawImage(renderer.domElement, 0, 0, W, H);
      c.fillStyle = fg; c.font = '700 54px system-ui, sans-serif'; c.fillText(data?.userName || 'Portfolio', 56, 96);
      c.globalAlpha = 0.75; c.font = '400 28px system-ui, sans-serif'; c.fillText(data?.userSubtitle || '', 56, 142);
      c.globalAlpha = 0.5; c.font = '400 22px system-ui, sans-serif'; c.fillText('Made with Portfolio Forge', 56, H - 40); c.globalAlpha = 1;
      renderer.setPixelRatio(prevPR); renderer.setSize(prevW, prevH, false); resize(); dirty = true;
      return out;
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
      mount.removeEventListener('pointerenter', enter); mount.removeEventListener('pointerleave', leave);
      geo.dispose(); lg.dispose(); lm.dispose(); meshes.forEach((m) => m.material.dispose());
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [graph, bg, fg, accent, data]);

  if (!ok || graph.nodes.length < 2) return null;
  const sel = selected !== null ? graph.nodes[selected] : null;

  const download = () => {
    const c = api.current.poster?.(); if (!c) return;
    c.toBlob((b) => { const url = URL.createObjectURL(b); const a = document.createElement('a'); a.href = url; a.download = 'portfolio-constellation.png'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000); });
  };

  return (
    <section className="constellation" aria-label="Interactive map of projects and skills" style={{ '--c-accent': accent, '--c-fg': fg, '--c-bg': bg }}>
      <div className="constellation-stage" ref={mountRef}>
        {graph.nodes.map((n, i) => (
          <span key={n.id} ref={(el) => { labelRefs.current[i] = el; }} className={`c-label ${n.type}`}>{n.label}</span>
        ))}
      </div>
      <p className="constellation-hint">Drag to rotate · tap a node to see what it proves</p>
      {sel && (
        <div className="constellation-info" role="status">
          <strong>{sel.info.title}</strong>
          {sel.info.keywords && <span className="c-kw">{sel.info.keywords}</span>}
          <p>{sel.info.text}</p>
          {(sel.info.links || []).map(([label, url]) => safeUrl(url) && <a key={label} href={safeUrl(url)} target="_blank" rel="noopener noreferrer">{label}</a>)}
        </div>
      )}
      <button type="button" className="c-download" onClick={download}>Download as image</button>
    </section>
  );
}

export default Constellation3D;
