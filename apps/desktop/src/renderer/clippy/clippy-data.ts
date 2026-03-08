// Original Clippy sprite sheet: 124x93px frames
// Sprite: clippy-map.png (3348x3162)
// Frame data extracted from clippyjs (MIT license)

export const FRAME_W = 124;
export const FRAME_H = 93;

// Frame: x,y = sprite sheet pixel offset, d = duration in ms
// x=-1 means invisible frame
type Frame = { x: number; y: number; d: number };

export const CLIPPY_FRAMES: Record<string, Frame[]> = {
  RestPose: [{ x: 0, y: 0, d: 100 }],
  IdleEyeBrowRaise: [
    { x: 0, y: 0, d: 100 }, { x: 1116, y: 186, d: 100 }, { x: 1240, y: 186, d: 100 },
    { x: 1364, y: 186, d: 900 }, { x: 1240, y: 186, d: 100 }, { x: 1116, y: 186, d: 100 },
    { x: 0, y: 0, d: 100 },
  ],
  Wave: [
    { x: 0, y: 0, d: 100 }, { x: 1116, y: 1767, d: 100 }, { x: 1240, y: 1767, d: 100 },
    { x: 1364, y: 1767, d: 100 }, { x: 1488, y: 1767, d: 100 }, { x: 1612, y: 1767, d: 100 },
    { x: 1736, y: 1767, d: 100 }, { x: 1860, y: 1767, d: 100 }, { x: 1984, y: 1767, d: 100 },
    { x: 2108, y: 1767, d: 100 }, { x: 2232, y: 1767, d: 100 }, { x: 2356, y: 1767, d: 100 },
    { x: 2480, y: 1767, d: 100 }, { x: 2604, y: 1767, d: 100 }, { x: 2728, y: 1767, d: 100 },
    { x: 2852, y: 1767, d: 100 }, { x: 2976, y: 1767, d: 100 }, { x: 3100, y: 1767, d: 100 },
    { x: 3224, y: 1767, d: 100 }, { x: 0, y: 1860, d: 100 }, { x: 124, y: 1860, d: 100 },
    { x: 248, y: 1860, d: 1200 }, { x: 372, y: 1860, d: 100 }, { x: 248, y: 1860, d: 1300 },
    { x: 496, y: 1860, d: 50 }, { x: 2976, y: 1767, d: 50 }, { x: 0, y: 0, d: 100 },
  ],
  Thinking: [
    { x: 0, y: 0, d: 100 }, { x: 124, y: 93, d: 100 }, { x: 248, y: 93, d: 100 },
    { x: 372, y: 93, d: 100 }, { x: 496, y: 93, d: 100 }, { x: 620, y: 93, d: 100 },
    { x: 744, y: 93, d: 100 }, { x: 868, y: 93, d: 100 }, { x: 992, y: 93, d: 100 },
    { x: 1116, y: 93, d: 100 }, { x: 1240, y: 93, d: 100 }, { x: 1364, y: 93, d: 100 },
    { x: 1488, y: 93, d: 100 }, { x: 1612, y: 93, d: 100 }, { x: 1736, y: 93, d: 100 },
    { x: 1860, y: 93, d: 100 }, { x: 1984, y: 93, d: 100 }, { x: 2108, y: 93, d: 100 },
    { x: 2232, y: 93, d: 100 }, { x: 2356, y: 93, d: 100 }, { x: 2480, y: 93, d: 100 },
    { x: 2604, y: 93, d: 100 }, { x: 2728, y: 93, d: 100 }, { x: 2852, y: 93, d: 100 },
    { x: 2976, y: 93, d: 100 }, { x: 3100, y: 93, d: 100 }, { x: 3224, y: 93, d: 100 },
    { x: 0, y: 186, d: 100 }, { x: 124, y: 186, d: 100 }, { x: 248, y: 186, d: 100 },
    { x: 372, y: 186, d: 100 }, { x: 496, y: 186, d: 100 }, { x: 620, y: 186, d: 100 },
    { x: 744, y: 186, d: 100 }, { x: 868, y: 186, d: 100 }, { x: 992, y: 186, d: 100 },
    { x: 992, y: 93, d: 100 }, { x: 868, y: 93, d: 100 }, { x: 744, y: 93, d: 100 },
    { x: 620, y: 93, d: 100 }, { x: 496, y: 93, d: 100 }, { x: 372, y: 93, d: 100 },
    { x: 248, y: 93, d: 100 }, { x: 124, y: 93, d: 100 }, { x: 0, y: 0, d: 100 },
  ],
  GetAttention: [
    { x: 0, y: 0, d: 100 }, { x: 1240, y: 651, d: 100 }, { x: 1364, y: 651, d: 100 },
    { x: 1488, y: 651, d: 100 }, { x: 1612, y: 651, d: 100 }, { x: 1736, y: 651, d: 100 },
    { x: 1860, y: 651, d: 100 }, { x: 1984, y: 651, d: 100 }, { x: 2108, y: 651, d: 100 },
    { x: 2232, y: 651, d: 100 }, { x: 2356, y: 651, d: 150 }, { x: 2232, y: 651, d: 150 },
    { x: 2356, y: 651, d: 150 }, { x: 2232, y: 651, d: 150 }, { x: 2480, y: 651, d: 150 },
    { x: 2604, y: 651, d: 100 }, { x: 2728, y: 651, d: 100 }, { x: 2852, y: 651, d: 100 },
    { x: 2976, y: 651, d: 100 }, { x: 3100, y: 651, d: 100 }, { x: 3224, y: 651, d: 100 },
    { x: 0, y: 744, d: 100 }, { x: 124, y: 744, d: 100 }, { x: 0, y: 0, d: 100 },
  ],
  LookRight: [
    { x: 0, y: 0, d: 100 }, { x: 620, y: 651, d: 100 }, { x: 744, y: 651, d: 100 },
    { x: 868, y: 651, d: 1200 }, { x: 992, y: 651, d: 100 }, { x: 1116, y: 651, d: 100 },
    { x: 0, y: 0, d: 100 },
  ],
  LookLeft: [
    { x: 0, y: 0, d: 100 }, { x: 248, y: 1488, d: 100 }, { x: 372, y: 1488, d: 100 },
    { x: 496, y: 1488, d: 1200 }, { x: 620, y: 1488, d: 100 }, { x: 744, y: 1488, d: 100 },
    { x: 0, y: 0, d: 100 },
  ],
  Congratulate: [
    { x: 0, y: 0, d: 100 }, { x: 124, y: 0, d: 10 }, { x: 248, y: 0, d: 10 },
    { x: 372, y: 0, d: 10 }, { x: 496, y: 0, d: 10 }, { x: 620, y: 0, d: 10 },
    { x: 744, y: 0, d: 10 }, { x: 868, y: 0, d: 10 }, { x: 992, y: 0, d: 10 },
    { x: 1116, y: 0, d: 100 }, { x: 1240, y: 0, d: 100 }, { x: 1364, y: 0, d: 100 },
    { x: 1488, y: 0, d: 1200 }, { x: 1612, y: 0, d: 100 }, { x: 1736, y: 0, d: 100 },
    { x: 1488, y: 0, d: 1200 }, { x: 1860, y: 0, d: 100 }, { x: 1984, y: 0, d: 100 },
    { x: 2108, y: 0, d: 100 }, { x: 2232, y: 0, d: 100 }, { x: 2356, y: 0, d: 100 },
    { x: 0, y: 0, d: 100 },
  ],
  Alert: [
    { x: 0, y: 0, d: 100 }, { x: 2356, y: 1116, d: 100 }, { x: 2480, y: 1116, d: 100 },
    { x: 2604, y: 1116, d: 100 }, { x: 2728, y: 1116, d: 100 }, { x: 2852, y: 1116, d: 100 },
    { x: 2976, y: 1116, d: 100 }, { x: 3100, y: 1116, d: 100 }, { x: 3224, y: 1116, d: 100 },
    { x: 0, y: 1209, d: 100 }, { x: 124, y: 1209, d: 500 }, { x: 248, y: 1209, d: 100 },
    { x: 372, y: 1209, d: 100 }, { x: 496, y: 1209, d: 100 }, { x: 620, y: 1209, d: 100 },
    { x: 744, y: 1209, d: 100 }, { x: 868, y: 1209, d: 100 }, { x: 992, y: 1209, d: 100 },
    { x: 1116, y: 1209, d: 100 }, { x: 0, y: 0, d: 100 },
  ],
};

