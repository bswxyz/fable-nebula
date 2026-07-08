/* NEBULA DRIFT — a rotating point-cloud galaxy (three.js) + motion layer */
import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('sky');

/* ---------------- galaxy ---------------- */
function initSky() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { canvas.classList.add('fallback'); return; }
  if (!renderer.getContext()) { canvas.classList.add('fallback'); return; }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x05060a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.09);
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 3.2, 7.2);
  camera.lookAt(0, -0.3, 0);

  // galaxy
  const COUNT = innerWidth < 720 ? 34000 : 95000;
  const R = 9, BRANCHES = 4, SPIN = 0.9, RND = 0.42, POW = 2.6;
  const inside = new THREE.Color('#ffd9a0'), outside = new THREE.Color('#5a6cff');
  const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const radius = Math.pow(Math.random(), 1.4) * R;
    const branch = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
    const spin = radius * SPIN;
    const rx = Math.pow(Math.random(), POW) * (Math.random() < .5 ? 1 : -1) * RND * radius;
    const ry = Math.pow(Math.random(), POW) * (Math.random() < .5 ? 1 : -1) * RND * radius * 0.4;
    const rz = Math.pow(Math.random(), POW) * (Math.random() < .5 ? 1 : -1) * RND * radius;
    pos[i3]     = Math.cos(branch + spin) * radius + rx;
    pos[i3 + 1] = ry;
    pos[i3 + 2] = Math.sin(branch + spin) * radius + rz;
    const c = inside.clone().lerp(outside, radius / R);
    col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.035, sizeAttenuation: true, depthWrite: false,
    blending: THREE.AdditiveBlending, vertexColors: true, transparent: true, opacity: 0.9
  });
  const galaxy = new THREE.Points(geo, mat);
  galaxy.rotation.x = 0.12;
  scene.add(galaxy);

  // distant starfield
  const SCOUNT = 1400;
  const sp = new Float32Array(SCOUNT * 3);
  for (let i = 0; i < SCOUNT; i++) {
    const i3 = i * 3, r = 22 + Math.random() * 30;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    sp[i3] = r * Math.sin(p) * Math.cos(t); sp[i3 + 1] = r * Math.cos(p); sp[i3 + 2] = r * Math.sin(p) * Math.sin(t);
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ size: 0.06, color: 0xbfd0ff, sizeAttenuation: true, depthWrite: false, transparent: true, opacity: 0.7 }));
  scene.add(stars);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduce) addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / innerWidth - 0.5); mouse.ty = (e.clientY / innerHeight - 0.5);
  }, { passive: true });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    if (!reduce) {
      galaxy.rotation.y = t * 0.045;
      stars.rotation.y = t * 0.01;
      mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
      camera.position.x = mouse.x * 2.2;
      camera.position.y = 3.2 - mouse.y * 1.4;
      camera.lookAt(0, -0.3, 0);
    }
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) { galaxy.rotation.y = 0.6; renderer.render(scene, camera); }
  else requestAnimationFrame(frame);
}
try { initSky(); } catch (e) { canvas.classList.add('fallback'); }

/* ---------------- motion layer ---------------- */
const hero = document.querySelector('.hero');
requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('loaded')));
setTimeout(() => hero.classList.add('loaded'), 400);

const revealAll = () => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
window.addEventListener('load', () => {
  if (!window.gsap) { revealAll(); return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.reveal:not(.hero .reveal)').forEach(el =>
    ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in') }));
});
setTimeout(() => { if (!window.gsap) revealAll(); }, 2500);
