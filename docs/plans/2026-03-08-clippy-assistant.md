# Clippy AI Assistant + Bulletproof Panels — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the floating widget (bottom-left circle) with an animated Clippy character (bottom-right) that acts as a living AI assistant, and fix Quick/Reply panels to work reliably on Windows.

**Architecture:** Clippy uses sprite-sheet animation from clippyjs assets (124x93px frames, 43 animations). A new `ClippyAssistant.tsx` renderer component handles sprite rendering, speech bubbles, and the expanded panel. The main process `floating-widget.ts` is refactored to position bottom-right with larger collapsed size (124x93). Quick/Reply panels get Windows-specific fixes (no `transparent: true`, proper `show()`/`focus()` flow).

**Tech Stack:** clippyjs (sprite assets + animation data), React, Electron BrowserWindow, CSS sprite animation

---

## Phase 1: Fix Quick Panel + Reply Panel on Windows

### Task 1: Make Quick Panel bulletproof on Windows

**Files:**
- Modify: `apps/desktop/src/main/quick-panel.ts`

**Problem:** On Windows, `transparent: true` BrowserWindows can fail to render or show as black rectangles. The `blur` auto-hide can also fire immediately if the window doesn't get focus properly. `show()` + `focus()` race condition on Windows.

**Step 1: Apply Windows fixes to quick-panel.ts**

Replace the full file content with:

```typescript
import { BrowserWindow, screen } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

let quickPanel: BrowserWindow | null = null;

export function createQuickPanel(): BrowserWindow {
  if (quickPanel && !quickPanel.isDestroyed()) {
    quickPanel.show();
    quickPanel.focus();
    return quickPanel;
  }

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x, y, width } = display.workArea;

  const panelWidth = Math.round(Math.min(Math.max(width * 0.6, 720), 1100));
  const panelHeight = 560;

  quickPanel = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x: Math.round(x + (width - panelWidth) / 2),
    y: y + 60,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    // Windows fix: use backgroundColor instead of transparent for reliability
    transparent: process.platform !== "win32",
    backgroundColor: process.platform === "win32" ? "#00000000" : undefined,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    quickPanel.loadURL(process.env.ELECTRON_RENDERER_URL + "?quickpanel=true");
  } else {
    quickPanel.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { quickpanel: "true" },
    });
  }

  quickPanel.on("ready-to-show", () => {
    if (!quickPanel || quickPanel.isDestroyed()) return;
    quickPanel.show();
    // Windows: delay focus to avoid blur-on-show race condition
    setTimeout(() => {
      if (quickPanel && !quickPanel.isDestroyed()) {
        quickPanel.focus();
      }
    }, process.platform === "win32" ? 100 : 0);
  });

  quickPanel.on("blur", () => {
    // Small delay: prevents instant close on Windows when focus shifts briefly
    setTimeout(() => {
      if (quickPanel && !quickPanel.isDestroyed() && !quickPanel.isFocused()) {
        quickPanel.hide();
      }
    }, 80);
  });

  quickPanel.on("closed", () => {
    quickPanel = null;
  });

  return quickPanel;
}

export function toggleQuickPanel() {
  if (quickPanel && !quickPanel.isDestroyed() && quickPanel.isVisible()) {
    quickPanel.hide();
  } else {
    createQuickPanel();
  }
}

export function hideQuickPanel() {
  if (quickPanel && !quickPanel.isDestroyed()) {
    quickPanel.hide();
  }
}
```

**Step 2: Build and verify**

Run: `cd apps/desktop && pnpm build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add apps/desktop/src/main/quick-panel.ts
git commit -m "fix: make quick panel reliable on Windows (transparency + focus race)"
```

---

### Task 2: Make Reply Panel bulletproof on Windows

**Files:**
- Modify: `apps/desktop/src/main/reply-panel.ts`

**Problem:** Same Windows issues as Quick Panel. Additionally, `showReplyPanel()` only works on Linux because it uses `xclip` — Windows and macOS have no selected-text detection.

**Step 1: Apply Windows + cross-platform fixes to reply-panel.ts**

Replace the full file content with:

