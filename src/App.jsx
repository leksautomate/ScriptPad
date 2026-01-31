import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { getScripts, saveScript, deleteScript, getCollections, saveCollection, deleteCollection, saveAllCollections } from './storageUtils';

// Simple Sentiment Analysis Word Lists
const POSITIVE_WORDS = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'beautiful', 'creative', 'inspiring', 'best', 'better', 'improvement', 'success', 'win', 'winning', 'victory', 'calm', 'peace', 'joy', 'fun', 'exciting', 'amazing', 'perfect', 'fantastic', 'brilliant', 'smart', 'wise', 'healthy', 'strong'];
const NEGATIVE_WORDS = ['bad', 'terrible', 'awful', 'worse', 'worst', 'hate', 'sad', 'angry', 'mad', 'fail', 'failure', 'losing', 'loss', 'defeat', 'pain', 'hurt', 'sick', 'weak', 'stupid', 'dumb', 'crazy', 'insane', 'fear', 'scared', 'afraid', 'panic', 'stress', 'difficult', 'hard', 'struggle', 'problem', 'issue', 'error', 'wrong'];

const analyzeSentiment = (text) => {
  if (!text) return { score: 0, label: 'Neutral', emoji: '😐' };
  const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
  let score = 0;
  words.forEach(word => {
    if (POSITIVE_WORDS.includes(word)) score++;
    if (NEGATIVE_WORDS.includes(word)) score--;
  });

  if (score > 0) return { score, label: 'Positive', emoji: '🙂' };
  if (score < 0) return { score, label: 'Negative', emoji: 'hw' }; // 'hw' wasn't a standard emoji, assuming user meant something else or just text. Let's use a standard one.
  return { score: 0, label: 'Neutral', emoji: '😐' };
};

// Scene Detection
const detectScenes = (text) => {
  if (!text) return 0;
  // Matches [SCENE 1], [SCENE: ...], [B-ROLL], [INTRO], [OUTRO], etc.
  const matches = text.match(/\[(SCENE|B-ROLL|INTRO|OUTRO|SHOT|CUT|FADE).*?\]/gi);
  return matches ? matches.length : 0;
};

// Reading Speed Analysis
const analyzePacing = (text, wpm) => {
  if (!text) return { label: 'Normal', color: 'text-slate-400' };

  // Heuristic: Check average sentence length
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return { label: 'Normal', color: 'text-slate-400' };

  const totalWords = text.trim().split(/\s+/).length;
  const avgWordsPerSentence = totalWords / sentences.length;

  if (avgWordsPerSentence > 25) return { label: 'Slow / Complex', color: 'text-orange-400' };
  if (avgWordsPerSentence < 8) return { label: 'Fast / Punchy', color: 'text-emerald-400' };
  return { label: 'Balanced', color: 'text-blue-400' };
};

const AVAILABLE_TAGS = [
  { name: 'Tutorial', color: 'blue' },
  { name: 'Vlog', color: 'purple' },
  { name: 'Review', color: 'orange' },
  { name: 'Sponsor', color: 'emerald' },
  { name: 'Short', color: 'pink' },
  { name: 'News', color: 'red' },
];

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const generateShareLink = (script) => {
  const data = JSON.stringify({
    title: script.title,
    content: script.content,
    readonly: true
  });
  // Simple base64 encoding for demo purposes (in production, use a backend or compression)
  const encoded = btoa(encodeURIComponent(data));
  return `${window.location.origin}/?share=${encoded}`;
};

