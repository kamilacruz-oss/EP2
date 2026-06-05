import { Robot }              from './robot.js';
import { generarTrayectoria } from './trayectoria.js';

//Escena ──────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.FogExp2(0xffffff, 0.03);

//Cámara ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(14, 10, 14);
camera.lookAt(0, 4, 0);

//Renderer ─────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

//Luces ────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x223344, 1.2));
const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.0);
dirLight.position.set(10, 16, 10);
dirLight.castShadow = true;
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0xff6b35, 0.4);
fillLight.position.set(-10, 4, -8);
scene.add(fillLight);
const pointLight = new THREE.PointLight(0x00e5ff, 0.8, 30);
pointLight.position.set(0, 8, 0);
scene.add(pointLight);

//Grid y ejes ──────────────────────────────────────────────────────────────
scene.add(new THREE.GridHelper(30, 30, 0x1e2530, 0x141820));

function crearEje(color, rotacion) {
  const geo = new THREE.CylinderGeometry(0.05, 0.05, 16, 8);
  geo.translate(0, 3, 0);
  const eje = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
  eje.rotation.copy(rotacion);
  scene.add(eje);
}
crearEje(0xff4757, new THREE.Euler(0, 0, -Math.PI/2)); // X rojo
crearEje(0x1e90ff, new THREE.Euler(Math.PI/2, 0, 0));  // Y azul
crearEje(0x2ed573, new THREE.Euler(0, 0, 0));           // Z verde

//Robot ────────────────────────────────────────────────────────────────────
const robot = new Robot(scene);

//OrbitControls manual ─────────────────────────────────────────────────────
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let spherical = { theta: Math.PI / 4, phi: Math.PI / 3.5, radius: 22 };
const target = new THREE.Vector3(0, 4, 0);

function updateCamera() {
  camera.position.set(
    target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
    target.y + spherical.radius * Math.cos(spherical.phi),
    target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
  );
  camera.lookAt(target);
}
updateCamera();

renderer.domElement.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  spherical.theta -= (e.clientX - prevMouse.x) * 0.006;
  spherical.phi = Math.max(0.1, Math.min(Math.PI / 2, spherical.phi + (e.clientY - prevMouse.y) * 0.006));
  prevMouse = { x: e.clientX, y: e.clientY };
  updateCamera();
});
renderer.domElement.addEventListener('wheel', e => {
  spherical.radius = Math.max(6, Math.min(50, spherical.radius + e.deltaY * 0.02));
  updateCamera();
}, { passive: true });
let lastTouch = null;
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 1) lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
renderer.domElement.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && lastTouch) {
    spherical.theta -= (e.touches[0].clientX - lastTouch.x) * 0.007;
    spherical.phi = Math.max(0.1, Math.min(Math.PI / 2, spherical.phi + (e.touches[0].clientY - lastTouch.y) * 0.007));
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    updateCamera();
  }
});

//UI panel izquierdo ───────────────────────────────────────────────────────
const inputQ1 = document.getElementById('q1');
const inputQ2 = document.getElementById('q2');
const inputQ3 = document.getElementById('q3');
const spanX   = document.getElementById('ex');
const spanY   = document.getElementById('ey');
const spanZ   = document.getElementById('ez');
const warnBox = document.getElementById('warn-box');

const modalOverlay = document.getElementById('modal-overlay');
const modalBody    = document.getElementById('modal-body');
document.getElementById('modal-close').addEventListener('click', () => modalOverlay.classList.add('hidden'));

function mostrarModal(mensaje) { modalBody.innerHTML = mensaje; modalOverlay.classList.remove('hidden'); }

const RANGOS = {
  q1: { min: -45,  max: 225, nombre: 'q₁', unidad: '°' },
  q2: { min:   0,  max: 125, nombre: 'q₂', unidad: '°' },
  q3: { min:   0,  max:  30, nombre: 'q₃', unidad: ' cm' },
};

