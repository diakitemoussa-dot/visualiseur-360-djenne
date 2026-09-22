/**
 * TouchControls adapté de webar-site (stable) — version vidéo
 * - 1 doigt horizontal → rotation 360 (rig.rotate)
 * - 1 doigt vertical → scrub temps (videoScrub.scrubByDelta)
 * - 2 doigts pinch → zoom (rig.pinch)
 * - molette → scrub temps (pas de zoom)
 * Garde la stabilité Three.js + CameraRig
 */
export class TouchControls {
  constructor(element, rig, videoScrub, onFirstGesture) {
    this.rig = rig;
    this.videoScrub = videoScrub;
    this.onFirstGesture = onFirstGesture;
    this.pointers = new Map();
    this.startPinchDist = 0;
    this.lastX = 0;
    this.lastY = 0;

    // pour distinguer horizontal vs vertical sur 1 doigt
    this.gestureStartX = 0;
    this.gestureStartY = 0;
    this.gestureStartTime = 0;
    this.gestureType = null; // 'h' | 'v' | null

    element.addEventListener('pointerdown', (e) => this._onDown(e));
    element.addEventListener('pointermove', (e) => this._onMove(e));
    element.addEventListener('pointerup', (e) => this._onUp(e));
    element.addEventListener('pointercancel', (e) => this._onUp(e));
    element.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    window.addEventListener('keydown', (e) => this._onKey(e));
    element.style.touchAction = 'none';
  }

  _onWheel(event) {
    event.preventDefault();
    // molette = temps (théorie conservée)
    this.videoScrub.wheel(event.deltaY);
    if (this.onFirstGesture) this.onFirstGesture();
  }

  _onKey(event) {
    const step = 18;
    switch (event.key) {
      case 'ArrowLeft':
        this.rig.rotate(step, 0);
        break;
      case 'ArrowRight':
        this.rig.rotate(-step, 0);
        break;
      case 'ArrowUp':
        // haut = avance temps
        this.videoScrub.scrubByDelta(40);
        if (this.onFirstGesture) this.onFirstGesture();
        break;
      case 'ArrowDown':
        this.videoScrub.scrubByDelta(-40);
        if (this.onFirstGesture) this.onFirstGesture();
        break;
      case '+':
      case '=':
        this.rig.pinch(1.08);
        break;
      case '-':
      case '_':
        this.rig.pinch(1 / 1.08);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  _onDown(event) {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 1) {
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.gestureStartX = event.clientX;
      this.gestureStartY = event.clientY;
      this.gestureStartTime = this.videoScrub.targetTime;
      this.gestureType = null;
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.startPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      this.gestureType = 'pinch';
    }
    // capture pour suivre même hors élément
    try { event.target.setPointerCapture(event.pointerId); } catch(e){}
  }

  _onMove(event) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 1) {
      const dx = event.clientX - this.lastX;
      const dy = event.clientY - this.lastY;
      const totalDx = event.clientX - this.gestureStartX;
      const totalDy = event.clientY - this.gestureStartY;

      if (this.gestureType === null) {
        if (Math.abs(totalDx) < 10 && Math.abs(totalDy) < 10) return;
        this.gestureType = Math.abs(totalDy) > Math.abs(totalDx) ? 'v' : 'h';
        if (this.onFirstGesture) this.onFirstGesture();
      }

      if (this.gestureType === 'v') {
        // vertical = temps
        const deltaY = this.gestureStartY - event.clientY; // positif vers haut = avance
        const newT = this.gestureStartTime + deltaY * this.videoScrub.VERTICAL_FACTOR;
        this.videoScrub.scrubTo(newT);
        // on met à jour last pour ne pas accumuler rotate
        this.lastX = event.clientX;
        this.lastY = event.clientY;
      } else if (this.gestureType === 'h') {
        // horizontal = rotation 360 (stable comme webar-360)
        this.rig.rotate(dx, 0); // on ne passe que dx pour éviter pitch vertical
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        // on garde aussi un léger pitch si l'utilisateur fait un geste diagonal horizontal dominant ? non
      }
    } else if (this.pointers.size === 2 && this.startPinchDist > 0) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      this.rig.pinch(dist / this.startPinchDist);
    }
  }

  _onUp(event) {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.startPinchDist = 0;
    if (this.pointers.size === 1) {
      const [p] = [...this.pointers.values()];
      this.lastX = p.x;
      this.lastY = p.y;
      // reset gesture pour le doigt restant
      this.gestureStartX = p.x;
      this.gestureStartY = p.y;
      this.gestureStartTime = this.videoScrub.targetTime;
      this.gestureType = null;
    }
    if (this.pointers.size === 0) {
      this.gestureType = null;
    }
  }
}