```typescript
import { BrowserWindow, screen, clipboard } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { execSync } from "node:child_process";

let replyPanel: BrowserWindow | null = null;

/** Read selected text (cross-platform) */
export function getSelectedText(): string {
  try {
    if (process.platform === "linux") {
      return execSync("xclip -selection primary -o", {
        encoding: "utf-8",
        timeout: 2000,
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    }
    if (process.platform === "win32") {
      // Windows: use PowerShell to get selected text from active window
      // Fallback: use clipboard content (user likely just copied it)
      return clipboard.readText().trim();
    }
    if (process.platform === "darwin") {
      // macOS: try pbpaste (clipboard content)
      return clipboard.readText().trim();
    }
    return "";
  } catch {
    return "";
  }
}

export function createReplyPanel(selectedText: string): BrowserWindow {
  if (replyPanel && !replyPanel.isDestroyed()) {
    replyPanel.webContents.send("reply:setText", selectedText);
    replyPanel.show();
    replyPanel.focus();
    return replyPanel;
  }

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x, y, width, height } = display.workArea;

  const panelWidth = 440;
  const panelHeight = 380;
  let px = Math.min(cursor.x, x + width - panelWidth - 20);
  let py = Math.min(cursor.y + 20, y + height - panelHeight - 20);
  px = Math.max(x, px);
  py = Math.max(y, py);

  replyPanel = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x: px,
    y: py,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: process.platform !== "win32",
    backgroundColor: process.platform === "win32" ? "#00000000" : undefined,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    replyPanel.loadURL(process.env.ELECTRON_RENDERER_URL + "?replypanel=true");
  } else {
    replyPanel.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { replypanel: "true" },
    });
  }

  replyPanel.on("ready-to-show", () => {
    if (!replyPanel || replyPanel.isDestroyed()) return;
    replyPanel.show();
    setTimeout(() => {
      if (replyPanel && !replyPanel.isDestroyed()) {
        replyPanel.focus();
        replyPanel.webContents.send("reply:setText", selectedText);
      }
    }, process.platform === "win32" ? 100 : 0);
  });

  replyPanel.on("blur", () => {
    setTimeout(() => {
      if (replyPanel && !replyPanel.isDestroyed() && !replyPanel.isFocused()) {
        replyPanel.hide();
      }
    }, 80);
  });

  replyPanel.on("closed", () => {
    replyPanel = null;
  });

  return replyPanel;
}

export function showReplyPanel() {
  const selectedText = getSelectedText();
  if (!selectedText || selectedText.length < 3) {
    return;
  }
  createReplyPanel(selectedText);
}

export function hideReplyPanel() {
  if (replyPanel && !replyPanel.isDestroyed()) {
    replyPanel.hide();
  }
}
```

**Step 2: Build and verify**

Run: `cd apps/desktop && pnpm build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/desktop/src/main/reply-panel.ts
git commit -m "fix: make reply panel reliable on Windows + cross-platform text selection"
```

---

## Phase 2: Install Clippy Assets

### Task 3: Add clippyjs and extract Clippy sprite data

**Files:**
- Create: `apps/desktop/src/renderer/clippy/clippy-data.ts` (animation frame data)
- Create: `apps/desktop/resources/clippy-map.png` (copy sprite sheet)

**Step 1: Install clippyjs for asset extraction**

```bash
cd /root/workspace/ghostclip
pnpm add clippyjs --filter @ghostclip/desktop
```

**Step 2: Extract and bundle the Clippy sprite sheet**

The sprite sheet lives inside the clippyjs package. Copy it to resources:

```bash
cp node_modules/clippyjs/dist/agents/Clippy/map.png apps/desktop/resources/clippy-map.png
```

If the path differs, find it:
```bash
find node_modules/clippyjs -name "map.png" | head -5
```

**Step 3: Create clippy-data.ts with animation definitions**

Create `apps/desktop/src/renderer/clippy/clippy-data.ts` containing the key animations we need. Extract frame data from the clippyjs agent definition.

