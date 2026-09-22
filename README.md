# Visualiseur 360° — Mosquée de Djenné

Visualiseur Web monopage (SPA) optimisé mobile pour explorer une vidéo 360° équirectangulaire **3:30** (1920×960, H.264) de la Grande Mosquée de Djenné.

**Stack :** A-Frame 1.6.0 (Three.js rendering), WebGL, JavaScript vanilla — single file `index.html`.

### Fonctionnalités

- **Vidéo 360°** sur `<a-videosphere>` préchargée, mise en pause à `t=1.0s` (évite frame noire à `t=0`)
- **Vue 360°** : `look-controls` + gyroscope (`magicWindowTrackingEnabled`) — glissement **horizontal** ←→ pour regarder autour
- **Temps** : glissement **vertical** ↑↓ ou **molette** → scrub temporel ultra-fluide via `requestAnimationFrame` + `video.currentTime` / `fastSeek`
- **Onboarding tactile** : overlay animé (GS + CSS) après "Démarrer" — disparaît sur **"J'ai compris"** ou premier geste ou après 5s
- **Compteur** : `Étape / Temps : 00:04 / 03:30  2%` en bas

### Fichiers

```
visualiseur-360-djenne/
 ├─ index.html              # code complet HTML+CSS+JS
 └─ video360-djenne.mp4     # 49.1 MB, 1920×960, H.264, 3:30, équirectangulaire
```

> Vidéo source originale : `C:\Users\Kabakoo Apprenant.e\Downloads\English (3).mp4` (2880×1440, HEVC) — transcodée en H.264 pour compatibilité Chrome/Quest et <100 MB pour GitHub.

### Lancer en local (obligatoire — CORS + Range)

Le serveur doit supporter `Range: bytes` (`206 PartialContent`) pour le seeking, sinon `seekable` reste `0-0`.

```powershell
# http-server (recommandé, support Range + CORS)
npx http-server -p 8000 --cors -c-1

# ou
npx serve -l 8000

# PAS python -m http.server (ne renvoie pas 206 sur ce Python)
```

Puis ouvrir `http://localhost:8000/` → **Démarrer** → glisser ↔ pour regarder, ↕ / molette pour le temps.

Sur Meta Quest (même WiFi) : `http://IP_DU_PC:8000/`

### Déployer sur GitHub Pages

Le repo est public et Pages est activé sur `main` / `root` → URL : `https://fansestar355-star.github.io/visualiseur-360-djenne/`

### Crédits

Vidéo 360° Kabakoo — Mosquée de Djenné. Projet initié le 22/09/2026.
