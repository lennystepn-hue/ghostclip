import React, { useState, useEffect } from "react";
import { CONTENT_KIND_LABELS, type ContentKind } from "@ghostclip/shared";
import { extractVariables } from "@ghostclip/shared";

// Content kinds that have auto-actions (excludes text/url which are base types)
const AUTO_ACTION_KINDS: ContentKind[] = [
  "error_message",
  "code_snippet",
  "phone_number",
  "address",
  "json",
  "xml",
  "color_hex",
  "cron_expression",
  "regex_pattern",
  "datetime",
];

interface SettingsState {
  clipboardWatcher: boolean;
  notifications: boolean;
  screenContext: boolean;
  autoExpireSensitive: boolean;
  autostart: boolean;
  floatingWidget: boolean;
  aiModel: string;
  toastEnabled: boolean;
  toastPosition: string;
  toastDuration: string;
  toastFilter: string;
  quietMode: boolean;
  autoActionsEnabled: boolean;
  predictive_paste: boolean;
  [key: string]: any;
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  useCount: number;
  createdAt: string;
}

const TEMPLATE_CATEGORIES = ["Allgemein", "Email", "Code", "Support"];

interface Rule {
  id: string;
  name: string;
  conditionType: string;
  conditionValue: string;
  actionType: string;
  actionValue: string;
  enabled: boolean;
  createdAt: string;
}

const CONDITION_TYPES = [
  { value: "contains", label: "Contains text" },
  { value: "regex", label: "Matches regex" },
  { value: "source_app", label: "From app" },
  { value: "content_type", label: "Content type" },
  { value: "sensitivity", label: "Sensitivity detected" },
];

const ACTION_TYPES = [
  { value: "auto_tag", label: "Auto-tag" },
  { value: "auto_pin", label: "Auto-pin" },
  { value: "auto_collection", label: "Add to collection" },
  { value: "auto_archive", label: "Auto-archive" },
  { value: "auto_expire", label: "Auto-expire (5 min)" },
];

const CONTENT_TYPE_OPTIONS = ["text", "url", "image", "file"];

/** Test a rule's condition against a text string (client-side preview) */
function testRuleCondition(rule: Rule, text: string): boolean {
  switch (rule.conditionType) {
    case "contains":
      return text.toLowerCase().includes(rule.conditionValue.toLowerCase());
    case "regex":
      try {
        return new RegExp(rule.conditionValue, "i").test(text);
      } catch {
        return false;
      }
    case "source_app":
      // Can't test source app without an actual clipboard event — always false in tester
      return false;
    case "content_type": {
      const isUrl = /^https?:\/\//i.test(text.trim());
      const isFilePath = /^(\/|[A-Z]:\\|~\/)/.test(text.trim()) && !text.trim().includes("\n");
      if (rule.conditionValue === "url") return isUrl;
      if (rule.conditionValue === "file") return isFilePath;
      if (rule.conditionValue === "text") return !isUrl && !isFilePath;
      return false;
    }
    case "sensitivity": {
      const keywords = ["password", "token", "secret", "api_key", "apikey", "passwd", "private_key"];
      return keywords.some(k => text.toLowerCase().includes(k));
    }
    default:
      return false;
  }
}