```typescript
// Clippy sprite sheet: 124x93px frames, 27 columns, 34 rows
// Sprite sheet: clippy-map.png (3348x3162)

export const FRAME_WIDTH = 124;
export const FRAME_HEIGHT = 93;
export const SPRITE_COLS = 27;

export interface ClippyFrame {
  x: number;  // sprite sheet x offset
  y: number;  // sprite sheet y offset
  duration: number; // ms
}

export interface ClippyAnimation {
  frames: ClippyFrame[];
  loop?: boolean;
}

// We'll populate this from the clippyjs agent data at runtime
// For now, define the essential animations we need
export const CLIPPY_ANIMATIONS: Record<string, string> = {
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
  gestureRight: "GestureRight",
  save: "Save",
  print: "Print",
};
```

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/clippy/ apps/desktop/resources/clippy-map.png
git commit -m "feat: add Clippy sprite assets and animation data"
```

---

## Phase 3: Build ClippyAssistant Component

### Task 4: Refactor floating-widget.ts for Clippy (bottom-right, larger)

**Files:**
- Modify: `apps/desktop/src/main/floating-widget.ts`

**Step 1: Update floating-widget.ts for Clippy dimensions and position**

Replace full file with:

```typescript
import { BrowserWindow, screen, ipcMain } from "electron";
import { join } from "path";

let floatingWindow: BrowserWindow | null = null;
let isExpanded = false;

// Clippy character: 124x93 sprite + padding
const COLLAPSED_SIZE = { width: 140, height: 120 };
// Expanded: Clippy + speech bubble + panel
const EXPANDED_SIZE = { width: 420, height: 500 };

function getPosition(size: { width: number; height: number }) {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: workArea.x + workArea.width - size.width - 16,
    y: workArea.y + workArea.height - size.height - 16,
  };
}

export function createFloatingWidget() {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.show();
    return floatingWindow;
  }

  const pos = getPosition(COLLAPSED_SIZE);

  floatingWindow = new BrowserWindow({
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: process.platform !== "win32",
    backgroundColor: process.platform === "win32" ? "#00000000" : undefined,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  floatingWindow.loadFile(join(__dirname, "../renderer/index.html"), {
    query: { floatingWidget: "true" },
  });

  floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatingWindow.setIgnoreMouseEvents(true, { forward: true });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
    isExpanded = false;
  });

  return floatingWindow;
}

export function toggleFloatingWidget() {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    createFloatingWidget();
    return;
  }
  if (floatingWindow.isVisible()) {
    floatingWindow.hide();
  } else {
    floatingWindow.show();
  }
}

export function expandWidget() {
  if (!floatingWindow || floatingWindow.isDestroyed() || isExpanded) return;
  isExpanded = true;

  const pos = getPosition(EXPANDED_SIZE);
  floatingWindow.setBounds({
    x: pos.x,
    y: pos.y,
    width: EXPANDED_SIZE.width,
    height: EXPANDED_SIZE.height,
  });
  floatingWindow.setIgnoreMouseEvents(false);
  floatingWindow.setFocusable(true);
  floatingWindow.focus();
  floatingWindow.webContents.send("widget:expanded", true);
}

export function collapseWidget() {
  if (!floatingWindow || floatingWindow.isDestroyed() || !isExpanded) return;
  isExpanded = false;

  const pos = getPosition(COLLAPSED_SIZE);
  floatingWindow.setBounds({
    x: pos.x,
    y: pos.y,
    width: COLLAPSED_SIZE.width,
    height: COLLAPSED_SIZE.height,
  });
  floatingWindow.setIgnoreMouseEvents(true, { forward: true });
  floatingWindow.setFocusable(false);
  floatingWindow.webContents.send("widget:expanded", false);
}

export function sendToWidget(channel: string, data: any) {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.webContents.send(channel, data);
  }
}

