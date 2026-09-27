import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Procedural over-ear headphones with an "explode" parameter for the anatomy view.
export function createScene(canvas, initial) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.z = 12;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(3, 5, 6);
  const rim = new THREE.DirectionalLight('#ffd9c9', 1.6);
  rim.position.set(-5, 1, -4);
  scene.add(key, rim);

  // Materials (colours tween per colourway)
  const shell = new THREE.MeshPhysicalMaterial({ color: initial.shell, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const metal = new THREE.MeshStandardMaterial({ color: initial.metal, metalness: 1, roughness: 0.28 });
  const cushion = new THREE.MeshPhysicalMaterial({ color: initial.cushion, roughness: 0.85, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#555') });
  const accent = new THREE.MeshStandardMaterial({ color: '#ff4f1f', roughness: 0.35, emissive: '#ff4f1f', emissiveIntensity: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.6 });
  const mesh = new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.7, metalness: 0.4, wireframe: true });

  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);
  scene.add(root);

  // Headband
  const arc = (rx, ry, cy) => new THREE.CatmullRomCurve3(
    Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * Math.PI;
      return new THREE.Vector3(Math.cos(a) * rx, cy + Math.sin(a) * ry, 0);
    }),
  );
  const band = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TubeGeometry(arc(1.34, 1.6, 0.25), 120, 0.1, 24), shell);
  outer.scale.z = 2.2;
  const inner = new THREE.Mesh(new THREE.TubeGeometry(arc(1.2, 1.44, 0.25), 120, 0.075, 20), cushion);
  inner.scale.z = 2.6;
  band.add(outer, inner);
  model.add(band);

  // Speaker cone profile for the driver
  const coneProfile = [[0.02, 0], [0.12, 0.02], [0.3, 0.08], [0.42, 0.16], [0.46, 0.2], [0.5, 0.2], [0.5, 0.17]].map(([x, y]) => new THREE.Vector2(x, y));
  const cupProfile = [[0, -0.22], [0.54, -0.22], [0.63, -0.18], [0.68, -0.06], [0.68, 0.12], [0.63, 0.2], [0.5, 0.25], [0, 0.26]].map(([x, y]) => new THREE.Vector2(x, y));

  function side(sign) {
    const g = new THREE.Group();
    g.position.set(1.34 * sign, -0.75, 0);
    const parts = {};

    parts.slider = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 16), metal);
    parts.slider.position.set(0, 0.95, 0);

    parts.yoke = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.045, 16, 64, Math.PI), metal);
    parts.yoke.rotation.y = Math.PI / 2;

    // Cup group (faces along x): shell, outer plate, accent ring
    parts.cup = new THREE.Group();
    const cupShell = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 64), shell);
    cupShell.rotation.z = -sign * Math.PI / 2;
    parts.cup.add(cupShell);

    parts.plate = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.05, 64), metal);
    disc.rotation.z = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 12, 64), accent);
    ring.rotation.y = Math.PI / 2;
    parts.plate.add(disc, ring);
    parts.plate.position.x = 0.28 * sign;

    // Driver (hidden inside the cup until exploded)
    parts.driver = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.LatheGeometry(coneProfile, 64), dark);
    cone.rotation.z = sign * Math.PI / 2;
    const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 32), metal);
    magnet.rotation.z = Math.PI / 2;
    magnet.position.x = 0.1 * sign;
    const grille = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mesh);
    grille.rotation.y = -sign * Math.PI / 2;
    grille.position.x = -0.2 * sign;
    const dustcap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), accent);
    dustcap.rotation.z = sign * Math.PI / 2;
    dustcap.position.x = -0.01 * sign;
    parts.driver.add(cone, magnet, grille, dustcap);

    parts.cushion = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.17, 24, 72), cushion);
    parts.cushion.rotation.y = Math.PI / 2;
    parts.cushion.position.x = -0.3 * sign;

    g.add(parts.slider, parts.yoke, parts.cup, parts.plate, parts.driver, parts.cushion);
    model.add(g);
    return { g, parts, sign };
  }
  const sides = [side(-1), side(1)];

  // Contact shadow
  const shTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(0,0,0,.35)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.3), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.1;
  root.add(shadow);

  // Sound-wave pulses behind the model
  const waves = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.006, 8, 160), new THREE.MeshBasicMaterial({ color: '#ff4f1f', transparent: true }));
    m.position.z = -1.5;
    root.add(m);
    return m;
  });

  // ---------- Runtime ----------
  const pose = { x: 0, y: 0, rotX: 0.1, rotY: -0.5, scale: 1, opacity: 1, explode: 0, waves: 1 };
  const cur = { ...pose };
  const intro = { v: 0 };
  const extra = { spin: 0 };
  const mouse = { x: 0, y: 0 }, mouseL = { x: 0, y: 0 };
  let halfW = 1, halfH = 1, baseScale = 1, lastO = -1;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(14)) * camera.position.z;
    halfW = halfH * camera.aspect;
    baseScale = camera.aspect < 0.8 ? 0.55 : camera.aspect < 1.2 ? 0.78 : 1;
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  });

  function update(t, dt) {
    const k = 1 - Math.pow(0.002, dt);
    for (const key in pose) cur[key] += (pose[key] - cur[key]) * k;
    mouseL.x += (mouse.x - mouseL.x) * k * 0.5;
    mouseL.y += (mouse.y - mouseL.y) * k * 0.5;
    const iv = intro.v, e = cur.explode;

    root.position.set(cur.x * halfW, cur.y * halfH - (1 - iv) * 1.5, 0);
    root.scale.setScalar(cur.scale * baseScale * (0.6 + 0.4 * iv));
    model.rotation.set(cur.rotX + mouseL.y * 0.15 + Math.sin(t * 0.7) * 0.03, cur.rotY + mouseL.x * 0.35 + (1 - iv) * 2.4 + Math.sin(t * 0.4) * 0.08 + extra.spin, 0);
    model.position.y = Math.sin(t * 0.9) * 0.06;

    band.position.y = e * 0.7;
    for (const { g, parts, sign } of sides) {
      g.position.x = 1.34 * sign + e * 0.55 * sign;
      parts.slider.position.y = 0.95 + e * 0.35;
      parts.yoke.position.x = e * 0.3 * sign;
      parts.cup.position.x = e * 0.75 * sign;
      parts.plate.position.x = 0.28 * sign + e * 1.5 * sign;
      parts.driver.position.x = -e * 0.55 * sign;
      parts.driver.rotation.x = e * t * 0.4;
      parts.cushion.position.x = -0.3 * sign - e * 1.2 * sign;
    }
    shadow.material.opacity = (1 - e) * iv;

    waves.forEach((w, i) => {
      const p = (t * 0.25 + i / waves.length) % 1;
      w.scale.setScalar(0.6 + p * 1.1);
      w.material.opacity = (1 - p) * 0.55 * cur.waves * iv;
      w.visible = cur.waves > 0.01;
    });

    const o = Math.max(0, Math.min(1, cur.opacity));
    if (Math.abs(o - lastO) > 0.002) { canvas.style.opacity = o.toFixed(3); lastO = o; }
    if (o > 0.004) renderer.render(scene, camera);
  }

  function setColorway(cw, duration = 1) {
    const to = (mat, hex) => {
      const c = new THREE.Color(hex);
      gsap.to(mat.color, { r: c.r, g: c.g, b: c.b, duration, ease: 'power2.inOut' });
    };
    to(shell, cw.shell);
    to(metal, cw.metal);
    to(cushion, cw.cushion);
  }

  return { pose, intro, extra, update, setColorway };
}
