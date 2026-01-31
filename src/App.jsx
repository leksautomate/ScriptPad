import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  Plus,
  X,
  Save,
  FileText,
  Edit3,
  Clock,
  Terminal,
  Sun,
  Zap,
  Download,
  Upload,
  Activity,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { getScripts, saveScript, deleteScript } from './storageUtils';

// UUID generator that works in non-HTTPS environments
const generateUUID = () => {
  // Use crypto.randomUUID if available (HTTPS/localhost)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for HTTP (non-secure contexts)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const THEMES = {
  studio: {
    id: 'studio',
    name: 'Studio Dark',
    bg: 'bg-[#0f0f0f]',
    sidebar: 'bg-[#1a1a1a]',
    border: 'border-[#333]',
    accent: 'bg-red-600',
    accentText: 'text-red-500',
    editorBg: 'bg-[#141414]',
    text: 'text-gray-200',
    muted: 'text-gray-500',
    input: 'text-gray-300',
    icon: <Zap size={18} />
  },
  blue: {
    id: 'blue',
    name: 'Studio Blue',
    bg: 'bg-[#0f0f0f]',
    sidebar: 'bg-[#1a1a1a]',
    border: 'border-[#333]',
    accent: 'bg-blue-600',
    accentText: 'text-blue-500',
    editorBg: 'bg-[#141414]',
    text: 'text-gray-200',
    muted: 'text-gray-500',
    input: 'text-gray-300',
    icon: <Zap size={18} className="text-blue-400" />
  },
  hacker: {
    id: 'hacker',
    name: 'Hacker Pro',
    bg: 'bg-[#000000]',
    sidebar: 'bg-[#0a0a0a]',
    border: 'border-[#00ff41]/20',
    accent: 'bg-[#00ff41]',
    accentText: 'text-[#00ff41]',
    editorBg: 'bg-[#050505]',
    text: 'text-[#00ff41]',
    muted: 'text-[#008f11]',
    input: 'text-[#00ff41] font-mono',
    icon: <Terminal size={18} />
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    bg: 'bg-[#f8f9fa]',
    sidebar: 'bg-white',
    border: 'border-[#e0e0e0]',
    accent: 'bg-blue-600',
    accentText: 'text-blue-600',
    editorBg: 'bg-white',
    text: 'text-gray-900',
    muted: 'text-gray-400',
    input: 'text-gray-800',
    icon: <Sun size={18} />
  }
};

const STATUS_OPTIONS = [
  { id: 'Draft', color: 'text-gray-400', icon: <Edit3 size={14} /> },
  { id: 'Ready', color: 'text-blue-400', icon: <Circle size={14} /> },
  { id: 'Posted', color: 'text-green-400', icon: <CheckCircle2 size={14} /> }
];



