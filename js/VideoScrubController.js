/**
 * VideoScrubController — gère le scrub temporel de la vidéo 360 via scroll vertical / molette
 * Garde la théorie du projet : scroll = temps, avec optimisation requestAnimationFrame
 */
export class VideoScrubController {
  constructor(video, onTimeUpdate) {
    this.video = video;
    this.onTimeUpdate = onTimeUpdate; // callback(current, duration)
    this.targetTime = 0;
    this.rafPending = false;
    this.VERTICAL_FACTOR = 0.14; // s par pixel (200px ≈ 28s)
    this.WHEEL_FACTOR = 0.025; // s par deltaY
    this.START_TIME = 1.0;

    // rAF scrub ultra-fluide
    this._scrubRaf = this._scrubRaf.bind(this);
  }

  init() {
    this.video.muted = true;
    this.video.setAttribute('muted', '');
    this.video.setAttribute('playsinline', '');
    this.video.pause();
    try { this.video.currentTime = this.START_TIME; } catch(e){}
    this.targetTime = this.START_TIME;
  }

  handleMetadata(duration) {
    // appelé après loadedmetadata
    try { if (this.video.currentTime < 0.9) this.video.currentTime = this.START_TIME; } catch(e){}
    this.targetTime = this.video.currentTime;
    this._notify();
  }

  _notify() {
    if (this.onTimeUpdate) this.onTimeUpdate(this.targetTime, this.video.duration || 210.77);
  }

  _scrubRaf() {
    try {
      if ('fastSeek' in this.video) this.video.fastSeek(this.targetTime);
      else this.video.currentTime = this.targetTime;
    } catch(e) { this.video.currentTime = this.targetTime; }
    this.rafPending = false;
    this._notify();
  }

  scrubTo(t) {
    const dur = this.video.duration || 210.768;
    this.targetTime = Math.max(0, Math.min(dur, t));
    this._notify();
    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(this._scrubRaf);
    }
  }

  scrubByDelta(dy) {
    // dy positif = glissé vers le haut = avance
    this.scrubTo(this.targetTime + dy * this.VERTICAL_FACTOR);
  }

  wheel(deltaY) {
    this.scrubTo((this.video.currentTime || this.targetTime) + deltaY * this.WHEEL_FACTOR);
  }

  // pour synchro si vidéo joue
  syncFromVideo() {
    if (!this.rafPending) {
      this.targetTime = this.video.currentTime;
      this._notify();
    }
  }
}
