export class AudioManager {
  constructor() {
    this.enabled = false;
    this.tracks = {
      key: new Audio("./assets/sounds/key.mp3"),
      bell: new Audio("./assets/sounds/bell.mp3"),
      carriage: new Audio("./assets/sounds/carriage.mp3"),
      door: new Audio("./assets/sounds/door.mp3"),
      terror: new Audio("./assets/sounds/final_sound.mp3")
    };
  }
  unlock() {
    this.enabled = true;
    Object.values(this.tracks).forEach((audio) => audio.load());
  }
  play(name) {
    if (!this.enabled) return;
    const audio = this.tracks[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  playKey() {
    this.play("key");
  }
  playBell() {
    this.play("bell");
  }
  playCarriage() {
    this.play("carriage");
  }
  playDoor() {
    this.play("door");
  }
  playTerror() {
    this.play("terror");
  }
}