const App = () => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [theme, setTheme] = useState(THEMES.studio);
  const [wpm, setWpm] = useState(150);
  const [viewMode, setViewMode] = useState('script'); // 'script' or 'description'
  const [selectionStats, setSelectionStats] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle text selection in the editor
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

      if (selectedText.length > 0) {
        const words = selectedText.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = selectedText.length;
        const charsNoSpaces = selectedText.replace(/\s/g, '').length;
        setSelectionStats({ words, chars, charsNoSpaces });
      } else {
        setSelectionStats(null);
      }
    }
  };

  // Load scripts on mount
  useEffect(() => {
    const loadedTabs = getScripts();
    const sortedTabs = loadedTabs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    setTabs(sortedTabs);
    if (sortedTabs.length > 0 && !activeTabId) setActiveTabId(sortedTabs[0].id);
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (!activeTabId) return;
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;

    const timeout = setTimeout(() => { saveCurrentScript(true); }, 2000);
    return () => clearTimeout(timeout);
  }, [tabs.find(t => t.id === activeTabId)?.content, tabs.find(t => t.id === activeTabId)?.name, tabs.find(t => t.id === activeTabId)?.status]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const createNewTab = async (initialContent = '', initialName = '') => {
    const newTabId = generateUUID();
    const newTab = {
      id: newTabId,
      name: initialName || `Untitled Script ${tabs.length + 1}`,
      content: initialContent,
      status: 'Draft',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedList = saveScript(newTab);
    setTabs(updatedList);
    setActiveTabId(newTabId);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      await createNewTab(event.target.result, file.name.replace('.txt', ''));
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const updateActiveTab = (updates) => {
    if (!activeTabId) return;
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const saveCurrentScript = async (isSilent = false) => {
    if (!activeTab) return;
    if (!isSilent) setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 300)); // Simulate networking delay for UX
      saveScript({ ...activeTab, updatedAt: Date.now() });
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); } finally { if (!isSilent) setIsSaving(false); }
  };

  const closeTab = async (e, id) => {
    e.stopPropagation();
    try {
      const updatedList = deleteScript(id);
      setTabs(updatedList);
      if (activeTabId === id) {
        const remaining = updatedList.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setActiveTabId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (e) { console.error(e); }
  };

  const getReadTime = (content) => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const totalSeconds = Math.ceil((words / wpm) * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return { mins, secs, totalSeconds, words };
  };



  const stats = getReadTime(viewMode === 'script' ? (activeTab?.content || "") : (activeTab?.description || ""));

  const exportToTxt = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!activeTab) return;

    // Create new PDF document
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);

    // Title
    doc.text(activeTab.name, 20, 20);

    // Meta info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Status: ${activeTab.status} | Words: ${stats.words} | Read Time: ${stats.mins}m ${stats.secs}s`, 20, 30);

    // Content
    doc.setFontSize(12);
    doc.setTextColor(0);

    const splitText = doc.splitTextToSize(activeTab.content, 170);
    let y = 45;

    // Add text page by page
    splitText.forEach(line => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 7;
    });

    doc.save(`${activeTab.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className={`flex h-screen w-full ${theme.bg} ${theme.text} font-sans overflow-hidden transition-colors duration-500`}>

      {/* Hidden file input */}
      <input
        type="file"
        accept=".txt"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImport}
      />

      {/* Sidebar */}
      <div className={`w-16 md:w-64 ${theme.sidebar} border-r ${theme.border} flex flex-col items-center py-4 shrink-0 transition-all duration-300`}>
        <div className={`mb-8 p-3 ${theme.accent} rounded-xl shadow-lg transition-colors duration-500`}>
          <FileText size={24} className="text-white" />
        </div>

        <div className="flex-1 w-full px-2 space-y-2 overflow-y-auto">
          <button onClick={() => createNewTab()} className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 ${theme.id === 'light' ? 'hover:bg-gray-100' : ''} transition-all group`}>
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span className="hidden md:block font-bold text-xs uppercase">New Script</span>
          </button>

          <button onClick={() => fileInputRef.current.click()} className={`w-full flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg border border-dashed ${theme.border} hover:bg-white/5 transition-all text-xs uppercase font-bold`}>
            <Upload size={18} className={theme.muted} />
            <span className="hidden md:block">Import .txt</span>
          </button>

          <div className={`pt-4 border-t ${theme.border} space-y-1`}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${activeTabId === tab.id ? `${theme.id === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-white/10 ' + theme.accentText} border-r-2 ${theme.id === 'light' ? 'border-blue-600' : theme.accent.replace('bg-', 'border-')}` : `hover:bg-white/5 ${theme.muted}`
                  }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-2 h-2 rounded-full ${activeTabId === tab.id ? (theme.id === 'light' ? 'bg-blue-600' : theme.accent) : 'bg-gray-600'}`} />
                  <div className="flex flex-col truncate">
                    <span className="truncate hidden md:block text-xs font-bold uppercase tracking-tight">{tab.name}</span>
                    <span className={`text-[9px] uppercase font-black tracking-widest hidden md:block opacity-60 ${STATUS_OPTIONS.find(s => s.id === tab.status)?.color}`}>
                      {tab.status}
                    </span>
                  </div>
                </div>
                <button onClick={(e) => closeTab(e, tab.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity hidden md:block">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Selector */}
        <div className={`mt-auto w-full px-2 space-y-4 border-t ${theme.border} pt-4 pb-2`}>
          <div className="flex md:flex-col gap-1">
            {Object.values(THEMES).map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t)}
                className={`flex items-center justify-center md:justify-start gap-3 p-3 md:py-2 md:px-3 rounded-lg transition-all ${theme.id === t.id ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5 opacity-50 hover:opacity-100'}`}
              >
                {t.icon}
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{t.name.split(' ').pop()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-14 ${theme.sidebar} border-b ${theme.border} flex items-center justify-between px-6 shrink-0`}>
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            {activeTab ? (
              <div className="flex items-center gap-4 group max-w-full">
                <input
                  type="text"
                  value={activeTab.name}
                  onChange={(e) => updateActiveTab({ name: e.target.value })}
                  className={`bg-transparent border-none focus:ring-0 text-lg font-bold outline-none w-full max-w-xs md:max-w-sm ${theme.id === 'light' ? 'text-gray-900' : 'text-white'}`}
                />

                {/* View Mode Toggle */}
                <div className={`hidden sm:flex items-center p-1 rounded-lg border ${theme.border} bg-black/20`}>
                  <button
                    onClick={() => setViewMode('script')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'script' ? `${theme.accent} text-white shadow-lg` : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Script
                  </button>
                  <button
                    onClick={() => setViewMode('description')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'description' ? `${theme.accent} text-white shadow-lg` : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Desc
                  </button>
                </div>

                {/* Workflow Status Dropdown */}
                <div className="hidden sm:flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => updateActiveTab({ status: status.id })}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-1.5 ${activeTab.status === status.id
                        ? `${status.color.replace('text-', 'bg-')}/20 ${status.color} ring-1 ring-white/10`
                        : 'text-gray-600 hover:text-gray-400'
                        }`}
                    >
                      {status.icon}
                      {status.id}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span className={`${theme.muted} italic`}>No script selected</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-4">
            {activeTab && (
              <>
                <button onClick={exportToPDF} className={`p-2 rounded-lg hover:bg-white/10 transition-all ${theme.muted}`} title="Export to PDF">
                  <span className="font-bold text-xs">PDF</span>
                </button>
                <button onClick={exportToTxt} className={`p-2 rounded-lg hover:bg-white/10 transition-all ${theme.muted}`} title="Download .txt">
                  <Download size={18} />
                </button>
              </>
            )}
            <button onClick={() => saveCurrentScript()} disabled={!activeTab || isSaving} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab ? `${theme.accent} text-white shadow-lg active:scale-95` : `bg-gray-800 ${theme.muted} cursor-not-allowed`}`}>
              <Save size={18} className={isSaving ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">{isSaving ? 'Saving' : 'Save'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 relative flex flex-col p-4 md:p-6">
          {activeTab ? (
            <div className={`flex-1 flex flex-col ${theme.editorBg} rounded-3xl border ${theme.border} shadow-2xl overflow-hidden`}>
              <div className={`flex items-center justify-between px-6 py-4 ${theme.sidebar} border-b ${theme.border} shrink-0`}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>

                <div className="flex items-center gap-8">
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${theme.accentText}`}>
                    <Clock size={14} />
                    {stats.mins}m {stats.secs}s
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${theme.muted}`}>
                    <Activity size={14} />
                    Words: {stats.words}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${STATUS_OPTIONS.find(s => s.id === activeTab.status)?.color.replace('text-', 'bg-')}/10 ${STATUS_OPTIONS.find(s => s.id === activeTab.status)?.color}`}>
                    {activeTab.status}
                  </div>
                </div>
              </div>

              {viewMode === 'script' ? (
                <textarea
                  ref={textareaRef}
                  value={activeTab.content}
                  onChange={(e) => updateActiveTab({ content: e.target.value })}
                  onSelect={handleTextSelection}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  placeholder="Start typing your script here..."
                  className={`flex-1 bg-transparent border-none focus:ring-0 p-8 md:p-12 text-lg md:text-2xl ${theme.input} font-mono resize-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}
                  spellCheck="false"
                />
              ) : (
                <textarea
                  value={activeTab.description || ''}
                  onChange={(e) => updateActiveTab({ description: e.target.value })}
                  placeholder="In this video, we'll cover... #Hashtags #Links"
                  className={`flex-1 bg-transparent border-none focus:ring-0 p-8 md:p-12 text-base md:text-lg ${theme.input} font-sans resize-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent opacity-90`}
                  spellCheck="true"
                />
              )}

              {/* Selection Stats Tooltip */}
              {selectionStats && (
                <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg ${theme.sidebar} border ${theme.border} shadow-2xl backdrop-blur-sm flex items-center gap-4 text-xs font-bold uppercase tracking-widest animate-fade-in z-10`}>
                  <div className="flex items-center gap-2">
                    <span className={theme.accentText}>{selectionStats.words}</span>
                    <span className={theme.muted}>words</span>
                  </div>
                  <div className={`w-px h-4 ${theme.border}`} />
                  <div className="flex items-center gap-2">
                    <span className={theme.accentText}>{selectionStats.chars}</span>
                    <span className={theme.muted}>chars</span>
                  </div>
                  <div className={`w-px h-4 ${theme.border}`} />
                  <div className="flex items-center gap-2">
                    <span className={theme.accentText}>{selectionStats.charsNoSpaces}</span>
                    <span className={theme.muted}>no spaces</span>
                  </div>
                </div>
              )}

              <footer className={`px-8 py-4 ${theme.sidebar} border-t ${theme.border} flex items-center justify-between text-[10px] ${theme.muted} font-mono uppercase tracking-widest font-bold shrink-0`}>
                <div className="flex gap-6">
                  <span>Pace: {wpm} WPM</span>
                  <div className="flex bg-black/20 rounded p-0.5">
                    {[120, 150, 180].map(p => (
                      <button key={p} onClick={() => setWpm(p)} className={`px-2 py-0.5 rounded transition-all ${wpm === p ? 'bg-white/10 text-white' : 'opacity-40 hover:opacity-100'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  {lastSaved && <span>SYNC: {lastSaved}</span>}
                  <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-orange-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
                </div>
              </footer>
            </div>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed ${theme.border} rounded-3xl`}>
              <div className={`p-8 bg-white/5 rounded-full mb-6 ${theme.id === 'light' ? 'bg-gray-100' : ''}`}>
                <FileText size={64} className={theme.muted} />
              </div>
              <h2 className="text-3xl font-black opacity-20 mb-2 uppercase tracking-tighter">SCRIPT PAD</h2>
              <div className="flex gap-4">
                <button onClick={() => createNewTab()} className={`px-8 py-4 mt-6 ${theme.accent} text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95`}>
                  New Script
                </button>
                <button onClick={() => fileInputRef.current.click()} className="px-8 py-4 mt-6 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest transition-all hover:bg-white/10">
                  Import .txt
                </button>
              </div>
            </div>
          )
          }
        </main >
      </div >
    </div >
  );
};

export default App;
