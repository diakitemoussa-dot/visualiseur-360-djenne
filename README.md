# Visualiseur 360° — Mosquée de Djenné (Stable)

Visualiseur Web monopage optimisé mobile — **technologie stable de `webar-360` / `360°C/webar-site`** (Three.js direct + CameraRig + GyroControls) adaptée à la vidéo 360°, en gardant la théorie **scroll = temps**.

Vidéo équirectangulaire **3:30** — `video360-djenne.mp4` 49.1 MB, 1920×960, H.264 (source HEVC 2880×1440 transcodée pour <100 MB GitHub).

### Stack stable (vs A-Frame instable)
- `vendor/three/build/three.module.js` (Three.js rendering direct, pas A-Frame)
- `js/CameraRig.js` + `js/GyroControls.js` : gyroscope + rotation 360 stable
- `js/TouchControls.js` **adapté** : 1 doigt horizontal → `rig.rotate()` (360), 1 doigt vertical → `videoScrub.scrubByDelta()`, 2 doigts pinch → `rig.pinch()` (zoom), molette → scrub temps
- `js/VideoScrubController.js` : contrôle temporel ultra-fluide via `requestAnimationFrame` + `fastSeek` / `currentTime`
- `js/main.js` : sphère inversée `SphereGeometry(500,64,48)` + `VideoTexture`, boucle `renderer.setAnimationLoop`, onboarding tactile
- `css/style.css` : base `webar-360` (glassmorphism, topbar, bottombar)

### Théorie conservée : scroll = temps
- **Horizontal ←→** : regarde autour (360°, stable)
- **Vertical ↑↓** ou **molette** : avance / recule dans le temps (0 → 210s)
- **Pinch** : zoom FOV 42°–95°
- Garde `START_TIME = 1.0s` (évite frame noire à t=0)

### Fichiers
```
visualiseur-360-djenne/
├─ index.html
├─ css/style.css
├─ js/main.js, CameraRig.js, GyroControls.js, TouchControls.js, VideoScrubController.js
├─ vendor/three/...
└─ video360-djenne.mp4  (49.1 MB)
```

### Lancer en local (CORS + Range obligatoire)
```powershell
npx http-server -p 8000 --cors -c-1
# puis http://localhost:8000/ → Démarrer → glisser ↔ / ↕ / molette
# Quest même WiFi : http://IP_DU_PC:8000/
```

### Déploiement
Repo `diakitemoussa-dot/visualiseur-360-djenne` sur `master`/`root` → Pages : `https://diakitemoussa-dot.github.io/visualiseur-360-djenne/`

### Origine
Technologie reprise de `C:\Users\Kabakoo Apprenant.e\Desktop\MES PROJETS\360°C\webar-site` et `https://diakitemoussa-dot.github.io/webar-360/` (Dogon Village), adaptée de `TOUR` statique à `VideoTexture` dynamique.
Crédits vidéo : Kabakoo — Mosquée de Djenné.