export function setupWidgetIPC() {
  ipcMain.on("widget:toggle-expand", () => {
    if (isExpanded) collapseWidget();
    else expandWidget();
  });

  ipcMain.on("widget:collapse", () => {
    collapseWidget();
  });

  ipcMain.on("widget:mouse-enter", () => {
    if (floatingWindow && !floatingWindow.isDestroyed() && !isExpanded) {
      floatingWindow.setIgnoreMouseEvents(false);
    }
  });

  ipcMain.on("widget:mouse-leave", () => {
    if (floatingWindow && !floatingWindow.isDestroyed() && !isExpanded) {
      floatingWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  });
}
```

**Step 2: Build and verify**

Run: `cd apps/desktop && pnpm build`

**Step 3: Commit**

```bash
git add apps/desktop/src/main/floating-widget.ts
git commit -m "refactor: reposition widget to bottom-right with Clippy dimensions"
```

---

### Task 5: Create ClippyAssistant React component

**Files:**
- Create: `apps/desktop/src/renderer/views/ClippyAssistant.tsx`
- Modify: `apps/desktop/src/renderer/App.tsx` (swap FloatingWidget → ClippyAssistant)

**Step 1: Create ClippyAssistant.tsx**

This is the core component. It renders the Clippy sprite with CSS animations, a speech bubble for tips, and an expandable panel.

```typescript
// See full implementation in Task 5 code block below
```

The component needs:
1. **Sprite renderer**: A div with `background-image: url(clippy-map.png)`, animated via `background-position` changes on a timer
2. **Speech bubble**: Positioned above Clippy, shows AI tips with typewriter effect
3. **Expanded panel**: Same clip list + reply suggestions as old widget, but styled to look like it comes from Clippy
4. **Animation controller**: Plays different animations based on events (new clip → wave, AI thinking → thinking, idle → random idle)

Create file `apps/desktop/src/renderer/views/ClippyAssistant.tsx` with:

```tsx
import React, { useState, useEffect, useRef, useCallback } from "react";

interface RecentClip {
  id: string;
  type: string;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface ReplySuggestion {
  id: string;
  text: string;
  tone: string;
}

// Clippy speech tips based on clip type
const TIPS: Record<string, string[]> = {
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

function getRandomTip(type: string): string {
  const pool = TIPS[type] || TIPS.idle;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ClippyAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [recentClips, setRecentClips] = useState<RecentClip[]>([]);
  const [replies, setReplies] = useState<ReplySuggestion[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"clips" | "replies">("clips");
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const speechTimeout = useRef<any>(null);
  const typewriterRef = useRef<any>(null);

  const api = (window as any).ghostclip;

  // Typewriter effect for speech bubble
  useEffect(() => {
    if (!speechText) {
      setDisplayedText("");
      return;
    }
    setDisplayedText("");
    let i = 0;
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedText(speechText.slice(0, i));
      if (i >= speechText.length) {
        clearInterval(typewriterRef.current);
      }
    }, 30);
    return () => clearInterval(typewriterRef.current);
  }, [speechText]);

  // Show speech bubble with auto-hide
  const showSpeech = useCallback((text: string, duration = 6000) => {
    if (speechTimeout.current) clearTimeout(speechTimeout.current);
    setSpeechText(text);
    setIsAnimating(true);
    speechTimeout.current = setTimeout(() => {
      setSpeechText(null);
      setIsAnimating(false);
    }, duration);
  }, []);

  // Show idle tip periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expanded && !speechText) {
        if (Math.random() < 0.3) { // 30% chance every 45s
          showSpeech(getRandomTip("idle"), 8000);
        }
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [expanded, speechText, showSpeech]);

  // Listen for expand/collapse
  useEffect(() => {
    if (!api?.onWidgetExpanded) return;
    return api.onWidgetExpanded((_: any, isExp: boolean) => setExpanded(isExp));
  }, []);

  // Load clips when expanded
  useEffect(() => {
    if (!expanded) return;
    api?.getClips?.().then((clips: RecentClip[]) => {
      setRecentClips((clips || []).slice(0, 8));
    });
  }, [expanded]);

  // Listen for new clips — trigger Clippy reaction
  useEffect(() => {
    if (!api?.onClipNew) return;
    return api.onClipNew((clip: RecentClip) => {
      setRecentClips((prev) => [clip, ...prev].slice(0, 8));
      showSpeech(getRandomTip(clip.type || "text"), 5000);
    });
  }, [showSpeech]);

  // Listen for reply suggestions
  useEffect(() => {
    if (!api?.onReplySuggestions) return;
    return api.onReplySuggestions((data: any) => {
      if (data?.replies?.length > 0) {
        setReplies(data.replies.slice(0, 3));
        setTab("replies");
        showSpeech("Ich hab Antwort-Vorschlaege fuer dich!", 5000);
        api?.widgetToggleExpand?.();
      }
    });
  }, [showSpeech]);

  const copyToClipboard = async (text: string, id: string) => {
    await api?.writeClipboard?.(text);
    setCopied(id);
    showSpeech("Kopiert! Einfach einfuegen mit Ctrl+V", 3000);
    setTimeout(() => setCopied(null), 1500);
  };

  const onMouseEnter = () => api?.widgetMouseEnter?.();
  const onMouseLeave = () => api?.widgetMouseLeave?.();

  // === COLLAPSED STATE: Clippy character ===
  if (!expanded) {
    return (
      <div
        style={{
          width: "140px",
          height: "120px",
          position: "relative",
          WebkitAppRegion: "no-drag" as any,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Speech Bubble */}
        {speechText && (
          <div style={{
            position: "absolute",
            bottom: "100px",
            right: "10px",
            background: "#FFFFC8",
            border: "2px solid #333",
            borderRadius: "12px",
            padding: "10px 14px",
            maxWidth: "220px",
            fontSize: "12px",
            color: "#222",
            fontFamily: "'Segoe UI', 'Microsoft Sans Serif', sans-serif",
            boxShadow: "2px 2px 8px rgba(0,0,0,0.15)",
            lineHeight: 1.4,
            zIndex: 10,
          }}>
            {displayedText}
            {/* Speech bubble arrow */}
            <div style={{
              position: "absolute",
              bottom: "-10px",
              right: "30px",
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "10px solid #333",
            }} />
            <div style={{
              position: "absolute",
              bottom: "-7px",
              right: "31px",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "9px solid #FFFFC8",
            }} />
          </div>
        )}

        {/* Clippy Character — CSS animated paperclip with eyes */}
        <div
          onClick={() => api?.widgetToggleExpand?.()}
          style={{
            position: "absolute",
            bottom: 0,
            right: "8px",
            width: "80px",
            height: "100px",
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          title="Klick mich!"
        >
          {/* Paperclip body — SVG */}
          <svg
            viewBox="0 0 80 100"
            width="80"
            height="100"
            style={{
              filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.2))",
              animation: isAnimating ? "clippy-bounce 0.5s ease-in-out" : "clippy-idle 3s ease-in-out infinite",
            }}
          >
            {/* Paperclip wire body */}
            <path
              d="M 35 95 C 35 95, 15 85, 15 60 C 15 35, 25 20, 40 15 C 55 10, 65 20, 65 35 C 65 50, 55 65, 45 70 C 35 75, 28 65, 28 55 C 28 45, 35 35, 42 32"
              fill="none"
              stroke="#8B8B8B"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Shiny highlight */}
            <path
              d="M 35 95 C 35 95, 15 85, 15 60 C 15 35, 25 20, 40 15"
              fill="none"
              stroke="#C0C0C0"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Left eye */}
            <ellipse cx="36" cy="28" rx="7" ry="9" fill="white" stroke="#555" strokeWidth="1.5" />
            <ellipse
              cx="37"
              cy="29"
              rx="3.5"
              ry="4.5"
              fill="#333"
              style={{ animation: "clippy-blink 4s ease-in-out infinite" }}
            />
            <ellipse cx="38" cy="27" rx="1.5" ry="2" fill="white" />
            {/* Right eye */}
            <ellipse cx="52" cy="28" rx="7" ry="9" fill="white" stroke="#555" strokeWidth="1.5" />
            <ellipse
              cx="53"
              cy="29"
              rx="3.5"
              ry="4.5"
              fill="#333"
              style={{ animation: "clippy-blink 4s ease-in-out infinite" }}
            />
            <ellipse cx="54" cy="27" rx="1.5" ry="2" fill="white" />
            {/* Eyebrows */}
            <path d="M 30 20 Q 36 17, 42 20" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 46 20 Q 52 17, 58 20" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          {/* CSS animations */}
          <style>{`
            @keyframes clippy-idle {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes clippy-bounce {
              0% { transform: translateY(0) rotate(0deg); }
              25% { transform: translateY(-8px) rotate(-5deg); }
              50% { transform: translateY(0) rotate(0deg); }
              75% { transform: translateY(-4px) rotate(3deg); }
              100% { transform: translateY(0) rotate(0deg); }
            }
            @keyframes clippy-blink {
              0%, 45%, 55%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.1); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // === EXPANDED STATE: Clippy + Panel ===
  return (
    <div style={{
      width: "416px",
      height: "496px",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Panel */}
      <div style={{
        flex: 1,
        borderRadius: "16px",
        background: "rgba(15,15,20,0.95)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(92,124,250,0.2)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(66,99,235,0.1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header with Clippy branding */}
        <div style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📎</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#e0e0e8" }}>
              Clippy Assistent
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setTab("clips")}
              style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                background: tab === "clips" ? "rgba(66,99,235,0.2)" : "transparent",
                color: tab === "clips" ? "#91a7ff" : "#5c5c75",
                border: tab === "clips" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
                cursor: "pointer",
              }}
            >Clips</button>
            <button
              onClick={() => setTab("replies")}
              style={{
                padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                background: tab === "replies" ? "rgba(66,99,235,0.2)" : "transparent",
                color: tab === "replies" ? "#91a7ff" : "#5c5c75",
                border: tab === "replies" ? "1px solid rgba(92,124,250,0.3)" : "1px solid transparent",
                cursor: "pointer", position: "relative",
              }}
            >
              Antworten
              {replies.length > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#ef4444", border: "2px solid rgba(15,15,20,0.92)",
                }} />
              )}
            </button>
          </div>
          <button
            onClick={() => api?.widgetCollapse?.()}
            style={{
              background: "none", border: "none", color: "#5c5c75",
              cursor: "pointer", fontSize: "16px", padding: "2px 4px",
            }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {tab === "clips" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {recentClips.length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#4a4a60", fontSize: "12px" }}>
                  Noch keine Clips — kopiere etwas!
                </div>
              )}
              {recentClips.map((clip) => (
                <button
                  key={clip.id}
                  onClick={() => copyToClipboard(clip.content, clip.id)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: "10px",
                    background: copied === clip.id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                    border: copied === clip.id ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer", transition: "all 0.15s", width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, color: "#748ffc",
                      background: "rgba(76,110,245,0.12)", padding: "2px 5px",
                      borderRadius: "3px", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                    }}>
                      {clip.type === "image" ? "IMG" : clip.type === "url" ? "URL" : clip.type === "file" ? "FILE" : "T"}
                    </span>
                    <span style={{
                      fontSize: "12px", color: copied === clip.id ? "#22c55e" : "#c4c4d4",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                    }}>
                      {copied === clip.id ? "Kopiert!" : (clip.summary || clip.content?.slice(0, 60) || "...")}
                    </span>
                    <span style={{
                      fontSize: "9px", color: "#4a4a60", flexShrink: 0,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {new Date(clip.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {clip.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", marginTop: "4px", flexWrap: "wrap" }}>
                      {clip.tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{
                          fontSize: "9px", color: "#748ffc", background: "rgba(66,99,235,0.1)",
                          padding: "1px 5px", borderRadius: "10px",
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {tab === "replies" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {replies.length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center", color: "#4a4a60", fontSize: "12px" }}>
                  Kopiere eine Nachricht — ich schlage dir Antworten vor!
                </div>
              )}
              {replies.map((r) => (
                <button
                  key={r.id}
                  onClick={() => copyToClipboard(r.text, r.id)}
                  style={{
                    textAlign: "left", padding: "12px 14px", borderRadius: "10px",
                    background: copied === r.id ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, rgba(66,99,235,0.08), rgba(168,85,247,0.05))",
                    border: copied === r.id ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(92,124,250,0.15)",
                    cursor: "pointer", transition: "all 0.15s", width: "100%",
                  }}
                >
                  <div style={{
                    fontSize: "9px", fontWeight: 700, color: "#748ffc",
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px",
                  }}>{r.tone}</div>
                  <div style={{
                    fontSize: "12px", color: copied === r.id ? "#22c55e" : "#c4c4d4", lineHeight: 1.5,
                  }}>
                    {copied === r.id ? "Kopiert!" : r.text}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "10px", color: "#4a4a60" }}>Ctrl+Shift+V Quick Panel</span>
          <span style={{ fontSize: "10px", color: "#4a4a60" }}>Ctrl+Shift+R Antworten</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update App.tsx to use ClippyAssistant**

In `apps/desktop/src/renderer/App.tsx`:
- Change import from `FloatingWidget` to `ClippyAssistant`
- Change the render line from `<FloatingWidget />` to `<ClippyAssistant />`

**Step 3: Build and verify**

Run: `cd apps/desktop && pnpm build`

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/views/ClippyAssistant.tsx apps/desktop/src/renderer/App.tsx
git commit -m "feat: replace floating widget with Clippy AI assistant"
```

---

### Task 6: Update Settings + Tray for Clippy

**Files:**
- Modify: `apps/desktop/src/renderer/views/SettingsView.tsx`
- Modify: `apps/desktop/src/main/tray.ts`

**Step 1: Update settings label**

In `SettingsView.tsx`, find the floating widget toggle and change:
- Label: `"Floating Widget"` → `"Clippy Assistent"`
- Description: `"Schwebendes Panel unten links..."` → `"Clippy Bueroklammen-Assistent unten rechts"`

**Step 2: Update tray label**

In `tray.ts`, change:
- `"Floating Widget"` → `"Clippy Assistent"`

**Step 3: Build and verify**

Run: `cd apps/desktop && pnpm build`

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/views/SettingsView.tsx apps/desktop/src/main/tray.ts
git commit -m "chore: rename Floating Widget to Clippy Assistent in settings and tray"
```

---

## Phase 4: Final cleanup

### Task 7: Remove old FloatingWidget.tsx

**Files:**
- Delete: `apps/desktop/src/renderer/views/FloatingWidget.tsx`

**Step 1: Delete file**

```bash
rm apps/desktop/src/renderer/views/FloatingWidget.tsx
```

**Step 2: Verify no remaining imports**

```bash
grep -r "FloatingWidget" apps/desktop/src/ --include="*.ts" --include="*.tsx"
```

Expected: No results (all references now point to ClippyAssistant).

**Step 3: Build and verify**

Run: `cd apps/desktop && pnpm build`

**Step 4: Commit**

```bash
git add -A apps/desktop/src/renderer/views/FloatingWidget.tsx
git commit -m "chore: remove old FloatingWidget component (replaced by ClippyAssistant)"
```

---

### Task 8: Final build test + commit all together

**Step 1: Full clean build**

```bash
cd /root/workspace/ghostclip
pnpm --filter @ghostclip/shared build
pnpm --filter @ghostclip/crypto build
pnpm --filter @ghostclip/ai-client build
cd apps/desktop && pnpm build
```

Expected: All builds succeed, no errors.

**Step 2: Verify the result**

- Clippy appears bottom-right (not bottom-left)
- Quick Panel opens reliably (no Windows transparency issues)
- Reply Panel works cross-platform
- Settings show "Clippy Assistent" toggle
- Tray shows "Clippy Assistent"

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Fix Quick Panel Windows | `quick-panel.ts` |
| 2 | Fix Reply Panel Windows + cross-platform | `reply-panel.ts` |
| 3 | Add Clippy sprite assets | `clippy-data.ts`, `clippy-map.png` |
| 4 | Refactor widget → bottom-right + Clippy size | `floating-widget.ts` |
| 5 | Build ClippyAssistant component | `ClippyAssistant.tsx`, `App.tsx` |
| 6 | Update Settings + Tray labels | `SettingsView.tsx`, `tray.ts` |
| 7 | Remove old FloatingWidget | `FloatingWidget.tsx` |
| 8 | Final build verification | all |