function validar(v1, v2, v3) {
  const errores = [];
  if (v1 < RANGOS.q1.min || v1 > RANGOS.q1.max)
    errores.push(`${RANGOS.q1.nombre} = ${v1}° &nbsp;→&nbsp; debe estar en [${RANGOS.q1.min}°, ${RANGOS.q1.max}°]`);
  if (v2 < RANGOS.q2.min || v2 > RANGOS.q2.max)
    errores.push(`${RANGOS.q2.nombre} = ${v2}° &nbsp;→&nbsp; debe estar en [${RANGOS.q2.min}°, ${RANGOS.q2.max}°]`);
  if (v3 < RANGOS.q3.min || v3 > RANGOS.q3.max)
    errores.push(`${RANGOS.q3.nombre} = ${v3} cm &nbsp;→&nbsp; debe estar en [${RANGOS.q3.min}, ${RANGOS.q3.max}] cm`);
  return errores;
}

function marcarError(input, hayError) { input.classList.toggle('error', hayError); }

function actualizar() {
  const v1 = parseFloat(inputQ1.value);
  const v2 = parseFloat(inputQ2.value);
  const v3 = parseFloat(inputQ3.value);
  if (isNaN(v1) || isNaN(v2) || isNaN(v3)) return;

  const errores = validar(v1, v2, v3);
  marcarError(inputQ1, v1 < RANGOS.q1.min || v1 > RANGOS.q1.max);
  marcarError(inputQ2, v2 < RANGOS.q2.min || v2 > RANGOS.q2.max);
  marcarError(inputQ3, v3 < RANGOS.q3.min || v3 > RANGOS.q3.max);
  warnBox.classList.toggle('hidden', errores.length === 0);

  if (errores.length > 0) { mostrarModal(errores.join('<br>')); return; }

  robot.actualizar(v1, v2, v3);
  const pos = robot.getEfectorFinal(v1, v2, v3);
  spanX.textContent = pos.x.toFixed(2);
  spanY.textContent = pos.y.toFixed(2);
  spanZ.textContent = pos.z.toFixed(2);
}

inputQ1.addEventListener('change', actualizar);
inputQ2.addEventListener('change', actualizar);
inputQ3.addEventListener('change', actualizar);

//Estado inicial q1=0, q2=0, q3=20 cm ─────────────────────────────────────
actualizar();

//UI panel derecho: Trayectoria ────────────────────────────────────────────
const btnGenerar = document.getElementById('btn-generar');
const btnAnimar  = document.getElementById('btn-animar');
const trajStatus = document.getElementById('traj-status');

// Posición inicial del efector según estado inicial
let posIni = robot.getEfectorFinal(0, 0, 20); // {x, y(=pz), z(=py)}

let trayData   = null;
let animFrame  = 0;
let animando   = false;
let animHandle = null;

function dentroDeRango(q) {
  return q.q1 >= RANGOS.q1.min && q.q1 <= RANGOS.q1.max
      && q.q2 >= RANGOS.q2.min && q.q2 <= RANGOS.q2.max
      && q.q3 >= RANGOS.q3.min && q.q3 <= RANGOS.q3.max;
}

/**
 * Convención de ejes:
 *   Panel UI:            xf, yf, zf
 *   getEfectorFinal:     { x:px,  y:pz,  z:py }
 *   cinematicaInversa:   ( px,    py,    pz   )
 *
 * Por tanto: cinInv(xf_ui, yf_ui, zf_ui) = cinInv(px, pz_real, py_real)
 * que en términos de la función es cinInv(xf, yf, zf) directamente,
 * porque el panel ya usa la misma convención que getEfectorFinal.
 */