const SHORTCUTS = [
  { keys: "Ctrl+Shift+V", action: "Quick Panel oeffnen" },
  { keys: "Ctrl+Shift+R", action: "Reply-Vorschlaege (markierten Text)" },
  { keys: "Ctrl+Shift+F", action: "Semantische Suche" },
  { keys: "Ctrl+Shift+P", action: "Letzten Clip pinnen" },
  { keys: "Ctrl+Shift+S", action: "Screen Context Toggle" },
  { keys: "Ctrl+Shift+T", action: "Template-Picker oeffnen" },
];

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsState>({
    clipboardWatcher: true,
    notifications: true,
    screenContext: false,
    autoExpireSensitive: true,
    autostart: true,
    floatingWidget: true,
    aiModel: "claude-sonnet-4-6",
    toastEnabled: true,
    toastPosition: "bottom-right",
    toastDuration: "2",
    toastFilter: "all",
    quietMode: false,
    autoActionsEnabled: true,
    predictive_paste: true,
  });
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateStatus, setTemplateStatus] = useState("");
  // null = create mode, Template = edit mode
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: "", content: "", category: "Allgemein" });
  const [saving, setSaving] = useState(false);

  // Clipboard Rules state
  const [rules, setRules] = useState<Rule[]>([]);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    conditionType: "contains",
    conditionValue: "",
    actionType: "auto_tag",
    actionValue: "",
  });
  const [ruleStatus, setRuleStatus] = useState("");
  const [testText, setTestText] = useState("");
  const [showRuleTester, setShowRuleTester] = useState(false);

  const api = (window as any).ghostclip;

  useEffect(() => {
    Promise.all([
      api?.getSettings?.().catch(() => null),
      api?.getRules?.().catch(() => []),
      api?.getTemplates?.().catch(() => []),
    ]).then(([s, r, tmpl]) => {
      if (s) {
        // Build per-kind enabled flags from stored settings
        const kindFlags: Record<string, boolean> = {};
        for (const kind of AUTO_ACTION_KINDS) {
          kindFlags[`autoAction_${kind}`] = s[`autoAction_${kind}`] !== "false";
        }
        setSettings({
          clipboardWatcher: s.clipboardWatcher !== "false",
          notifications: s.notifications !== "false",
          screenContext: s.screenContext === "true",
          autoExpireSensitive: s.autoExpireSensitive !== "false",
          autostart: s.autostart !== "false",
          floatingWidget: s.floatingWidget !== "false",
          aiModel: s.aiModel || "claude-sonnet-4-6",
          toastEnabled: s.toastEnabled !== "false",
          toastPosition: s.toastPosition || "bottom-right",
          toastDuration: s.toastDuration || "2",
          toastFilter: s.toastFilter || "all",
          quietMode: s.quietMode === "true",
          autoActionsEnabled: s.autoActionsEnabled !== "false",
          predictive_paste: s.predictive_paste !== "false",
          ...kindFlags,
        });
      }
      if (r) setRules(r);
      if (tmpl) setTemplates(tmpl);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const toggle = async (key: string) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    await api?.updateSetting?.(key, String(newVal));
  };

  const updateSelect = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await api?.updateSetting?.(key, value);
  };

  const handleClearAll = async () => {
    if (clearing) return;
    if (!confirm("ACHTUNG: Alle Clips unwiderruflich loeschen?")) return;
    setClearing(true);
    await api?.clearAllClips?.();
    setClearing(false);
  };

  const handleCreateRule = async () => {
    const noValueAction = ["auto_pin", "auto_archive", "auto_expire"].includes(newRule.actionType);
    const effectiveActionValue = noValueAction ? newRule.actionType : newRule.actionValue.trim();
    if (!newRule.name.trim() || !newRule.conditionValue.trim() || (!noValueAction && !newRule.actionValue.trim())) {
      setRuleStatus("Please fill in all fields.");
      return;
    }
    const created = await api?.createRule?.(
      newRule.name.trim(),
      newRule.conditionType,
      newRule.conditionValue.trim(),
      newRule.actionType,
      effectiveActionValue,
    );
    if (created) {
      const updated = await api?.getRules?.() || [];
      setRules(updated);
      setNewRule({ name: "", conditionType: "contains", conditionValue: "", actionType: "auto_tag", actionValue: "" });
      setShowRuleBuilder(false);
      setRuleStatus("Rule created.");
      setTimeout(() => setRuleStatus(""), 3000);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await api?.deleteRule?.(id);
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleRule = async (id: string) => {
    await api?.toggleRule?.(id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleExportRules = () => {
    const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), rules }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ghostclip-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setRuleStatus(`${rules.length} rules exported.`);
    setTimeout(() => setRuleStatus(""), 3000);
  };

  const handleImportRules = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const importedRules: any[] = data.rules || [];
        if (!importedRules.length) {
          setRuleStatus("No rules found in file.");
          return;
        }
        let created = 0;
        for (const r of importedRules) {
          if (r.conditionType && r.conditionValue && r.actionType && r.actionValue) {
            await api?.createRule?.(r.name || "Imported rule", r.conditionType, r.conditionValue, r.actionType, r.actionValue);
            created++;
          }
        }
        const updated = await api?.getRules?.() || [];
        setRules(updated);
        setRuleStatus(`${created} of ${importedRules.length} rules imported.`);
        setTimeout(() => setRuleStatus(""), 4000);
      } catch {
        setRuleStatus("Import failed — invalid file.");
      }
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      setExportStatus("Exportiere...");
      const clips = await api?.getClips?.() || [];
      const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), clips }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ghostclip-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus(`${clips.length} Clips exportiert!`);
      setTimeout(() => setExportStatus(""), 3000);
    } catch {
      setExportStatus("Export fehlgeschlagen");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setExportStatus("Importiere...");
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.clips?.length) {
          setExportStatus("Keine Clips in Datei gefunden");
          return;
        }
        const imported = await api?.importClips?.(data.clips) || 0;
        setExportStatus(`${imported} von ${data.clips.length} Clips importiert!`);
        setTimeout(() => setExportStatus(""), 4000);
      } catch {
        setExportStatus("Import fehlgeschlagen — ungueltige Datei");
      }
    };
    input.click();
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: "", content: "", category: "Allgemein" });
    setShowTemplateForm(true);
  };

  const openEditTemplate = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setTemplateForm({ name: tmpl.name, content: tmpl.content, category: tmpl.category });
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async () => {
    if (saving) return;
    const { name, content, category } = templateForm;
    if (!name.trim() || !content.trim()) {
      setTemplateStatus("Name and content are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingTemplate) {
        await api?.updateTemplate?.(editingTemplate.id, name.trim(), content.trim(), category);
      } else {
        await api?.createTemplate?.(name.trim(), content.trim(), category);
      }
      const updated = await api?.getTemplates?.() || [];
      setTemplates(updated);
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setTemplateForm({ name: "", content: "", category: "Allgemein" });
      setTemplateStatus(editingTemplate ? "Template updated." : "Template created.");
      setTimeout(() => setTemplateStatus(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await api?.deleteTemplate?.(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Filter templates by search query
  const filteredTemplates = templateSearch
    ? templates.filter(t =>
        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.content.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(templateSearch.toLowerCase()),
      )
    : templates;

  if (loading) return <div style={{ padding: "40px", color: "#5c5c75", textAlign: "center" }}>Laden...</div>;

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Allgemein */}
      <h2 style={sectionTitle}>Allgemein</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle label="Clipboard Watcher" description="Ueberwacht die Zwischenablage automatisch"
          checked={settings.clipboardWatcher} onChange={() => toggle("clipboardWatcher")} />
        <SettingToggle label="Benachrichtigungen" description="Desktop-Benachrichtigungen bei neuen Clips"
          checked={settings.notifications} onChange={() => toggle("notifications")} />
        <SettingToggle label="Autostart" description="GhostClip beim Systemstart automatisch starten"
          checked={settings.autostart} onChange={() => toggle("autostart")} />
        <SettingToggle label="Floating Widget" description="Schwebendes Panel unten links fuer schnellen Zugriff"
          checked={settings.floatingWidget} onChange={() => toggle("floatingWidget")} />
      </div>

      {/* Privacy */}
      <h2 style={sectionTitle}>Privacy</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle label="Screen Context" description="Bildschirmkontext fuer bessere Vorschlaege (opt-in)"
          checked={settings.screenContext} onChange={() => toggle("screenContext")} />
        <SettingToggle label="Sensible Daten automatisch loeschen"
          description="Passwoerter und Tokens nach 5 Minuten entfernen"
          checked={settings.autoExpireSensitive} onChange={() => toggle("autoExpireSensitive")} />
        <SettingToggle label="Predictive Paste"
          description="Learn your copy-paste patterns and predict what you need next (all data stays local)"
          checked={settings.predictive_paste} onChange={() => toggle("predictive_paste")} />
      </div>

      {/* Toast Notifications */}
      <h2 style={sectionTitle}>Toast Notifications</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle label="Capture Toast" description="Show a small toast when GhostClip captures a clip"
          checked={settings.toastEnabled} onChange={() => toggle("toastEnabled")} />
        <SettingToggle label="Quiet Mode" description="Suppress toasts during presentations or focus sessions"
          checked={settings.quietMode} onChange={() => toggle("quietMode")} />
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>Position</p>
            <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>Where toasts appear on screen</p>
          </div>
          <select
            value={settings.toastPosition}
            onChange={(e) => updateSelect("toastPosition", e.target.value)}
            style={selectStyle}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>Duration</p>
            <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>How long toasts stay visible</p>
          </div>
          <select
            value={settings.toastDuration}
            onChange={(e) => updateSelect("toastDuration", e.target.value)}
            style={selectStyle}
          >
            <option value="1">1 second</option>
            <option value="2">2 seconds</option>
            <option value="3">3 seconds</option>
          </select>
        </div>
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>Show for</p>
            <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>Which clip types trigger a toast</p>
          </div>
          <select
            value={settings.toastFilter}
            onChange={(e) => updateSelect("toastFilter", e.target.value)}
            style={selectStyle}
          >
            <option value="all">All clips</option>
            <option value="url">URLs only</option>
            <option value="image">Images only</option>
            <option value="text">Text only</option>
          </select>
        </div>
      </div>

      {/* AI Model */}
      <h2 style={sectionTitle}>AI</h2>
      <div style={{ ...cardStyle, marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>Aktives Modell</p>
          <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>Enrichment: Haiku 4.5 | Chat: Sonnet 4.6</p>
        </div>
        <span style={{
          fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: "#91a7ff",
          background: "rgba(66,99,235,0.12)", border: "1px solid rgba(66,99,235,0.15)",
          padding: "4px 10px", borderRadius: "6px",
        }}>Claude AI</span>
      </div>

      {/* AI Auto-Actions */}
      <h2 style={sectionTitle}>AI Auto-Actions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        <SettingToggle
          label="Enable Auto-Actions"
          description="Show context-aware suggestions when you copy specific content types"
          checked={settings.autoActionsEnabled}
          onChange={() => toggle("autoActionsEnabled")}
        />

        {/* Per-kind toggles */}
        {settings.autoActionsEnabled && (
          <div style={{ ...cardStyle, paddingTop: "14px", paddingBottom: "14px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e8", marginBottom: "10px" }}>
              Enable per content type
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {AUTO_ACTION_KINDS.map((kind) => {
                const key = `autoAction_${kind}`;
                const enabled = settings[key] !== false;
                return (
                  <div key={kind} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ fontSize: "12px", color: "#c4c4d4" }}>
                      {CONTENT_KIND_LABELS[kind]}
                    </span>
                    <button onClick={() => {
                      const newVal = !enabled;
                      setSettings(prev => ({ ...prev, [key]: newVal }));
                      api?.updateSetting?.(key, String(newVal));
                    }} style={{
                      width: "36px", height: "18px", borderRadius: "9px", border: "none",
                      background: enabled ? "#4263eb" : "rgba(255,255,255,0.1)", cursor: "pointer",
                      position: "relative", flexShrink: 0,
                    }}>
                      <span style={{
                        position: "absolute", top: "2px", left: enabled ? "19px" : "2px",
                        width: "14px", height: "14px", borderRadius: "50%", background: "white",
                        transition: "left 0.2s",
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Templates */}
      <h2 style={{ ...sectionTitle, justifyContent: "space-between" }}>
        <span>Templates</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={showTemplateForm && !editingTemplate
              ? () => { setShowTemplateForm(false); }
              : openCreateTemplate}
            style={{ ...smallBtn, color: "#91a7ff" }}
          >
            {showTemplateForm && !editingTemplate ? "Cancel" : "+ New Template"}
          </button>
        </div>
      </h2>

      {/* Template search */}
      <div style={{ marginBottom: "10px" }}>
        <input
          placeholder="Search templates..."
          value={templateSearch}
          onChange={e => setTemplateSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 0 }}
        />
      </div>

      {/* Template create/edit form */}
      {showTemplateForm && (
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e8", marginBottom: "12px" }}>
            {editingTemplate ? "Edit Template" : "New Template"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              placeholder="Template name (e.g. Email Greeting)"
              value={templateForm.name}
              onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
              style={inputStyle}
            />
            <select
              value={templateForm.category}
              onChange={e => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
              style={selectStyle}
            >
              {TEMPLATE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <textarea
              placeholder={"Template text with {variables}\ne.g. Hello {name}, thanks for your message about {topic}."}
              value={templateForm.content}
              onChange={e => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
              rows={5}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "'JetBrains Mono', monospace" }}
            />
            {/* Live variable detection */}
            {templateForm.content && (() => {
              const vars = extractVariables(templateForm.content);
              if (vars.length === 0) return null;
              return (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#5c5c75" }}>Detected variables:</span>
                  {vars.map(v => (
                    <span key={v} style={{
                      fontSize: "11px", fontFamily: "'JetBrains Mono', monospace",
                      color: "#748ffc", background: "rgba(66,99,235,0.1)",
                      border: "1px solid rgba(66,99,235,0.15)", padding: "1px 6px", borderRadius: "4px",
                    }}>{`{${v}}`}</span>
                  ))}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleSaveTemplate} style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: "rgba(66,99,235,0.2)", border: "1px solid rgba(66,99,235,0.3)", color: "#748ffc",
              }}>{editingTemplate ? "Update Template" : "Save Template"}</button>
              <button onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} style={{
                padding: "8px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#5c5c75",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
        {filteredTemplates.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center" as const, padding: "20px" }}>
            <p style={{ fontSize: "12px", color: "#5c5c75" }}>
              {templates.length === 0
                ? 'No templates yet. Click "+ New Template" to create one.'
                : "No templates match your search."}
            </p>
          </div>
        ) : (
          filteredTemplates.map(tmpl => {
            const vars = extractVariables(tmpl.content);
            return (
              <div key={tmpl.id} style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e8" }}>{tmpl.name}</p>
                    <span style={{
                      fontSize: "10px", color: "#5c5c75",
                      background: "rgba(255,255,255,0.04)", padding: "1px 6px", borderRadius: "10px",
                    }}>{tmpl.category}</span>
                    {tmpl.useCount > 0 && (
                      <span style={{ fontSize: "10px", color: "#5c5c75", marginLeft: "auto" }}>
                        {tmpl.useCount}× used
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: "11px", color: "#5c5c75", marginBottom: vars.length > 0 ? "4px" : 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                  }}>
                    {tmpl.content.slice(0, 80)}{tmpl.content.length > 80 ? "…" : ""}
                  </p>
                  {vars.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {vars.map(v => (
                        <span key={v} style={{
                          fontSize: "10px", fontFamily: "'JetBrains Mono', monospace",
                          color: "#748ffc", background: "rgba(66,99,235,0.1)",
                          border: "1px solid rgba(66,99,235,0.15)", padding: "1px 5px", borderRadius: "4px",
                        }}>{`{${v}}`}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => openEditTemplate(tmpl)}
                    style={{ ...smallBtn, color: "#748ffc" }}
                    title="Edit"
                  >Edit</button>
                  <button
                    onClick={() => handleDeleteTemplate(tmpl.id)}
                    style={{
                      background: "none", border: "none", color: "#ef444480",
                      cursor: "pointer", fontSize: "14px", padding: "2px 4px",
                    }}
                    title="Delete"
                  >✕</button>
                </div>
              </div>
            );
          })
        )}
        {templateStatus && (
          <p style={{ fontSize: "11px", color: "#91a7ff" }}>{templateStatus}</p>
        )}
      </div>

      {/* Clipboard Rules */}
      <h2 style={{ ...sectionTitle, justifyContent: "space-between" }}>
        <span>Clipboard Rules</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setShowRuleTester(!showRuleTester)} style={smallBtn}>
            {showRuleTester ? "Hide Tester" : "Test Rules"}
          </button>
          <button onClick={handleImportRules} style={smallBtn}>Import</button>
          <button onClick={handleExportRules} style={{ ...smallBtn, color: "#748ffc" }}>Export</button>
          <button onClick={() => setShowRuleBuilder(!showRuleBuilder)} style={{ ...smallBtn, color: "#91a7ff" }}>
            {showRuleBuilder ? "Cancel" : "+ Add Rule"}
          </button>
        </div>
      </h2>

      {/* Rule Builder */}
      {showRuleBuilder && (
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e8", marginBottom: "12px" }}>New Rule</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              placeholder="Rule name (e.g. Tag Jira tickets)"
              value={newRule.name}
              onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#748ffc", fontWeight: 600, minWidth: "20px" }}>IF</span>
              <select
                value={newRule.conditionType}
                onChange={e => {
                  const ct = e.target.value;
                  // Sensitivity has no user-defined value — use a placeholder
                  setNewRule(prev => ({
                    ...prev,
                    conditionType: ct,
                    conditionValue: ct === "sensitivity" ? "auto" : "",
                  }));
                }}
                style={selectStyle}
              >
                {CONDITION_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
              {newRule.conditionType === "content_type" ? (
                <select
                  value={newRule.conditionValue}
                  onChange={e => setNewRule(prev => ({ ...prev, conditionValue: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="">Pick type…</option>
                  {CONTENT_TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder={
                    newRule.conditionType === "contains" ? "text to match" :
                    newRule.conditionType === "regex" ? "/PROD-\\d+/" :
                    newRule.conditionType === "source_app" ? "VS Code" :
                    newRule.conditionType === "sensitivity" ? "any (auto-detected)" : "value"
                  }
                  value={newRule.conditionValue}
                  onChange={e => setNewRule(prev => ({ ...prev, conditionValue: e.target.value }))}
                  style={inputStyle}
                  disabled={newRule.conditionType === "sensitivity"}
                />
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "#748ffc", fontWeight: 600, minWidth: "20px" }}>THEN</span>
              <select
                value={newRule.actionType}
                onChange={e => setNewRule(prev => ({ ...prev, actionType: e.target.value }))}
                style={selectStyle}
              >
                {ACTION_TYPES.map(at => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
              <input
                placeholder={
                  newRule.actionType === "auto_tag" ? "tag name" :
                  newRule.actionType === "auto_collection" ? "collection name" :
                  newRule.actionType === "auto_pin" || newRule.actionType === "auto_archive" || newRule.actionType === "auto_expire" ? "(no value needed)" :
                  "value"
                }
                value={newRule.actionValue}
                onChange={e => setNewRule(prev => ({ ...prev, actionValue: e.target.value }))}
                style={inputStyle}
                disabled={["auto_pin", "auto_archive", "auto_expire"].includes(newRule.actionType)}
              />
            </div>
            <button onClick={handleCreateRule} style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: "rgba(66,99,235,0.2)", border: "1px solid rgba(66,99,235,0.3)", color: "#748ffc",
              alignSelf: "flex-start",
            }}>Save Rule</button>
          </div>
        </div>
      )}

      {/* Rule Tester */}
      {showRuleTester && (
        <div style={{ ...cardStyle, marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e8", marginBottom: "8px" }}>
            Rule Tester — paste text to see which rules would fire
          </p>
          <textarea
            placeholder="Paste text here to test rules..."
            value={testText}
            onChange={e => setTestText(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'JetBrains Mono', monospace" }}
          />
          {testText && rules.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              {(() => {
                const matching = rules.filter(r => r.enabled && testRuleCondition(r, testText));
                const skipped = rules.filter(r => r.enabled && !testRuleCondition(r, testText));
                return (
                  <>
                    {matching.length === 0 ? (
                      <p style={{ fontSize: "11px", color: "#5c5c75" }}>No enabled rules match this text.</p>
                    ) : (
                      <>
                        <p style={{ fontSize: "11px", color: "#51cf66", marginBottom: "4px" }}>
                          {matching.length} rule{matching.length !== 1 ? "s" : ""} would fire:
                        </p>
                        {matching.map(r => (
                          <div key={r.id} style={{ fontSize: "11px", color: "#c4c4d4", marginBottom: "2px" }}>
                            ✓ <strong>{r.name}</strong> → {ACTION_TYPES.find(a => a.value === r.actionType)?.label}
                            {r.actionValue && `: "${r.actionValue}"`}
                          </div>
                        ))}
                      </>
                    )}
                    {skipped.length > 0 && (
                      <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "4px" }}>
                        {skipped.length} enabled rule{skipped.length !== 1 ? "s" : ""} did not match.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          {testText && rules.filter(r => r.enabled).length === 0 && (
            <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "8px" }}>No enabled rules to test against.</p>
          )}
        </div>
      )}

      {/* Rules List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
        {rules.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center" as const, padding: "20px" }}>
            <p style={{ fontSize: "12px", color: "#5c5c75" }}>No rules yet. Click "+ Add Rule" to create one.</p>
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} style={{
              ...cardStyle,
              display: "flex", alignItems: "center", gap: "10px",
              opacity: rule.enabled ? 1 : 0.5,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#e0e0e8", marginBottom: "2px" }}>{rule.name}</p>
                <p style={{ fontSize: "11px", color: "#5c5c75", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  <span style={{ color: "#748ffc" }}>IF</span>{" "}
                  {CONDITION_TYPES.find(c => c.value === rule.conditionType)?.label}{" "}
                  {rule.conditionType !== "sensitivity" && <code style={{ fontFamily: "'JetBrains Mono', monospace", background: "rgba(255,255,255,0.06)", padding: "1px 4px", borderRadius: "3px" }}>{rule.conditionValue}</code>}{" "}
                  <span style={{ color: "#748ffc" }}>THEN</span>{" "}
                  {ACTION_TYPES.find(a => a.value === rule.actionType)?.label}
                  {rule.actionValue && ` "${rule.actionValue}"`}
                </p>
              </div>
              {/* Enable/disable toggle */}
              <button onClick={() => handleToggleRule(rule.id)} style={{
                width: "36px", height: "18px", borderRadius: "9px", border: "none",
                background: rule.enabled ? "#4263eb" : "rgba(255,255,255,0.1)", cursor: "pointer",
                position: "relative", flexShrink: 0,
              }}>
                <span style={{
                  position: "absolute", top: "2px", left: rule.enabled ? "19px" : "2px",
                  width: "14px", height: "14px", borderRadius: "50%", background: "white", transition: "left 0.2s",
                }} />
              </button>
              {/* Delete */}
              <button onClick={() => handleDeleteRule(rule.id)} style={{
                background: "none", border: "none", color: "#ef444480", cursor: "pointer",
                fontSize: "14px", padding: "2px 4px", flexShrink: 0,
              }} title="Delete rule">✕</button>
            </div>
          ))
        )}
        {ruleStatus && (
          <p style={{ fontSize: "11px", color: "#91a7ff" }}>{ruleStatus}</p>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <h2 style={sectionTitle}>
        <span>Tastenkombinationen</span>
        <button onClick={() => setShowShortcuts(!showShortcuts)} style={{
          background: "none", border: "none", color: "#748ffc", fontSize: "11px", cursor: "pointer", marginLeft: "8px",
        }}>{showShortcuts ? "Ausblenden" : "Anzeigen"}</button>
      </h2>
      {showShortcuts && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "28px" }}>
          {SHORTCUTS.map(s => (
            <div key={s.keys} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#c4c4d4" }}>{s.action}</span>
              <kbd style={{
                fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#e0e0e8",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                padding: "3px 8px", borderRadius: "4px",
              }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      )}

      {/* Export / Import */}
      <h2 style={sectionTitle}>Daten</h2>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button onClick={handleExport} style={{
          flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          background: "rgba(66,99,235,0.1)", border: "1px solid rgba(66,99,235,0.2)", color: "#748ffc",
        }}>Clips exportieren (JSON)</button>
        <button onClick={handleImport} style={{
          flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#8888a0",
        }}>Clips importieren</button>
      </div>
      {exportStatus && (
        <p style={{ fontSize: "11px", color: "#91a7ff", marginBottom: "20px" }}>{exportStatus}</p>
      )}

      {/* Danger Zone */}
      <h2 style={{ ...sectionTitle, color: "#ef4444" }}>Danger Zone</h2>
      <div style={{
        padding: "16px", borderRadius: "12px",
        background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
      }}>
        <p style={{ fontSize: "12px", color: "#c4c4d4", marginBottom: "12px" }}>
          Alle gespeicherten Clips unwiderruflich loeschen. Diese Aktion kann nicht rueckgaengig gemacht werden.
        </p>
        <button onClick={handleClearAll} disabled={clearing} style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
          padding: "8px 16px", borderRadius: "8px", fontSize: "12px",
          cursor: clearing ? "not-allowed" : "pointer", fontWeight: 600, opacity: clearing ? 0.5 : 1,
        }}>{clearing ? "Loesche..." : "Alle Clips loeschen"}</button>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "16px", fontWeight: 600, color: "#e0e0e8", marginBottom: "16px",
  display: "flex", alignItems: "center",
};

const cardStyle: React.CSSProperties = {
  padding: "12px 16px", borderRadius: "12px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.05)",
};

const smallBtn: React.CSSProperties = {
  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8888a0",
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: "7px 10px", borderRadius: "8px", fontSize: "12px",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#e0e0e8", outline: "none", width: "100%",
};

const selectStyle: React.CSSProperties = {
  padding: "7px 10px", borderRadius: "8px", fontSize: "12px",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#e0e0e8", outline: "none", cursor: "pointer",
};

function SettingToggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e8" }}>{label}</p>
        <p style={{ fontSize: "11px", color: "#5c5c75", marginTop: "2px" }}>{description}</p>
      </div>
      <button onClick={onChange} style={{
        width: "40px", height: "20px", borderRadius: "10px", border: "none",
        background: checked ? "#4263eb" : "rgba(255,255,255,0.1)", cursor: "pointer",
        position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: "12px",
      }}>
        <span style={{
          position: "absolute", top: "2px", left: checked ? "22px" : "2px",
          width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