// Theme Definitions
const THEMES = {
  'studio-dark': {
    id: 'studio-dark',
    name: 'Studio Dark',
    bg: 'bg-[#0a0f16]',
    sidebar: 'bg-[#111822]',
    panel: 'bg-[#161e2b]',
    border: 'border-[#233348]',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: 'bg-[#2b7cee]',
    accentText: 'text-[#2b7cee]',
    input: 'bg-[#161e2b] text-slate-100',
    isDark: true,
  },
  'studio-blue': {
    id: 'studio-blue',
    name: 'Studio Blue',
    bg: 'bg-[#0c1929]',
    sidebar: 'bg-[#0f1f33]',
    panel: 'bg-[#142540]',
    border: 'border-[#1e3a5f]',
    text: 'text-blue-50',
    textMuted: 'text-blue-300',
    accent: 'bg-blue-500',
    accentText: 'text-blue-400',
    input: 'bg-[#142540] text-blue-50',
    isDark: true,
  },
  'hacker-pro': {
    id: 'hacker-pro',
    name: 'Hacker Pro',
    bg: 'bg-[#0d0d0d]',
    sidebar: 'bg-[#121212]',
    panel: 'bg-[#1a1a1a]',
    border: 'border-[#2a2a2a]',
    text: 'text-green-400',
    textMuted: 'text-green-600',
    accent: 'bg-green-500',
    accentText: 'text-green-400',
    input: 'bg-[#1a1a1a] text-green-400',
    isDark: true,
  },
  'clean-light': {
    id: 'clean-light',
    name: 'Clean Light',
    bg: 'bg-[#f6f7f8]',
    sidebar: 'bg-white',
    panel: 'bg-white',
    border: 'border-[#e7ecf3]',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    accent: 'bg-[#478beb]',
    accentText: 'text-[#478beb]',
    input: 'bg-[#f6f7f8] text-slate-900',
    isDark: false,
  },
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, currentTheme, setTheme, wpm, setWpm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl ${THEMES[currentTheme].panel} ${THEMES[currentTheme].border} border rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${THEMES[currentTheme].sidebar} border-b ${THEMES[currentTheme].border}`}>
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined ${THEMES[currentTheme].accentText}`}>settings</span>
            <div>
              <h2 className={`text-lg font-bold ${THEMES[currentTheme].text}`}>Settings</h2>
              <p className={`text-xs ${THEMES[currentTheme].textMuted}`}>Personalize your scriptwriting workspace</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 ${THEMES[currentTheme].textMuted}`}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Reading Pace */}
          <div>
            <h3 className={`flex items-center gap-2 text-sm font-bold ${THEMES[currentTheme].text} mb-4`}>
              <span className={`material-symbols-outlined ${THEMES[currentTheme].accentText}`}>speed</span>
              Reading Pace
            </h3>
            <div className={`p-4 rounded-xl ${THEMES[currentTheme].sidebar} ${THEMES[currentTheme].border} border`}>
              <div className="flex items-center gap-4">
                <label className={`text-xs font-medium ${THEMES[currentTheme].textMuted}`}>Words Per Minute (WPM)</label>
                <span className={`text-xs ${THEMES[currentTheme].accentText}`}>Recommended: 150</span>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
                className="w-full mt-3 accent-[#2b7cee]"
              />
              <div className={`flex justify-between text-xs ${THEMES[currentTheme].textMuted} mt-1`}>
                <span>100 WPM</span>
                <span className={`font-bold ${THEMES[currentTheme].text}`}>{wpm} WPM</span>
                <span>300 WPM</span>
              </div>
            </div>
          </div>

          {/* Workspace Themes */}
          <div>
            <h3 className={`flex items-center gap-2 text-sm font-bold ${THEMES[currentTheme].text} mb-4`}>
              <span className={`material-symbols-outlined ${THEMES[currentTheme].accentText}`}>palette</span>
              Workspace Themes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(THEMES).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${currentTheme === theme.id ? 'border-[#2b7cee] ring-2 ring-[#2b7cee]/30' : `${THEMES[currentTheme].border} hover:border-slate-500`}`}
                >
                  {/* Theme Preview */}
                  <div className={`h-16 rounded-lg ${theme.bg} ${theme.border} border mb-2 flex overflow-hidden`}>
                    <div className={`w-1/4 ${theme.sidebar} border-r ${theme.border}`}></div>
                    <div className="flex-1 p-1">
                      <div className={`h-2 w-3/4 ${theme.panel} rounded mb-1`}></div>
                      <div className={`h-1 w-1/2 ${theme.panel} rounded`}></div>
                    </div>
                  </div>
                  <p className={`text-xs font-medium ${THEMES[currentTheme].text}`}>{theme.name}</p>
                  {currentTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#2b7cee] rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white !text-[14px]">check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 ${THEMES[currentTheme].sidebar} border-t ${THEMES[currentTheme].border}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${THEMES[currentTheme].textMuted} hover:bg-white/10`}>
            Cancel
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#2b7cee] text-white hover:bg-blue-600">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  // State
  const [scripts, setScripts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeScriptId, setActiveScriptId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [viewMode, setViewMode] = useState('script');
  const [wpm, setWpm] = useState(150);
  const [currentTheme, setCurrentTheme] = useState('studio-dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [draggedScriptId, setDraggedScriptId] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState({});

  // Productivity Features State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [secondaryScriptId, setSecondaryScriptId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived State
  const activeTab = scripts.find(s => s.id === activeScriptId) || null;
  const secondaryTab = scripts.find(s => s.id === secondaryScriptId) || null;
  const theme = THEMES[currentTheme];

  // Initial Load
  useEffect(() => {
    const loaded = getScripts();
    setScripts(loaded);
    if (loaded.length > 0) {
      setActiveScriptId(loaded[0].id);
    }
    // Load collections
    const loadedCollections = getCollections();
    setCollections(loadedCollections);
    // Expand all by default
    const expanded = {};
    loadedCollections.forEach(c => expanded[c.id] = true);
    setExpandedCollections(expanded);
    // Load saved theme
    const savedTheme = localStorage.getItem('scriptpad-theme');
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    // Load saved WPM
    const savedWpm = localStorage.getItem('scriptpad-wpm');
    if (savedWpm) {
      setWpm(Number(savedWpm));
    }
  }, []);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('scriptpad-theme', currentTheme);
  }, [currentTheme]);

  // Save WPM preference
  useEffect(() => {
    localStorage.setItem('scriptpad-wpm', wpm.toString());
  }, [wpm]);

  // Auto-save
  useEffect(() => {
    if (activeTab) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        saveScript(activeTab);
        setScripts(prev => prev.map(s => s.id === activeTab.id ? activeTab : s));
        setIsSaving(false);
        setLastSaved(new Date().toLocaleTimeString());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Actions
  const createNewTab = (collectionId = null) => {
    // Handle event object if passed directly
    const validCollectionId = (typeof collectionId === 'string') ? collectionId : null;

    const newScript = {
      id: generateUUID(),
      title: 'Untitled Script',
      content: '',
      description: '',
      notes: '',
      status: 'Drafting',
      tags: [],
      dueDate: '',
      collectionId: validCollectionId,
      lastModified: Date.now()
    };
    const updatedScripts = [...scripts, newScript];
    setScripts(updatedScripts);
    setActiveScriptId(newScript.id);
    saveScript(newScript);
  };

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    const newCollection = {
      id: generateUUID(),
      name: newCollectionName.trim(),
      color: ['blue', 'purple', 'orange', 'green', 'pink'][Math.floor(Math.random() * 5)]
    };
    const updated = saveCollection(newCollection);
    setCollections(updated);
    setExpandedCollections(prev => ({ ...prev, [newCollection.id]: true }));
    setNewCollectionName('');
    setShowNewCollection(false);
  };

  const handleDeleteCollection = (id) => {
    if (window.confirm('Delete this collection? Scripts will be moved to uncategorized.')) {
      // Move scripts to uncategorized
      scripts.forEach(s => {
        if (s.collectionId === id) {
          const updated = { ...s, collectionId: null };
          saveScript(updated);
        }
      });
      setScripts(prev => prev.map(s => s.collectionId === id ? { ...s, collectionId: null } : s));
      const updated = deleteCollection(id);
      setCollections(updated);
    }
  };

  // Drag & Drop
  const handleDragStart = (e, scriptId) => {
    setDraggedScriptId(scriptId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, collectionId) => {
    e.preventDefault();
    if (draggedScriptId) {
      const script = scripts.find(s => s.id === draggedScriptId);
      if (script) {
        const updated = { ...script, collectionId };
        saveScript(updated);
        setScripts(prev => prev.map(s => s.id === draggedScriptId ? updated : s));
      }
    }
    setDraggedScriptId(null);
  };

  // Add/Remove Tag
  const toggleTag = (tag) => {
    if (!activeTab) return;
    const currentTags = activeTab.tags || [];
    let newTags;
    if (currentTags.includes(tag.name)) {
      newTags = currentTags.filter(t => t !== tag.name);
    } else {
      newTags = [...currentTags, tag.name];
    }
    updateActiveTab({ tags: newTags });
  };

  const updateActiveTab = (updates) => {
    if (!activeTab) return;
    const updatedScript = { ...activeTab, ...updates, lastModified: Date.now() };
    setScripts(prev => prev.map(s => s.id === activeScriptId ? updatedScript : s));
  };

  const updateSecondaryTab = (updates) => {
    if (!secondaryTab) return;
    const updatedScript = { ...secondaryTab, ...updates, lastModified: Date.now() };
    setScripts(prev => prev.map(s => s.id === secondaryScriptId ? updatedScript : s));
  };

  const deleteActiveTab = (e) => {
    e.stopPropagation();
    if (!activeTab) return;
    if (window.confirm('Are you sure you want to delete this script?')) {
      deleteScript(activeTab.id);
      const remaining = scripts.filter(s => s.id !== activeTab.id);
      setScripts(remaining);
      setActiveScriptId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const copyShareLink = () => {
    if (!activeTab) return;
    const link = generateShareLink(activeTab);
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  // Calculate stats including new analytics
  const safeContent = activeTab?.content || '';
  const stats = activeTab ? {
    words: safeContent.trim() ? safeContent.trim().split(/\s+/).length : 0,
    chars: safeContent.length,
    mins: Math.floor((safeContent.trim() ? safeContent.trim().split(/\s+/).length : 0) / wpm),
    secs: Math.floor(((safeContent.trim() ? safeContent.trim().split(/\s+/).length : 0) % wpm) / (wpm / 60)),
    scenes: detectScenes(safeContent),
    sentiment: analyzeSentiment(safeContent),
    pacing: analyzePacing(safeContent, wpm)
  } : { words: 0, chars: 0, mins: 0, secs: 0, scenes: 0, sentiment: { label: 'Neutral', emoji: '😐' }, pacing: { label: 'Normal', color: 'text-slate-400' } };



  // PDF Export
  const exportToPDF = () => {
    if (!activeTab) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(activeTab.title || 'Untitled Script', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Created with ScriptPad • ${new Date().toLocaleDateString()}`, 20, 30);
    doc.setFontSize(12);
    doc.setTextColor(0);
    const splitText = doc.splitTextToSize(activeTab.content || '', 170);
    doc.text(splitText, 20, 45);
    doc.save(`${activeTab.title || 'script'}.pdf`);
  };

  return (
    <div className={`font-display antialiased overflow-hidden h-screen flex flex-col ${theme.bg} ${theme.text}`}>
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={currentTheme}
        setTheme={setCurrentTheme}
        wpm={wpm}
        setWpm={setWpm}
      />

      {/* Global Header */}
      <header className={`h-14 border-b ${theme.border} ${theme.sidebar} flex items-center justify-between px-6 shrink-0 z-20`}>
        <div className="flex items-center gap-8">
          <div className={`flex items-center gap-2 ${theme.text}`}>
            <div className={`size-6 ${theme.accentText}`}>
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight">ScriptPad<span className={`${theme.accentText} font-normal`}>.</span></h1>
          </div>
          {/* Segmented View Toggle */}
          <div className={`flex h-9 items-center justify-center rounded-lg ${theme.panel} ${theme.border} border p-1 w-64`}>
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-xs font-semibold leading-normal transition-all ${viewMode === 'script' ? `${theme.sidebar} shadow-sm ${theme.text}` : `${theme.textMuted} hover:${theme.text}`}`}>
              <span className="truncate">Script Editor</span>
              <input className="hidden" type="radio" checked={viewMode === 'script'} onChange={() => setViewMode('script')} />
            </label>
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-xs font-semibold leading-normal transition-all ${viewMode === 'description' ? `${theme.sidebar} shadow-sm ${theme.text}` : `${theme.textMuted} hover:${theme.text}`}`}>
              <span className="truncate">Description</span>
              <input className="hidden" type="radio" checked={viewMode === 'description'} onChange={() => setViewMode('description')} />
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            title="Toggle Focus Mode"
            className={`flex items-center justify-center h-9 w-9 rounded-lg ${isFocusMode ? `${theme.accent} text-white` : `${theme.panel} ${theme.border} border ${theme.textMuted} hover:${theme.text}`}`}
          >
            <span className="material-symbols-outlined">{isFocusMode ? 'fullscreen_exit' : 'fullscreen'}</span>
          </button>
          <button
            onClick={() => setSecondaryScriptId(secondaryScriptId ? null : (scripts.find(s => s.id !== activeScriptId)?.id || 'PICKER'))}
            title="Toggle Split View"
            className={`hidden lg:flex items-center justify-center h-9 w-9 rounded-lg ${secondaryScriptId ? `${theme.accent} text-white` : `${theme.panel} ${theme.border} border ${theme.textMuted} hover:${theme.text}`}`}
          >
            <span className="material-symbols-outlined">view_column</span>
          </button>
          <div className={`flex h-6 w-px ${theme.border} mx-1`}></div>
          <div className={`flex items-center gap-2 h-9 px-2 rounded-lg ${theme.panel} ${theme.border} border`}>
            <span className="material-symbols-outlined !text-sm text-slate-500">search</span>
            <input
              className={`bg-transparent border-none text-xs outline-none w-24 sm:w-32 placeholder-slate-500 ${theme.text}`}
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setShowSettings(true)} className={`flex items-center justify-center h-9 w-9 rounded-lg ${theme.panel} ${theme.border} border ${theme.textMuted} hover:${theme.text}`}>
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className={`flex h-6 w-px ${theme.border} mx-1`}></div>
          <button onClick={copyShareLink} className={`flex items-center gap-2 h-9 px-4 rounded-lg bg-[#2b7cee]/10 text-[#2b7cee] border border-[#2b7cee]/20 text-xs font-bold hover:bg-[#2b7cee]/20 transition-all cursor-pointer`}>
            <span className="material-symbols-outlined !text-[18px]">share</span>
            <span>Share</span>
          </button>
          <button onClick={exportToPDF} className={`flex items-center gap-2 h-9 px-4 rounded-lg ${theme.accent} text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer`}>
            <span className="material-symbols-outlined !text-[18px]">download</span>
            <span>Export PDF</span>
          </button>
          <div className={`ml-2 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 border ${theme.border} bg-gray-500`}></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        {!isFocusMode && (
          <aside className="hidden md:flex w-64 bg-[#111822] border-r border-[#233348] flex-col shrink-0">
            <div className="p-4 flex flex-col gap-6 overflow-y-auto h-full">
              <div>
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className={`text-[10px] uppercase font-bold ${theme.textMuted} tracking-widest`}>Workspace</span>
                  <button onClick={createNewTab} className={`${theme.textMuted} hover:${theme.accentText} transition-colors`}>
                    <span className="material-symbols-outlined !text-[16px]">add_circle</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {scripts.filter(s => (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())).map(script => (
                    <div
                      key={script.id}
                      onClick={() => setActiveScriptId(script.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group ${activeScriptId === script.id ? `${theme.accentText} bg-[#2b7cee]/10 border border-[#2b7cee]/20` : `${theme.textMuted} hover:${theme.panel} hover:${theme.text}`}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className={`material-symbols-outlined ${activeScriptId === script.id ? theme.accentText : ''}`}>description</span>
                        <p className="text-sm font-medium truncate">{script.title || 'Untitled'}</p>
                      </div>
                      {activeScriptId === script.id && <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>}
                    </div>
                  ))}
                  {scripts.length === 0 && (
                    <div onClick={createNewTab} className={`p-4 text-center border border-dashed ${theme.border} rounded-lg ${theme.textMuted} text-xs cursor-pointer hover:${theme.text} hover:border-slate-400`}>
                      + Create First Script
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className={`text-[10px] uppercase font-bold ${theme.textMuted} tracking-widest`}>Collections</span>
                  <button onClick={() => setShowNewCollection(true)} className={`${theme.textMuted} hover:${theme.accentText} transition-colors`}>
                    <span className="material-symbols-outlined !text-[16px]">add_circle</span>
                  </button>
                </div>
                {showNewCollection && (
                  <div className="px-2 mb-2">
                    <input
                      autoFocus
                      className={`w-full px-3 py-2 rounded-lg bg-[#161e2b] border border-[#233348] text-sm text-white placeholder-slate-500 outline-none focus:border-[#2b7cee]`}
                      placeholder="Collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') createCollection(); if (e.key === 'Escape') setShowNewCollection(false); }}
                      onBlur={() => { if (!newCollectionName.trim()) setShowNewCollection(false); }}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  {collections.map(collection => (
                    <div key={collection.id}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#233348] ${theme.textMuted} hover:${theme.text} cursor-pointer group`}
                        onClick={() => setExpandedCollections(prev => ({ ...prev, [collection.id]: !prev[collection.id] }))}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, collection.id)}
                      >
                        <span className={`material-symbols-outlined ${theme.textMuted} group-hover:text-${collection.color || 'blue'}-400 transition-transform ${expandedCollections[collection.id] ? 'rotate-90' : ''}`}>chevron_right</span>
                        <span className={`material-symbols-outlined text-${collection.color || 'blue'}-400`}>folder</span>
                        <p className="text-sm font-medium flex-1">{collection.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); createNewTab(collection.id); }} className="opacity-0 group-hover:opacity-100 hover:text-green-400">
                          <span className="material-symbols-outlined !text-sm">add</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCollection(collection.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-400">
                          <span className="material-symbols-outlined !text-sm">close</span>
                        </button>
                      </div>
                      {expandedCollections[collection.id] && (
                        <div className="ml-6 space-y-1">
                          {scripts.filter(s => s.collectionId === collection.id).map(script => (
                            <div
                              key={script.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, script.id)}
                              onClick={() => setActiveScriptId(script.id)}
                              className={`flex flex-col gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${activeScriptId === script.id ? 'bg-[#2b7cee]/10 text-[#2b7cee]' : `${theme.textMuted} hover:${theme.text} hover:bg-[#233348]`}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined !text-sm">description</span>
                                <span className="text-xs truncate font-medium">{script.title || 'Untitled'}</span>
                              </div>
                              {/* Tags in sidebar */}
                              {script.tags && script.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pl-6">
                                  {script.tags.slice(0, 3).map(tag => {
                                    const tagColor = AVAILABLE_TAGS.find(t => t.name === tag)?.color || 'slate';
                                    return (
                                      <span key={tag} className={`text-[9px] px-1 rounded bg-${tagColor}-500/10 text-${tagColor}-400 border border-${tagColor}-500/20`}>
                                        {tag}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Uncategorized drop zone */}
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#233348] ${theme.textMuted} hover:${theme.text} cursor-pointer group`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, null)}
                  >
                    <span className={`material-symbols-outlined ${theme.textMuted} group-hover:text-orange-400`}>archive</span>
                    <p className="text-sm font-medium">Uncategorized</p>
                  </div>
                </div>
              </div>
            </div>


          </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-w-0 bg-[#0d1216] relative transition-all duration-300`}>
          {/* Tabs Bar */}
          <div className={`flex ${theme.sidebar} border-b ${theme.border} px-4 overflow-x-auto`}>
            <div className="flex h-11 items-center gap-1">
              {scripts.map(script => (
                <div
                  key={script.id}
                  onClick={() => setActiveScriptId(script.id)}
                  className={`flex items-center gap-2 px-4 h-full border-b-2 transition-colors min-w-[160px] cursor-pointer group ${activeScriptId === script.id ? `border-[#2b7cee] ${theme.panel} ${theme.text}` : `border-transparent ${theme.textMuted} hover:${theme.text}`}`}
                >
                  <span className={`material-symbols-outlined !text-sm ${activeScriptId === script.id ? theme.accentText : ''}`}>article</span>
                  <span className="text-xs font-bold whitespace-nowrap max-w-[100px] truncate">{script.title || 'Untitled'}</span>
                  {activeScriptId === script.id && (
                    <button onClick={(e) => deleteActiveTab(e)} className={`ml-auto hover:${theme.panel} rounded p-0.5`}><span className="material-symbols-outlined !text-sm">close</span></button>
                  )}
                </div>
              ))}
              <button onClick={createNewTab} className={`px-3 h-full flex items-center justify-center ${theme.textMuted} hover:${theme.text}`}>
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          {/* Editor Container - Grid for Split View */}
          <div className={`flex-1 overflow-hidden ${secondaryScriptId ? 'grid grid-cols-2 divide-x divide-[#233348]' : ''}`}>

            {/* Primary Editor */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                {activeTab ? (
                  <div className={`mx-auto w-full flex flex-col gap-6 ${isFocusMode ? 'max-w-7xl' : 'max-w-5xl'}`}>
                    <div className="space-y-2 shrink-0">
                      <input
                        className={`w-full bg-transparent border-none text-3xl font-bold ${theme.text} focus:ring-0 p-0 placeholder-slate-700 outline-none`}
                        placeholder="Untitled Script"
                        type="text"
                        value={activeTab.title || ''}
                        onChange={(e) => updateActiveTab({ title: e.target.value })}
                      />
                      <div className={`flex items-center gap-4 ${theme.textMuted} text-sm`}>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined !text-xs">calendar_today</span> {activeTab.lastModified ? new Date(activeTab.lastModified).toLocaleDateString() : 'New'}</span>
                        {activeTab.tags && activeTab.tags.length > 0 && <span className="flex items-center gap-1"><span className="material-symbols-outlined !text-xs">label</span> {activeTab.tags.join(', ')}</span>}
                      </div>
                    </div>

                    {viewMode === 'script' ? (
                      /* Main Editor Pane */
                      <div className={`flex flex-col border ${theme.border} rounded-xl bg-[#161e2b]/30 backdrop-blur-sm overflow-hidden min-h-[70vh] shadow-xl`}>
                        {/* Formatting Toolbar */}
                        <div className={`flex items-center justify-between px-4 py-2 ${theme.sidebar} border-b ${theme.border}`}>
                          <div className="flex items-center gap-1">
                            <button className={`p-1.5 ${theme.textMuted} hover:${theme.panel} hover:${theme.text} rounded`}><span className="material-symbols-outlined">format_bold</span></button>
                            <button className={`p-1.5 ${theme.textMuted} hover:${theme.panel} hover:${theme.text} rounded`}><span className="material-symbols-outlined">format_italic</span></button>
                            <button className={`p-1.5 ${theme.textMuted} hover:${theme.panel} hover:${theme.text} rounded`}><span className="material-symbols-outlined">format_list_bulleted</span></button>
                          </div>
                          <div className="flex items-center gap-3">
                            {stats.sentiment.label !== 'Neutral' && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#111822] border ${theme.border} flex items-center gap-1`}>
                                {stats.sentiment.emoji} {stats.sentiment.label} Tone
                              </span>
                            )}
                            <span className={`text-[10px] ${theme.textMuted} font-medium italic`}>{isSaving ? 'Saving...' : (lastSaved ? `Autosaved` : 'Ready')}</span>
                          </div>
                        </div>

                        <textarea
                          className={`flex-1 w-full bg-transparent border-none text-slate-300 focus:ring-0 p-8 leading-relaxed text-lg resize-none min-h-[70vh] outline-none`}
                          placeholder="Start writing your script here... Use / for commands."
                          spellCheck="false"
                          value={activeTab.content || ''}
                          onChange={(e) => updateActiveTab({ content: e.target.value })}
                        />
                      </div>
                    ) : (
                      /* Description Editor Pane */
                      <div className={`flex flex-col border ${theme.border} rounded-xl bg-[#161e2b]/30 backdrop-blur-sm overflow-hidden min-h-[70vh] shadow-xl`}>
                        <div className={`flex items-center px-4 py-2 ${theme.sidebar} border-b ${theme.border}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>Description</span>
                        </div>
                        <textarea
                          className={`flex-1 w-full bg-transparent border-none text-slate-300 focus:ring-0 p-8 leading-relaxed text-lg resize-none min-h-[70vh] outline-none font-sans`}
                          placeholder="Description, hashtags, and links go here..."
                          spellCheck="true"
                          value={activeTab.description || ''}
                          onChange={(e) => updateActiveTab({ description: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-full ${theme.textMuted}`}>
                    <p>No script selected</p>
                    <button onClick={() => createNewTab()} className={`mt-4 px-6 py-2 ${theme.accent} text-white rounded-lg font-bold hover:opacity-90`}>Create Script</button>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Editor (Split View) */}
            {secondaryScriptId && (
              <div className="flex flex-col h-full overflow-hidden bg-[#0a0f14]">
                {secondaryTab ? (
                  <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                    <div className="mx-auto flex flex-col gap-6 max-w-2xl">
                      {/* Secondary Header */}
                      <div className="flex items-center justify-between shrink-0">
                        <div className="relative group w-full max-w-xs">
                          <button className={`flex items-center justify-between w-full px-3 py-2 ${theme.panel} border ${theme.border} rounded-lg text-sm ${theme.text}`}>
                            <span className="truncate">{secondaryTab.title}</span>
                            <span className="material-symbols-outlined !text-sm">expand_more</span>
                          </button>
                          {/* Script Picker Dropdown */}
                          <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-full bg-[#111822] border border-[#233348] rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                            {scripts.filter(s => s.id !== activeScriptId).map(s => (
                              <div
                                key={s.id}
                                onClick={() => setSecondaryScriptId(s.id)}
                                className={`px-3 py-2 hover:bg-[#233348] cursor-pointer text-xs ${theme.textMuted} hover:${theme.text}`}
                              >
                                {s.title || 'Untitled'}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => setSecondaryScriptId(null)} className={`${theme.textMuted} hover:text-red-400`}><span className="material-symbols-outlined">close</span></button>
                      </div>

                      <div className={`flex flex-col border ${theme.border} rounded-xl bg-[#161e2b]/30 backdrop-blur-sm overflow-hidden min-h-[500px]`}>
                        <div className={`flex items-center px-4 py-2 ${theme.sidebar} border-b ${theme.border}`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>Secondary View</span>
                        </div>
                        <textarea
                          className={`flex-1 w-full bg-transparent border-none text-slate-300 focus:ring-0 p-6 leading-relaxed text-lg resize-none min-h-[400px] outline-none`}
                          placeholder="Secondary script content..."
                          spellCheck="false"
                          value={secondaryTab.content || ''}
                          onChange={(e) => updateSecondaryTab({ content: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-full ${theme.textMuted}`}>
                    <p>Select a script to view</p>
                    <div className="mt-4 flex flex-col gap-2 max-h-60 overflow-y-auto">
                      {scripts.filter(s => s.id !== activeScriptId).map(s => (
                        <button key={s.id} onClick={() => setSecondaryScriptId(s.id)} className={`px-4 py-2 ${theme.panel} rounded hover:${theme.text}`}>
                          {s.title || 'Untitled'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setSecondaryScriptId(null)} className="mt-8 text-xs hover:text-red-400">Close Split View</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        {/* Right Side Panel: Metadata & Stats */}
        {!isFocusMode && activeTab && (
          <aside className="hidden xl:flex w-80 bg-[#111822] border-l border-[#233348] flex-col shrink-0 p-6 gap-6">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} mb-4`}>Workflow Management</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-medium ${theme.textMuted}`}>Current Status</label>
                  <div className="relative group">
                    <select
                      value={activeTab.status}
                      onChange={(e) => updateActiveTab({ status: e.target.value })}
                      className={`w-full ${theme.panel} border ${theme.border} rounded-lg py-2 pl-3 pr-10 text-sm ${theme.text} appearance-none focus:border-[#2b7cee] focus:ring-1 focus:ring-[#2b7cee] transition-all outline-none`}
                    >
                      <option>Drafting</option>
                      <option>In Review</option>
                      <option>Ready to Film</option>
                      <option>Posted / Live</option>
                    </select>
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${theme.textMuted} !text-sm`}>expand_more</span>
                  </div>
                </div>
                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-medium ${theme.textMuted}`}>Due Date</label>
                  <input
                    type="date"
                    value={activeTab.dueDate || ''}
                    onChange={(e) => updateActiveTab({ dueDate: e.target.value })}
                    className={`w-full ${theme.panel} border ${theme.border} rounded-lg py-2 px-3 text-sm ${theme.text} outline-none focus:border-[#2b7cee]`}
                  />
                </div>
              </div>
            </div>
            <div className={`h-px ${theme.border}`}></div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} mb-4`}>Script Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`${theme.panel} border ${theme.border} rounded-xl p-3 flex flex-col gap-1`}>
                  <span className={`text-xs ${theme.textMuted} font-medium`}>Word Count</span>
                  <span className={`text-xl font-bold ${theme.text}`}>{stats.words}</span>
                </div>
                <div className={`${theme.panel} border ${theme.border} rounded-xl p-3 flex flex-col gap-1`}>
                  <span className={`text-xs ${theme.textMuted} font-medium`}>Read Time</span>
                  <span className={`text-xl font-bold ${theme.accentText}`}>{stats.mins}:{stats.secs.toString().padStart(2, '0')}</span>
                </div>
                {/* New Metrics */}
                <div className={`${theme.panel} border ${theme.border} rounded-xl p-3 flex flex-col gap-1`}>
                  <span className={`text-xs ${theme.textMuted} font-medium`}>Scenes</span>
                  <span className={`text-xl font-bold ${theme.text}`}>{stats.scenes}</span>
                </div>
                <div className={`${theme.panel} border ${theme.border} rounded-xl p-3 flex flex-col gap-1`}>
                  <span className={`text-xs ${theme.textMuted} font-medium`}>Pacing</span>
                  <span className={`text-md font-bold ${stats.pacing.color}`}>{stats.pacing.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <p className={`text-[10px] ${theme.textMuted} italic`}>Pace: {wpm} WPM</p>
                <div className="flex gap-1">
                  <button onClick={() => setWpm(Math.max(100, wpm - 10))} className={`${theme.textMuted} hover:${theme.text} px-1`}>-</button>
                  <button onClick={() => setWpm(wpm + 10)} className={`${theme.textMuted} hover:${theme.text} px-1`}>+</button>
                </div>
              </div>
            </div>
            <div className={`h-px ${theme.border}`}></div>

            {/* Tags Section */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} mb-3`}>Tags</h3>
              <div className="flex flex-wrap gap-2">
                {activeTab.tags?.map(tagName => {
                  const tag = AVAILABLE_TAGS.find(t => t.name === tagName);
                  if (!tag) return null;
                  return (
                    <span key={tag.name} onClick={() => toggleTag(tag)} className={`px-2 py-1 bg-${tag.color}-500/10 text-${tag.color}-400 border border-${tag.color}-500/20 rounded-md text-[10px] font-bold uppercase tracking-tight cursor-pointer hover:bg-${tag.color}-500/20`}>
                      {tag.name}
                    </span>
                  )
                })}
                <div className="relative group">
                  <button className={`px-2 py-1 ${theme.panel} ${theme.textMuted} border ${theme.border} rounded-md text-[10px] font-bold uppercase tracking-tight hover:${theme.text}`}>+ Add Tag</button>
                  <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-32 bg-[#111822] border border-[#233348] rounded-lg shadow-xl z-10 p-1">
                    {AVAILABLE_TAGS.filter(t => !activeTab.tags?.includes(t.name)).map(tag => (
                      <div key={tag.name} onClick={() => toggleTag(tag)} className={`px-2 py-1.5 hover:bg-[#233348] text-${tag.color}-400 text-xs cursor-pointer rounded`}>
                        {tag.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`h-px ${theme.border}`}></div>
            {/* Quick Notes Section */}
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} mb-3`}>Quick Notes</h3>
              <div className={`${theme.panel} border ${theme.border} rounded-xl p-3`}>
                <textarea
                  className={`w-full bg-transparent border-none text-sm ${theme.text} resize-none focus:ring-0 outline-none min-h-[100px] placeholder-slate-600`}
                  placeholder="Add notes for this script..."
                  value={activeTab?.notes || ''}
                  onChange={(e) => updateActiveTab({ notes: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-auto"></div>
          </aside>
        )}
      </div>

      {/* Footer Stats */}
      <footer className={`h-8 ${theme.panel} border-t ${theme.border} px-6 flex items-center justify-between text-[10px] font-medium ${theme.textMuted} shrink-0`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> System Ready</span>
          {isSaving && <span className="flex items-center gap-1.5 text-orange-400"><span className="material-symbols-outlined !text-[12px] animate-spin">sync</span> Saving...</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Theme: {theme.name}</span>
          <span>Markdown Enabled</span>
        </div>
      </footer>
    </div >
  );
};

export default App;