btnGenerar.addEventListener('click', () => {
  const xf = parseFloat(document.getElementById('xf').value);
  const yf = parseFloat(document.getElementById('yf').value);
  const zf = parseFloat(document.getElementById('zf').value);

  if (isNaN(xf) || isNaN(yf) || isNaN(zf)) {
    trajStatus.textContent = '⚠ Ingresa valores numéricos válidos.';
    trajStatus.className = 'traj-error'; return;
  }

  // cinematicaInversa recibe (px, py_real, pz_real)
  // getEfectorFinal devuelve {x:px, y:pz_real, z:py_real}
  // → los valores del panel corresponden a (xf=px, yf=pz_real, zf=py_real)
  // → cinInv recibe (xf, zf, yf)
  const qFinal = robot.cinematicaInversa(xf, zf, yf);

  if (!dentroDeRango(qFinal)) {
    const msgs = [];
    if (qFinal.q1 < RANGOS.q1.min || qFinal.q1 > RANGOS.q1.max)
      msgs.push(`q₁=${qFinal.q1.toFixed(1)}° fuera de [${RANGOS.q1.min}°, ${RANGOS.q1.max}°]`);
    if (qFinal.q2 < RANGOS.q2.min || qFinal.q2 > RANGOS.q2.max)
      msgs.push(`q₂=${qFinal.q2.toFixed(1)}° fuera de [${RANGOS.q2.min}°, ${RANGOS.q2.max}°]`);
    if (qFinal.q3 < RANGOS.q3.min || qFinal.q3 > RANGOS.q3.max)
      msgs.push(`q₃=${qFinal.q3.toFixed(1)} cm fuera de [${RANGOS.q3.min}, ${RANGOS.q3.max}] cm`);
    trajStatus.innerHTML = '⚠ Fuera del espacio de trabajo:<br>' + msgs.join('<br>');
    trajStatus.className = 'traj-error'; return;
  }

  // posIni viene de getEfectorFinal → misma convención {x, y(=pz), z(=py)}
  const xi = posIni.x, yi = posIni.y, zi = posIni.z;

  // Generar trayectorias cartesianas (misma convención UI)
  const tray = generarTrayectoria(xi, yi, zi, xf, yf, zf, 0, 10, 0.01);

  // Cinemática inversa en cada punto: cinInv(px, py_real, pz_real) = cinInv(x, z, y)
  const q1arr = [], q2arr = [], q3arr = [];
  for (let i = 0; i < tray.t.length; i++) {
    const q = robot.cinematicaInversa(tray.x[i], tray.z[i], tray.y[i]);
    q1arr.push(q.q1); q2arr.push(q.q2); q3arr.push(q.q3);
  }
  trayData = { ...tray, q1: q1arr, q2: q2arr, q3: q3arr };

  trajStatus.textContent = '✓ Trayectoria generada. Presiona Animar.';
  trajStatus.className = 'traj-ok';
  btnAnimar.disabled = false;

  dibujarGraficas(tray.t, tray.x, tray.y, tray.z, q1arr, q2arr, q3arr);
});

btnAnimar.addEventListener('click', () => {
  if (!trayData) return;
  if (animando) {
    cancelAnimationFrame(animHandle);
    animando = false;
    btnAnimar.textContent = '▶ Animar';
    return;
  }
  animando = true; animFrame = 0;
  btnAnimar.textContent = '⏹ Detener';
  correrAnimacion();
});

function correrAnimacion() {
  if (!animando || animFrame >= trayData.t.length) {
    animando = false;
    btnAnimar.textContent = '▶ Animar';
    const last = trayData.t.length - 1;
    posIni = { x: trayData.x[last], y: trayData.y[last], z: trayData.z[last] };
    return;
  }
  const q1v = trayData.q1[animFrame];
  const q2v = trayData.q2[animFrame];
  const q3v = trayData.q3[animFrame];

  robot.actualizar(q1v, q2v, q3v);

  inputQ1.value = q1v.toFixed(1);
  inputQ2.value = q2v.toFixed(1);
  inputQ3.value = q3v.toFixed(1);
  spanX.textContent = trayData.x[animFrame].toFixed(2);
  spanY.textContent = trayData.y[animFrame].toFixed(2);
  spanZ.textContent = trayData.z[animFrame].toFixed(2);

  actualizarIndicador(animFrame);
  animFrame += 5;
  animHandle = requestAnimationFrame(correrAnimacion);
}

