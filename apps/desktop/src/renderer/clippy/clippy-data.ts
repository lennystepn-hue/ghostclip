// Clippy animation name mappings
// Maps our internal animation names to clippyjs animation names
// Used for future sprite sheet integration

export const CLIPPY_ANIMATIONS = {
  idle: "Idle1_1",
  wave: "Wave",
  thinking: "Thinking",
  writing: "Writing",
  explain: "Explain",
  congratulate: "Congratulate",
  search: "Searching",
  greeting: "Greeting",
  goodbye: "GoodBye",
  getAttention: "GetAttention",
  lookRight: "LookRight",
  lookLeft: "LookLeft",
  lookUp: "LookUp",
  lookDown: "LookDown",
  rest: "RestPose",
  show: "Show",
  hide: "Hide",
  alert: "Alert",
  checkingSomething: "CheckingSomething",
  processing: "Processing",
  save: "Save",
  print: "Print",
} as const;

export type ClippyAnimationName = keyof typeof CLIPPY_ANIMATIONS;

// Speech tips based on clip type (German)
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
