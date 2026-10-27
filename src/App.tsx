import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Smartphone,
  Code2,
  Columns2,
  Zap,
  Coffee,
  Brain,
  CheckCircle2,
  Circle,
  FileCode,
  Terminal,
  Sparkles,
  Volume2,
  VolumeX,
  Gauge
} from 'lucide-react';
import { MAIN_ACTIVITY_KOTLIN_CODE } from './mainActivityCode';

type TimerMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const PRESETS = {
  FOCUS: { title: 'Focus', defaultMinutes: 25, color: '#E0533C', label: 'STAY DEEPLY IMMERSED', icon: Brain },
  SHORT_BREAK: { title: 'Short Break', defaultMinutes: 5, color: '#10B981', label: 'TAKE A BREATH & HYDRATE', icon: Coffee },
  LONG_BREAK: { title: 'Long Break', defaultMinutes: 15, color: '#3B82F6', label: 'RESTORE YOUR ENERGY', icon: Zap },
};

export default function App() {
  // App views
  const [viewMode, setViewMode] = useState<'split' | 'phone' | 'code'>('split');
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quickTestMode, setQuickTestMode] = useState(false);

  // Timer states (matches Kotlin Compose state)
  const [mode, setMode] = useState<TimerMode>('FOCUS');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(2);

  // Task list state
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Plan today's deep work milestones", completed: true },
    { id: 2, text: "Implement core business logic & verify tests", completed: false },
    { id: 3, text: "Review pull requests & document API changes", completed: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Audio synthesizer for completion chime (no external mp3 files required)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    } catch {
      // AudioContext fallback
    }
  };

  // Timer countdown hook
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playChime();
            if (mode === 'FOCUS') {
              setCompletedSessions((s) => s + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, soundEnabled]);

  // Mode switch
  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    const secs = quickTestMode ? 10 : PRESETS[newMode].defaultMinutes * 60;
    setTotalSeconds(secs);
    setTimeLeft(secs);
  };

  // Toggle quick test mode
  const handleToggleTestMode = () => {
    const nextVal = !quickTestMode;
    setQuickTestMode(nextVal);
    setIsRunning(false);
    const secs = nextVal ? 10 : PRESETS[mode].defaultMinutes * 60;
    setTotalSeconds(secs);
    setTimeLeft(secs);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  };

  // Task actions
  const addTask = () => {
    const trimmed = newTaskInput.trim();
    if (!trimmed) return;
    setTasks([{ id: Date.now(), text: trimmed, completed: false }, ...tasks]);
    setNewTaskInput('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(MAIN_ACTIVITY_KOTLIN_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Download MainActivity.kt file
  const handleDownload = () => {
    const blob = new Blob([MAIN_ACTIVITY_KOTLIN_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MainActivity.kt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Formatting helpers
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalSeconds)) : 0;
  const activeColor = PRESETS[mode].color;
  const completedTaskCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-colors duration-300"
            style={{ backgroundColor: activeColor }}
          >
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white">FocusFlow</h1>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Jetpack Compose
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                Single-File
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Android Material 3 Focus & Daily Task Tracker (MainActivity.kt)
            </p>
          </div>
        </div>

        {/* View Mode & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Test Mode Switcher */}
          <button
            onClick={handleToggleTestMode}
            title="Toggle fast 10-second countdown for rapid testing of completion & session count"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              quickTestMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{quickTestMode ? '10s Test Mode: Active' : 'Speed Test (10s)'}</span>
          </button>

          {/* View Mode Switcher */}
          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex items-center gap-0.5 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'split' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewMode('phone')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'phone' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phone Only</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                viewMode === 'code' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Code & Guide</span>
            </button>
          </div>

          {/* Action: Copy MainActivity.kt */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition shadow-sm active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {/* Action: Download MainActivity.kt */}
          <button
            onClick={handleDownload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-md active:scale-95"
            style={{ backgroundColor: activeColor }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .kt</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Interactive Android Phone Simulator */}
        {(viewMode === 'split' || viewMode === 'phone') && (
          <div
            className={`flex flex-col items-center justify-center ${
              viewMode === 'phone' ? 'lg:col-span-12 max-w-md mx-auto w-full' : 'lg:col-span-5'
            }`}
          >
            {/* Phone Chassis Label & Simulator Controls */}
            <div className="w-full max-w-[390px] mb-3 flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Android Device Simulator (Material 3)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute Completion Chime' : 'Enable Completion Chime'}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
                </button>
              </div>
            </div>

            {/* Android Device Mockup */}
            <div className="w-full max-w-[390px] rounded-[44px] bg-[#090a0d] p-3 shadow-2xl border-4 border-[#242730] ring-1 ring-zinc-700/50 relative overflow-hidden">
              {/* Outer Volume & Power Buttons Illusion */}
              <div className="absolute -left-[7px] top-28 w-[3px] h-12 bg-zinc-700 rounded-l"></div>
              <div className="absolute -left-[7px] top-44 w-[3px] h-12 bg-zinc-700 rounded-l"></div>
              <div className="absolute -right-[7px] top-32 w-[3px] h-16 bg-zinc-700 rounded-r"></div>

              {/* Phone Screen Display */}
              <div className="w-full rounded-[34px] bg-[#121417] text-zinc-100 flex flex-col h-[750px] overflow-hidden select-none relative shadow-inner">
                {/* Android Status Bar */}
                <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-semibold text-zinc-400 z-10 shrink-0">
                  <span>9:41</span>
                  {/* Punch hole camera */}
                  <div className="w-4 h-4 rounded-full bg-black border border-zinc-800 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-950"></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <span className="text-[10px]">100%</span>
                  </div>
                </div>

                {/* Top App Bar (Jetpack Compose TopAppBar) */}
                <div className="px-5 py-2.5 flex items-center justify-between border-b border-zinc-800/40 shrink-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: activeColor }}
                    />
                    <h2 className="font-bold text-lg tracking-tight text-white">FocusFlow</h2>
                  </div>

                  {/* Session Badge (Compose SessionBadge) */}
                  <div className="bg-[#262a33] px-3 py-1 rounded-full flex items-center gap-1.5 border border-zinc-700/50">
                    <span className="text-xs">⚡</span>
                    <span className="text-xs font-bold" style={{ color: activeColor }}>
                      {completedSessions} {completedSessions === 1 ? 'Session' : 'Sessions'}
                    </span>
                  </div>
                </div>

                {/* Scrollable Screen Content (Compose LazyColumn) */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
                  {/* 1. Presets Selector Row (Compose PresetSelector) */}
                  <div className="bg-[#262a33] p-1 rounded-2xl flex items-center justify-between gap-1 shadow-sm">
                    {(Object.keys(PRESETS) as TimerMode[]).map((key) => {
                      const item = PRESETS[key];
                      const isSelected = mode === key;
                      return (
                        <button
                          key={key}
                          onClick={() => switchMode(key)}
                          className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold transition-all duration-200 text-center ${
                            isSelected
                              ? 'text-white shadow-md'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                          }`}
                          style={{
                            backgroundColor: isSelected ? activeColor : 'transparent',
                          }}
                        >
                          {item.title} ({item.defaultMinutes}m)
                        </button>
                      );
                    })}
                  </div>

                  {/* 2. Timer Card with Circular Dial (Compose TimerCard) */}
                  <div className="bg-[#1b1e24] rounded-3xl p-5 border border-zinc-800/60 shadow-lg flex flex-col items-center">
                    <span
                      className="text-[10px] font-extrabold tracking-widest uppercase transition-colors"
                      style={{ color: activeColor }}
                    >
                      {PRESETS[mode].label}
                    </span>

                    {/* Circular SVG Countdown Dial (Replicating Compose Canvas drawArc) */}
                    <div className="relative w-52 h-52 my-3 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                        {/* Background Track */}
                        <circle
                          cx="100"
                          cy="100"
                          r="82"
                          stroke="#262a33"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        {/* Animated Arc */}
                        <circle
                          cx="100"
                          cy="100"
                          r="82"
                          stroke={activeColor}
                          strokeWidth="12"
                          strokeDasharray={2 * Math.PI * 82}
                          strokeDashoffset={2 * Math.PI * 82 * (1 - progressRatio)}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-500 ease-out"
                        />
                      </svg>

                      {/* Digital Digits Display inside dial */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="font-mono text-4xl font-black text-white tracking-wider">
                          {formattedTime}
                        </span>
                        <span className="text-xs text-zinc-400 mt-1 font-medium">
                          {isRunning ? 'Running' : timeLeft === 0 ? 'Finished!' : 'Ready'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Reset & Start/Pause */}
                    <div className="flex items-center gap-4 mt-1">
                      {/* Reset Button */}
                      <button
                        onClick={resetTimer}
                        title="Reset Timer"
                        className="w-12 h-12 rounded-full bg-[#262a33] hover:bg-[#323742] text-zinc-300 flex items-center justify-center transition active:scale-95"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>

                      {/* Start / Pause Main CTA Button */}
                      <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="h-12 px-8 rounded-full text-white font-bold flex items-center gap-2.5 shadow-lg transition duration-200 active:scale-95"
                        style={{ backgroundColor: activeColor }}
                      >
                        {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                        <span>{isRunning ? 'Pause' : 'Start'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Daily Stats Summary (Compose DailyStatsSummary) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1b1e24] p-3 rounded-2xl border border-zinc-800/60">
                      <p className="text-[10px] font-bold text-zinc-400 tracking-wider">FOCUS CYCLES</p>
                      <p className="text-xl font-black mt-0.5" style={{ color: activeColor }}>
                        {completedSessions}
                      </p>
                      <p className="text-[10px] text-zinc-500">{completedSessions * 25} focused mins</p>
                    </div>

                    <div className="bg-[#1b1e24] p-3 rounded-2xl border border-zinc-800/60">
                      <p className="text-[10px] font-bold text-zinc-400 tracking-wider">TASKS DONE</p>
                      <p className="text-xl font-black text-white mt-0.5">
                        {completedTaskCount} / {tasks.length}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {tasks.length > 0 ? Math.round((completedTaskCount / tasks.length) * 100) : 0}% completed
                      </p>
                    </div>
                  </div>

                  {/* 4. Task Input Field (Compose TaskInputField) */}
                  <div className="bg-[#1b1e24] rounded-2xl p-1.5 pl-3.5 border border-zinc-800/60 flex items-center gap-2 shadow-sm">
                    <input
                      type="text"
                      placeholder="Add a task for this session..."
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      className="bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none flex-1"
                    />
                    <button
                      onClick={addTask}
                      disabled={!newTaskInput.trim()}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white transition disabled:opacity-40"
                      style={{ backgroundColor: newTaskInput.trim() ? activeColor : '#262a33' }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 5. Tasks List Header */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-zinc-300">
                      Today's Tasks ({completedTaskCount}/{tasks.length})
                    </span>
                    {completedTaskCount > 0 && (
                      <button
                        onClick={clearCompleted}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                      >
                        Clear Done
                      </button>
                    )}
                  </div>

                  {/* 6. Tasks List (Compose LazyColumn TaskRow) */}
                  <div className="space-y-2 pb-6">
                    {tasks.length === 0 ? (
                      <div className="bg-[#1b1e24]/60 border border-zinc-800/40 rounded-2xl p-6 text-center space-y-1">
                        <span className="text-2xl">🎯</span>
                        <p className="text-xs font-semibold text-zinc-300">No tasks planned yet</p>
                        <p className="text-[11px] text-zinc-500">
                          Add your key goals above to track what you accomplish.
                        </p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`rounded-xl p-3 flex items-center gap-3 transition-all border ${
                            task.completed
                              ? 'bg-[#1b1e24]/40 border-zinc-800/30'
                              : 'bg-[#1b1e24] border-zinc-800/60 shadow-sm'
                          }`}
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="text-zinc-400 hover:text-white transition"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-500" />
                            )}
                          </button>

                          <span
                            onClick={() => toggleTask(task.id)}
                            className={`flex-1 text-xs cursor-pointer select-none leading-relaxed ${
                              task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                            }`}
                          >
                            {task.text}
                          </span>

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1 rounded transition"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Android Navigation Gesture Bar */}
                <div className="h-6 flex items-center justify-center shrink-0">
                  <div className="w-32 h-1 bg-zinc-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Kotlin Jetpack Compose Code & Quick Setup Guide */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div
            className={`space-y-5 ${
              viewMode === 'code' ? 'lg:col-span-12 max-w-5xl mx-auto w-full' : 'lg:col-span-7'
            }`}
          >
            {/* Project Quick Overview Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">MainActivity.kt — Ready to Copy & Paste</h3>
                    <p className="text-xs text-zinc-400">100% self-contained Jetpack Compose Android app</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy MainActivity.kt'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Technical Specifications checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Standard M3 Only
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Zero third-party libraries or custom assets. Strict AndroidX Material 3.
                  </p>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="font-semibold text-sky-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% Offline
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Requires no internet permissions, no external APIs, and no backend.
                  </p>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Single File Architecture
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Entire app, models, state, circular canvas, and task tracker in one file.
                  </p>
                </div>
              </div>
            </div>

            {/* Android Studio Step-by-Step Guide */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                How to Run in Android Studio (4 Simple Steps)
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-200">Create New Project in Android Studio:</span>
                    <p className="text-zinc-400 mt-0.5">
                      Select <strong className="text-zinc-300">File &gt; New &gt; New Project...</strong>, then choose the{' '}
                      <strong className="text-rose-400">Empty Activity</strong> template (with Jetpack Compose).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-200">Open MainActivity.kt:</span>
                    <p className="text-zinc-400 mt-0.5">
                      Navigate to <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-300">app/src/main/java/&lt;your.package&gt;/MainActivity.kt</code>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-200">Paste Code & Keep Your Package:</span>
                    <p className="text-zinc-400 mt-0.5">
                      Replace the entire file with the code below. If your package name is different from{' '}
                      <code className="text-amber-300">package com.example.myapp</code>, keep your own package line at the top.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-200">Hit Run:</span>
                    <p className="text-zinc-400 mt-0.5">
                      Press <kbd className="bg-zinc-800 border border-zinc-700 px-1 rounded text-zinc-300">Shift + F10</kbd> or click the green Play icon to launch on an emulator or physical device!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Viewer Box */}
            <div className="bg-[#121417] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* Code Header Bar */}
              <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  <span className="ml-2 font-mono text-zinc-400 font-semibold">MainActivity.kt</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="text-[11px] font-mono">Kotlin • Jetpack Compose</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 hover:text-white rounded hover:bg-zinc-800 transition"
                    title="Copy full code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Code Body with Line Numbers */}
              <div className="p-4 overflow-x-auto max-h-[540px] overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700">
                <pre className="text-zinc-300">
                  {MAIN_ACTIVITY_KOTLIN_CODE.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row hover:bg-zinc-800/30">
                      <span className="table-cell pr-4 text-right select-none text-zinc-600 text-[11px] w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell whitespace-pre">{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/80 py-4 px-6 text-center text-xs text-zinc-500">
        FocusFlow: Single-File Android App in Kotlin (Jetpack Compose) • 100% Offline • Standard AndroidX Material 3
      </footer>
    </div>
  );
}
