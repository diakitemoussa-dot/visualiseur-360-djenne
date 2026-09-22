import * as THREE from 'three';
import { CameraRig } from './CameraRig.js';
import { GyroControls } from './GyroControls.js';
import { TouchControls } from './TouchControls.js';
import { VideoScrubController } from './VideoScrubController.js';

const app = document.getElementById('app');
const motionPrompt = document.getElementById('motionPrompt');
const btnStart = document.getElementById('btn-start');
const overlayStart = document.getElementById('overlay-start');
const loadingMsg = document.getElementById('loading-msg');
const onboarding = document.getElementById('onboarding');
const btnUnderstood = document.getElementById('btn-understood');
const timeCurrentEl = document.getElementById('time-current');
const timeDurationEl = document.getElementById('time-duration');
const pctEl = document.getElementById('pct');

// --- Helpers ---
function fmt(t){
  if (isNaN(t) || !isFinite(t)) return '--:--';
  t = Math.max(0, Math.floor(t));
  const h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = t%60;
  if (h>0) return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

// --- Three.js setup (stable webar-360) ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, 0.1, 1100);

const rig = new CameraRig(camera);
const gyro = new GyroControls(rig);

// --- Vidéo 360 ---
const video = document.createElement('video');
video.src = './video360-djenne.mp4';
video.crossOrigin = 'anonymous';
video.loop = false;
video.playsInline = true;
video.setAttribute('playsinline','');
video.setAttribute('webkit-playsinline','');
video.muted = true;
video.preload = 'auto';
window._video = video; window._rig = rig;

const videoScrub = new VideoScrubController(video, (cur, dur)=>{
  timeCurrentEl.textContent = fmt(cur);
  timeDurationEl.textContent = fmt(dur);
  const p = dur>0 ? Math.round((cur/dur)*100) : 0;
  pctEl.textContent = p + '%';
});
videoScrub.init();

// Sphere inversée + VideoTexture
const geo = new THREE.SphereGeometry(500, 64, 48);
geo.scale(-1, 1, 1);
let videoTexture = null;
let sky = null;

function createSky() {
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: videoTexture });
  sky = new THREE.Mesh(geo, mat);
  scene.add(sky);
}
createSky();

// TouchControls adapté : vertical = temps, horizontal = rotation, molette = temps, pinch = zoom
let onboardingHidden = true;
function showOnboarding(){
  onboarding.classList.remove('hidden');
  onboardingHidden = false;
  clearTimeout(showOnboarding._t);
  showOnboarding._t = setTimeout(hideOnboarding, 5000);
}
function hideOnboarding(){
  if (onboardingHidden) return;
  onboardingHidden = true;
  onboarding.classList.add('hidden');
  clearTimeout(showOnboarding._t);
}
btnUnderstood.addEventListener('click', hideOnboarding);

const touchControls = new TouchControls(renderer.domElement, rig, videoScrub, ()=>{
  if (!onboardingHidden) hideOnboarding();
});

// --- Événements vidéo ---
video.addEventListener('loadedmetadata', ()=>{
  const dur = video.duration;
  console.log('[360] duration', dur, 'videoWidth', video.videoWidth);
  videoScrub.handleMetadata(dur);
  loadingMsg.textContent = 'Prêt • ' + fmt(dur) + ' • Cliquez sur Démarrer';
  loadingMsg.style.color = '#4ade80';
});
video.addEventListener('loadeddata', ()=>{
  console.log('[360] loadeddata');
  loadingMsg.textContent = 'Première image prête • ' + fmt(video.duration);
});
video.addEventListener('canplay', ()=>{
  if (loadingMsg.textContent.includes('Chargement')) loadingMsg.textContent = 'Prêt à démarrer';
});
video.addEventListener('error', ()=>{
  loadingMsg.textContent = 'Erreur vidéo : ./video360-djenne.mp4';
  loadingMsg.style.color = '#ff6b6b';
  console.error(video.error);
});
video.addEventListener('timeupdate', ()=>{
  videoScrub.syncFromVideo();
});
if (video.readyState >= 1) videoScrub.handleMetadata(video.duration);

// --- Démarrage (débloque autoplay comme webar-360) ---
async function unlockVideo(){
  try{
    loadingMsg.textContent = 'Initialisation...';
    loadingMsg.style.color = '#fff';
    const p = video.play();
    if (p) await p;
    await new Promise(r=> setTimeout(r, 250));
    video.pause();
    video.currentTime = videoScrub.START_TIME;
    videoScrub.targetTime = videoScrub.START_TIME;
    videoScrub._notify();
    overlayStart.classList.add('hidden');
    showOnboarding();
    console.log('[360] débloqué à t='+videoScrub.START_TIME);
  } catch(e){
    console.warn(e);
    loadingMsg.textContent = 'Erreur: ' + e.message;
    loadingMsg.style.color = '#ff6b6b';
    setTimeout(()=> overlayStart.classList.add('hidden'), 800);
    showOnboarding();
  }
}
btnStart.addEventListener('click', unlockVideo);
overlayStart.addEventListener('click', (e)=>{ if(e.target===overlayStart) unlockVideo(); });

// --- UI webar-360 ---
document.getElementById('recenterBtn').addEventListener('click', ()=> rig.recenter());
document.getElementById('infoBtn').addEventListener('click', ()=>{
  alert('Mosquée de Djenné — 360° Vidéo\n\n• Glisse gauche/droite : regarder autour (stable Three.js)\n• Glisse haut/bas ou molette : avancer/reculer dans le temps\n• Pince : zoom\n• Gyroscope : actif si autorisé');
});

// Gyro comme webar-360
let motionRequested = false;
motionPrompt.addEventListener('click', tryEnableMotion);
async function tryEnableMotion(){
  if (motionRequested) return;
  motionRequested = true;
  const ok = await gyro.enable();
  motionPrompt.hidden = true;
  if (!ok) console.info('Gyroscope indisponible, contrôles tactiles actifs');
}
const needsPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
if (needsPermission) {
  motionPrompt.hidden = false;
} else {
  gyro.attach();
  setTimeout(()=>{ if(!gyro.available) console.info('No gyro, touch active'); }, 1000);
}

// --- Resize & Loop (stable) ---
addEventListener('resize', ()=>{
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
const clock = new THREE.Clock();
renderer.setAnimationLoop(()=>{
  const dt = clock.getDelta();
  rig.update(dt);
  // VideoTexture se met à jour auto si vidéo joue, mais on force needsUpdate quand scrub en pause
  if (videoTexture && video.readyState >= 2) videoTexture.needsUpdate = true;
  renderer.render(scene, camera);
});