//Gráficas con Canvas 2D ───────────────────────────────────────────────────
// Colores adaptados al tema blanco del proyecto
const GRAFICAS = [
  { id: 'graf-x',  label: 'xd(t) [cm]',  color: '#cc0011' },
  { id: 'graf-y',  label: 'yd(t) [cm]',  color: '#0c1ee9' },
  { id: 'graf-z',  label: 'zd(t) [cm]',  color: '#1a7a3a' },
  { id: 'graf-q1', label: 'q₁d(t) [°]', color: '#8800a3' },
  { id: 'graf-q2', label: 'q₂d(t) [°]', color: '#f4551b' },
  { id: 'graf-q3', label: 'q₃d(t) [cm]', color: '#454e5c' },
];

let indicadores = {};

function dibujarGraficas(t, x, y, z, q1, q2, q3) {
  const datasets = [x, y, z, q1, q2, q3];

  GRAFICAS.forEach((g, i) => {
    const canvas = document.getElementById(g.id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 16, right: 12, bottom: 22, left: 40 };
    const iW = W - pad.left - pad.right;
    const iH = H - pad.top  - pad.bottom;

    const data = datasets[i];
    const minV = Math.min(...data);
    const maxV = Math.max(...data);
    const rangeV = maxV - minV || 1;

    function draw(mt) {
      ctx.clearRect(0, 0, W, H);
      // Fondo blanco como el tema
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(0, 0, W, H);

      // Líneas de referencia
      ctx.strokeStyle = '#c0c4d0'; ctx.lineWidth = 0.5;
      for (let k = 0; k <= 4; k++) {
        const gy = pad.top + (k / 4) * iH;
        ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + iW, gy); ctx.stroke();
        const val = maxV - (k / 4) * rangeV;
        ctx.fillStyle = '#4a5568'; ctx.font = '8px Ubuntu'; ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), pad.left - 3, gy + 3);
      }

      // Línea de datos
      ctx.beginPath(); ctx.strokeStyle = g.color; ctx.lineWidth = 1.8;
      data.forEach((v, j) => {
        const px = pad.left + (t[j] / 10) * iW;
        const py = pad.top  + (1 - (v - minV) / rangeV) * iH;
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Ejes
      ctx.strokeStyle = '#454e5c'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + iH);
      ctx.lineTo(pad.left + iW, pad.top + iH); ctx.stroke();

      // Etiquetas eje X
      ctx.fillStyle = '#4a5568'; ctx.font = '8px Ubuntu'; ctx.textAlign = 'center';
      [0, 5, 10].forEach(tv => {
        ctx.fillText(tv + 's', pad.left + (tv / 10) * iW, pad.top + iH + 13);
      });

      // Título
      ctx.fillStyle = g.color; ctx.font = 'bold 9px Ubuntu'; ctx.textAlign = 'left';
      ctx.fillText(g.label, pad.left + 3, pad.top + 11);

      // Marcador animado
      if (mt !== null) {
        const mpx = pad.left + (t[mt] / 10) * iW;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(mpx, pad.top); ctx.lineTo(mpx, pad.top + iH); ctx.stroke();
        ctx.setLineDash([]);
        const mv  = data[mt];
        const mpy = pad.top + (1 - (mv - minV) / rangeV) * iH;
        ctx.beginPath(); ctx.arc(mpx, mpy, 3, 0, Math.PI * 2);
        ctx.fillStyle = g.color; ctx.fill();
      }
    }

    indicadores[g.id] = { draw, data, t };
    draw(null);
  });
}

function actualizarIndicador(frame) {
  Object.entries(indicadores).forEach(([id, cfg]) => {
    cfg.draw(frame);
  });
}

// Click en filas de ejemplos → autorellena los inputs
document.querySelectorAll('.ej-row').forEach(row => {
  row.addEventListener('click', () => {
    document.getElementById('xf').value = row.dataset.x;
    document.getElementById('yf').value = row.dataset.y;
    document.getElementById('zf').value = row.dataset.z;
    trajStatus.textContent = '';
  });
});

//Loop de animación ────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

//Responsividad ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