export const IDLE_ANIMATIONS = ["IdleEyeBrowRaise", "LookRight", "LookLeft", "RestPose"];

export const SPEECH_TIPS: Record<string, string[]> = {
  text: [
    "Ich hab deinen Text gespeichert! Brauchst du ihn nochmal?",
    "Sieht aus wie ein wichtiger Text — ich merk mir das!",
    "Schon wieder was kopiert? Du bist ja fleissig!",
  ],
  url: [
    "Ein Link! Ich hab die Seite fuer dich analysiert.",
    "Interessante URL — soll ich dir aehnliche Links zeigen?",
  ],
  image: [
    "Schickes Bild! Ich hab es fuer dich gespeichert.",
    "Ein Screenshot? Ich analysiere den Inhalt...",
  ],
  file: [
    "Datei erkannt! Ich extrahiere den Inhalt fuer dich.",
    "Ah, eine Datei! Ich schaue mal rein...",
  ],
  idle: [
    "Kopiere was — ich bin bereit!",
    "Tipp: Ctrl+Shift+V oeffnet das Quick Panel!",
    "Wusstest du? Ich kann auch Antworten vorschlagen!",
    "Klick mich an fuer deine letzten Clips!",
    "Ich sortiere deine Zwischenablage automatisch!",
  ],
};

export function getRandomTip(type: string): string {
  const pool = SPEECH_TIPS[type] || SPEECH_TIPS.idle;
  return pool[Math.floor(Math.random() * pool.length)];
}
