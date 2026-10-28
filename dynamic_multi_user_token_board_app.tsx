import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Award, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  RotateCcw, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Users, 
  BarChart3, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Clock, 
  Download, 
  Key, 
  Check, 
  X, 
  Star, 
  Zap, 
  Heart, 
  Flame, 
  Smile, 
  BookOpen, 
  ShieldAlert, 
  ChevronRight,
  Copy
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION (Mandatory Pattern)
// ==========================================
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "demo-api-key",
      authDomain: "demo-app.firebaseapp.com",
      projectId: "demo-app",
      storageBucket: "demo-app.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'token-board-app-v1';

// ==========================================
// AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
const playSound = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'token-add') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'token-remove') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } else if (type === 'alarm') {
      [600, 800, 600, 800].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.12);
      });
    }
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};

// ==========================================
// TOKEN THEMES CONFIGURATION
// ==========================================
const TOKEN_THEMES = [
  { id: 'star', name: 'Gold Stars', icon: '⭐', color: 'from-amber-400 to-yellow-500', shadow: 'shadow-amber-500/50' },
  { id: 'dino', name: 'Dinosaurs', icon: '🦖', color: 'from-emerald-400 to-green-600', shadow: 'shadow-emerald-500/50' },
  { id: 'rocket', name: 'Space Rockets', icon: '🚀', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/50' },
  { id: 'superhero', name: 'Superheroes', icon: '🦸', color: 'from-red-500 to-rose-700', shadow: 'shadow-red-500/50' },
  { id: 'coin', name: 'Gold Coins', icon: '🪙', color: 'from-yellow-300 to-amber-600', shadow: 'shadow-yellow-500/50' },
  { id: 'paw', name: 'Paw Prints', icon: '🐾', color: 'from-teal-400 to-cyan-600', shadow: 'shadow-teal-500/50' },
  { id: 'unicorn', name: 'Unicorns', icon: '🦄', color: 'from-fuchsia-400 to-pink-600', shadow: 'shadow-pink-500/50' },
  { id: 'pizza', name: 'Pizza Slices', icon: '🍕', color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-500/50' },
  { id: 'gem', name: 'Diamonds', icon: '💎', color: 'from-sky-300 to-blue-500', shadow: 'shadow-sky-500/50' },
  { id: 'smile', name: 'Smiley Faces', icon: '😊', color: 'from-yellow-400 to-orange-400', shadow: 'shadow-yellow-400/50' }
];

const PRESET_TAGS = ['Grade 1', 'Grade 2', 'Grade 3', 'Speech Therapy', 'ABA', 'OT', 'IEP Goal', 'Home'];

// ==========================================
// DEFAULT / DEMO SEED DATA
// ==========================================
const INITIAL_STUDENTS = [
  { id: 'st-1', name: 'Liam Johnson', avatar: '🦁', tag: 'ABA', notes: 'Responds best to dinosaur tokens and visual timers.' },
  { id: 'st-2', name: 'Sophia Chen', avatar: '🦄', tag: 'Speech Therapy', notes: 'Working on clear articulation during reading exercises.' },
  { id: 'st-3', name: 'Ethan Miller', avatar: '🚀', tag: 'Grade 2', notes: 'Token reinforcement for staying seated during group tasks.' }
];

const INITIAL_BOARDS = [
  {
    id: 'board-1',
    studentId: 'st-1',
    studentName: 'Liam Johnson',
    targetGoal: 'Quiet hands & feet during group instructions',
    rewardTitle: '10 mins Minecraft / iPad time',
    rewardIcon: '🎮',
    totalTokens: 5,
    currentTokens: 3,
    tokenStyle: 'dino',
    shareCode: 'TB-1029',
    updatedAt: Date.now()
  },
  {
    id: 'board-2',
    studentId: 'st-2',
    studentName: 'Sophia Chen',
    targetGoal: 'Complete 3 speech articulation cards',
    rewardTitle: 'Bubble Blowing Session',
    rewardIcon: '🫧',
    totalTokens: 5,
    currentTokens: 5,
    tokenStyle: 'unicorn',
    shareCode: 'TB-4832',
    updatedAt: Date.now()
  },
  {
    id: 'board-3',
    studentId: 'st-3',
    studentName: 'Ethan Miller',
    targetGoal: 'On-task math worksheet completion',
    rewardTitle: 'Building Lego Starship',
    rewardIcon: '🧱',
    totalTokens: 8,
    currentTokens: 2,
    tokenStyle: 'rocket',
    shareCode: 'TB-9921',
    updatedAt: Date.now()
  }
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  // Auth & System State
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // 'dashboard', 'board', 'analytics', 'share'
  const [focusMode, setFocusMode] = useState(false);

  // Firestore Live Data States
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [boards, setBoards] = useState(INITIAL_BOARDS);
  const [sessionLogs, setSessionLogs] = useState([]);

  // Active Board Selection
  const [selectedStudentId, setSelectedStudentId] = useState('st-1');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isRewardCelebrationOpen, setIsRewardCelebrationOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // Reward Timer State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins default
  const [timerInitial, setTimerInitial] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Confetti Canvas Ref
  const confettiCanvasRef = useRef(null);

  // 1. AUTHENTICATION EFFECT (Mandatory Pattern Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Auth initialization fallback to anonymous mode:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // 2. FIRESTORE SYNC EFFECT (Mandatory Pattern Rules 1 & 2)
  useEffect(() => {
    if (!user) return;

    // Strict path using public shared collection for multi-user board updates
    const studentsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const boardsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'boards');
    const logsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');

    // Subscribe Students
    const unsubStudents = onSnapshot(studentsColRef, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(fetched);
      } else {
        // Seed default students if empty
        INITIAL_STUDENTS.forEach(st => {
          setDoc(doc(studentsColRef, st.id), st).catch(console.error);
        });
      }
    }, (err) => console.error("Students sync error:", err));

    // Subscribe Boards
    const unsubBoards = onSnapshot(boardsColRef, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBoards(fetched);
      } else {
        // Seed default boards if empty
        INITIAL_BOARDS.forEach(b => {
          setDoc(doc(boardsColRef, b.id), b).catch(console.error);
        });
      }
    }, (err) => console.error("Boards sync error:", err));

    // Subscribe Logs
    const unsubLogs = onSnapshot(logsColRef, (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSessionLogs(fetched);
      }
    }, (err) => console.error("Logs sync error:", err));

    return () => {
      unsubStudents();
      unsubBoards();
      unsubLogs();
    };
  }, [user]);

  // Derived Active Board
  const activeBoard = useMemo(() => {
    return boards.find(b => b.studentId === selectedStudentId) || boards[0] || null;
  }, [boards, selectedStudentId]);

  const activeStudent = useMemo(() => {
    return students.find(s => s.id === (activeBoard?.studentId || selectedStudentId)) || students[0] || null;
  }, [students, activeBoard, selectedStudentId]);

  const activeTheme = useMemo(() => {
    if (!activeBoard) return TOKEN_THEMES[0];
    return TOKEN_THEMES.find(t => t.id === activeBoard.tokenStyle) || TOKEN_THEMES[0];
  }, [activeBoard]);

  // Handle Token Increment/Decrement
  const handleTokenClick = async (index) => {
    if (!activeBoard) return;
    const isEarning = index >= activeBoard.currentTokens;
    const newCount = isEarning ? index + 1 : index;

    playSound(isEarning ? 'token-add' : 'token-remove', soundEnabled);

    const updatedBoard = {
      ...activeBoard,
      currentTokens: newCount,
      updatedAt: Date.now()
    };

    // Optimistic UI
    setBoards(prev => prev.map(b => b.id === activeBoard.id ? updatedBoard : b));

    // Firebase Sync
    if (user) {
      try {
        const boardRef = doc(db, 'artifacts', appId, 'public', 'data', 'boards', activeBoard.id);
        await updateDoc(boardRef, { currentTokens: newCount, updatedAt: Date.now() });
      } catch (err) {
        console.error("Failed to update token count:", err);
      }
    }

    // Check Board Completion
    if (newCount >= activeBoard.totalTokens) {
      setTimeout(() => {
        triggerCelebration();
      }, 250);
    }
  };

  // Trigger Board Celebration & Fanfare
  const triggerCelebration = () => {
    playSound('fanfare', soundEnabled);
    setIsRewardCelebrationOpen(true);
    fireConfetti();

    // Log completion to session history
    if (user && activeBoard && activeStudent) {
      const newLog = {
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        targetGoal: activeBoard.targetGoal,
        rewardTitle: activeBoard.rewardTitle,
        rewardIcon: activeBoard.rewardIcon || '🎁',
        tokensEarned: activeBoard.totalTokens,
        timestamp: Date.now()
      };

      const logsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
      addDoc(logsColRef, newLog).catch(err => console.error("Error logging session:", err));
    }
  };

  // Canvas Confetti Generator
  const fireConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let stillAlive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.opacity -= 0.012;
        p.rotation += p.spin;

        if (p.opacity > 0) {
          stillAlive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (stillAlive) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();
  };

  // Reset Board State
  const handleResetBoard = async () => {
    if (!activeBoard) return;
    playSound('token-remove', soundEnabled);
    const updatedBoard = { ...activeBoard, currentTokens: 0, updatedAt: Date.now() };

    setBoards(prev => prev.map(b => b.id === activeBoard.id ? updatedBoard : b));

    if (user) {
      try {
        const boardRef = doc(db, 'artifacts', appId, 'public', 'data', 'boards', activeBoard.id);
        await updateDoc(boardRef, { currentTokens: 0, updatedAt: Date.now() });
      } catch (err) {
        console.error("Failed to reset board:", err);
      }
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playSound('alarm', soundEnabled);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, soundEnabled]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Join Board via Share Code
  const handleJoinBoard = () => {
    if (!joinCodeInput.trim()) return;
    const cleanCode = joinCodeInput.trim().toUpperCase();
    const foundBoard = boards.find(b => b.shareCode === cleanCode || b.shareCode === `TB-${cleanCode}`);
    
    if (foundBoard) {
      setSelectedStudentId(foundBoard.studentId);
      setActiveTab('board');
      setJoinCodeInput('');
    } else {
      alert("Board Share Code not found. Please check and try again.");
    }
  };

  // Copy Share Link
  const copyShareCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const studentData = {
      name: formData.get('name'),
      avatar: formData.get('avatar') || '⭐',
      tag: formData.get('tag') || 'General',
      notes: formData.get('notes') || ''
    };

    if (editingStudent) {
      const studentId = editingStudent.id;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...studentData } : s));
      if (user) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId), studentData);
      }
    } else {
      const newId = `st-${Date.now()}`;
      const newStudent = { id: newId, ...studentData };
      setStudents(prev => [...prev, newStudent]);
      
      // Auto create default board for new student
      const newBoard = {
        id: `board-${Date.now()}`,
        studentId: newId,
        studentName: studentData.name,
        targetGoal: 'On-task positive behavior',
        rewardTitle: 'Choice Time / Preferred Activity',
        rewardIcon: '🎁',
        totalTokens: 5,
        currentTokens: 0,
        tokenStyle: 'star',
        shareCode: `TB-${Math.floor(1000 + Math.random() * 9000)}`,
        updatedAt: Date.now()
      };
      setBoards(prev => [...prev, newBoard]);

      if (user) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', newId), newStudent);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boards', newBoard.id), newBoard);
      }
    }

    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  // Save Board Settings
  const handleSaveBoard = async (e) => {
    e.preventDefault();
    if (!activeBoard) return;

    const formData = new FormData(e.target);
    const boardData = {
      targetGoal: formData.get('targetGoal'),
      rewardTitle: formData.get('rewardTitle'),
      rewardIcon: formData.get('rewardIcon') || '🎁',
      totalTokens: parseInt(formData.get('totalTokens'), 10),
      tokenStyle: formData.get('tokenStyle'),
      updatedAt: Date.now()
    };

    // If total tokens reduced below current, clamp it
    if (boardData.totalTokens < activeBoard.currentTokens) {
      boardData.currentTokens = boardData.totalTokens;
    }

    setBoards(prev => prev.map(b => b.id === activeBoard.id ? { ...b, ...boardData } : b));

    if (user) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'boards', activeBoard.id), boardData);
    }

    setIsBoardModalOpen(false);
  };

  // Filtered Roster Students
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchesSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            st.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = selectedTag === 'All' || st.tag === selectedTag;
      return matchesSearch && matchesTag;
    });
  }, [students, searchTerm, selectedTag]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans`}>
      {/* Canvas Layer for Celebration Confetti */}
      <canvas 
        ref={confettiCanvasRef} 
        className="fixed inset-0 pointer-events-none z-50"
      />

      {/* TOP HEADER NAVIGATION (Hidden in Focus Mode) */}
      {!focusMode && (
        <header className={`border-b sticky top-0 z-30 backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo & App Title */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl shadow-lg shadow-amber-500/30 text-white font-bold flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  TokenStar
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Dynamic Multi-User Token Boards</p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'board'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Active Board</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Roster</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('share')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'share'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">Join Code</span>
              </button>
            </nav>

            {/* Quick Utility Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
                className={`p-2 rounded-xl border transition ${
                  darkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                title="Toggle Dark Mode"
                className={`p-2 rounded-xl border transition ${
                  darkMode ? 'border-slate-800 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================== */}
        {/* TAB 1: ACTIVE TOKEN BOARD VIEW             */}
        {/* ========================================== */}
        {activeTab === 'board' && activeBoard && (
          <div className="space-y-6">
            {/* Student Selector Bar & Quick Controls */}
            {!focusMode && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeStudent?.avatar || '⭐'}</span>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Select Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="text-lg font-bold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                    >
                      {students.map(st => (
                        <option key={st.id} value={st.id} className="dark:bg-slate-800">
                          {st.name} ({st.tag})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsBoardModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Board
                  </button>

                  <button
                    onClick={handleResetBoard}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>

                  <button
                    onClick={() => copyShareCode(activeBoard.shareCode)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    {copiedCode ? "Code Copied!" : activeBoard.shareCode}
                  </button>

                  <button
                    onClick={() => setFocusMode(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-600 transition"
                  >
                    <Maximize2 className="w-4 h-4" /> Focus Mode
                  </button>
                </div>
              </div>
            )}

            {/* FOCUS MODE HEADER TOGGLE */}
            {focusMode && (
              <div className="flex justify-between items-center bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeStudent?.avatar}</span>
                  <span className="font-bold text-lg">{activeStudent?.name}</span>
                  <span className="text-xs bg-slate-700 px-2.5 py-1 rounded-full">{activeBoard.shareCode}</span>
                </div>
                <button
                  onClick={() => setFocusMode(false)}
                  className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Minimize2 className="w-4 h-4" /> Exit Fullscreen
                </button>
              </div>
            )}

            {/* MAIN TOKEN BOARD DISPLAY CANVAS */}
            <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl ${
              darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'
            } p-6 sm:p-8`}>
              
              {/* TARGET & REWARD BANNER GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Target Behavior Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-start gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Target Behavior / Goal</span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {activeBoard.targetGoal}
                    </h2>
                  </div>
                </div>

                {/* Reward Target Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-start gap-4">
                  <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md text-xl">
                    {activeBoard.rewardIcon || '🎁'}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Earning Reward</span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {activeBoard.rewardTitle}
                    </h2>
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tokens Progress</span>
                  <span className="text-sm font-extrabold text-amber-500">
                    {activeBoard.currentTokens} / {activeBoard.totalTokens} Tokens
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${(activeBoard.currentTokens / activeBoard.totalTokens) * 100}%` }}
                  />
                </div>
              </div>

              {/* TOKEN GRID DISPLAY */}
              <div className={`grid gap-4 sm:gap-6 justify-center my-6 ${
                activeBoard.totalTokens <= 5 
                  ? 'grid-cols-3 sm:grid-cols-5 max-w-3xl mx-auto' 
                  : activeBoard.totalTokens <= 8 
                  ? 'grid-cols-4 sm:grid-cols-4 max-w-3xl mx-auto' 
                  : 'grid-cols-4 sm:grid-cols-6 max-w-4xl mx-auto'
              }`}>
                {Array.from({ length: activeBoard.totalTokens }).map((_, idx) => {
                  const isEarned = idx < activeBoard.currentTokens;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTokenClick(idx)}
                      className={`group relative aspect-square rounded-3xl flex items-center justify-center border-4 transition-all duration-300 transform active:scale-95 ${
                        isEarned
                          ? `bg-gradient-to-br ${activeTheme.color} border-white dark:border-slate-800 shadow-lg ${activeTheme.shadow} scale-100 rotate-0`
                          : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 hover:border-amber-400/60 scale-95'
                      }`}
                    >
                      {isEarned ? (
                        <span className="text-4xl sm:text-6xl drop-shadow-md transition-transform transform group-hover:scale-110">
                          {activeTheme.icon}
                        </span>
                      ) : (
                        <span className="text-2xl opacity-20 filter grayscale">
                          {activeTheme.icon}
                        </span>
                      )}

                      {/* Ripple Pulsing Halo on Token Earn */}
                      {isEarned && (
                        <div className="absolute inset-0 rounded-3xl bg-white/20 animate-ping opacity-20 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ACTION FOOTER */}
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleTokenClick(activeBoard.currentTokens)}
                  disabled={activeBoard.currentTokens >= activeBoard.totalTokens}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus className="w-5 h-5" /> Grant Token
                </button>

                <button
                  onClick={triggerCelebration}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold text-base shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition"
                >
                  <Sparkles className="w-5 h-5" /> Trigger Reward Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: STUDENT ROSTER & GOALS              */}
        {/* ========================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Student Roster</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage student profiles, reinforcement preferences, and target boards.</p>
              </div>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition"
              >
                <Plus className="w-5 h-5" /> Add New Student
              </button>
            </div>

            {/* SEARCH & TAG FILTER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students by name or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full py-3 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All">All Program Tags</option>
                  {PRESET_TAGS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* STUDENT ROSTER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => {
                const board = boards.find(b => b.studentId === student.id);
                return (
                  <div
                    key={student.id}
                    className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Avatar & Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl p-2 bg-slate-100 dark:bg-slate-700 rounded-2xl">{student.avatar}</span>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{student.name}</h3>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 mt-0.5">
                              {student.tag}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setIsStudentModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Active Board Target Brief */}
                      {board && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 mb-4 space-y-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Goal</div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{board.targetGoal}</p>
                          <div className="flex items-center justify-between text-xs font-bold text-amber-500 pt-1">
                            <span>Tokens: {board.currentTokens}/{board.totalTokens}</span>
                            <span>Reward: {board.rewardIcon}</span>
                          </div>
                        </div>
                      )}

                      {student.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic mb-4">
                          "{student.notes}"
                        </p>
                      )}
                    </div>

                    {/* Launch Board Action */}
                    <button
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setActiveTab('board');
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      Open Token Board <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: SESSION HISTORY & ANALYTICS         */}
        {/* ========================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Session Progress & Logs</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track completed token cycles and timestamped reward redemptions.</p>
            </div>

            {/* Stat Counters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Total Rewards Completed</span>
                <div className="text-4xl font-extrabold mt-1">{sessionLogs.length}</div>
              </div>

              <div className="p-5 rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Active Roster Size</span>
                <div className="text-4xl font-extrabold mt-1">{students.length}</div>
              </div>

              <div className="p-5 rounded-3xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Active Shared Boards</span>
                <div className="text-4xl font-extrabold mt-1">{boards.length}</div>
              </div>
            </div>

            {/* LOGS TABLE */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Timestamped Reward Redemptions</h3>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Print Summary
                </button>
              </div>

              {sessionLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No board completions logged yet today.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {sessionLogs.map(log => (
                    <div key={log.id || Math.random()} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{log.rewardIcon || '🎁'}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{log.studentName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Goal: {log.targetGoal}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 mb-1">
                          {log.tokensEarned} Tokens Earned
                        </span>
                        <div className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: JOIN BOARD CODE / SHARE             */}
        {/* ========================================== */}
        {activeTab === 'share' && (
          <div className="max-w-xl mx-auto py-8 text-center space-y-6">
            <div className="p-4 bg-amber-500/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-amber-500">
              <Key className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black">Enter Board Share Code</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter a 6-character code (e.g., <span className="font-mono font-bold text-amber-500">TB-1029</span>) provided by a teacher or parent to open their live student token board.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Code (e.g. TB-1029)"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                className="flex-1 px-4 py-3.5 text-center text-lg font-mono font-bold uppercase rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleJoinBoard}
                className="px-6 py-3.5 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition"
              >
                Join Board
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* MODAL 1: ADD / EDIT STUDENT PROFILE        */}
      {/* ========================================== */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingStudent ? "Edit Student Profile" : "Add New Student"}</h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Student Full Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingStudent?.name || ''}
                  placeholder="e.g. Liam Johnson"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Avatar Emoji</label>
                  <input
                    name="avatar"
                    type="text"
                    defaultValue={editingStudent?.avatar || '🦁'}
                    placeholder="e.g. 🦁, 🚀, 🦄"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Program Tag</label>
                  <select
                    name="tag"
                    defaultValue={editingStudent?.tag || 'ABA'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {PRESET_TAGS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Reinforcement / Clinical Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingStudent?.notes || ''}
                  placeholder="Specific student interests, favorite rewards, sensory preferences..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-md shadow-amber-500/20 hover:bg-amber-600"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EDIT TOKEN BOARD CONFIGURATION    */}
      {/* ========================================== */}
      {isBoardModalOpen && activeBoard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Customize Token Board</h3>
              <button onClick={() => setIsBoardModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBoard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Behavior / Goal</label>
                <input
                  name="targetGoal"
                  type="text"
                  required
                  defaultValue={activeBoard.targetGoal}
                  placeholder="e.g. Quiet hands during math instruction"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Reward Activity</label>
                  <input
                    name="rewardTitle"
                    type="text"
                    required
                    defaultValue={activeBoard.rewardTitle}
                    placeholder="e.g. 5 mins Lego time"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Icon</label>
                  <input
                    name="rewardIcon"
                    type="text"
                    defaultValue={activeBoard.rewardIcon || '🎁'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Tokens</label>
                  <select
                    name="totalTokens"
                    defaultValue={activeBoard.totalTokens}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {[3, 5, 8, 10, 12].map(num => (
                      <option key={num} value={num}>{num} Tokens</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Token Style</label>
                  <select
                    name="tokenStyle"
                    defaultValue={activeBoard.tokenStyle}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {TOKEN_THEMES.map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.icon} {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBoardModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-md shadow-amber-500/20 hover:bg-amber-600"
                >
                  Save Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: REWARD CELEBRATION & BREAK TIMER  */}
      {/* ========================================== */}
      {isRewardCelebrationOpen && activeBoard && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-5xl shadow-xl shadow-amber-500/30 animate-bounce">
              {activeBoard.rewardIcon || '🎉'}
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">
                GREAT JOB, {activeStudent?.name?.toUpperCase() || 'STUDENT'}!
              </h2>
              <p className="text-lg font-bold text-amber-500 mt-1">
                You earned: {activeBoard.rewardTitle}!
              </p>
            </div>

            {/* REWARD COUNTDOWN TIMER CONTROL */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block">Reward Break Timer</span>
              
              <div className="text-5xl font-mono font-black text-slate-800 dark:text-slate-100 tracking-wider">
                {formatTimer(timerSeconds)}
              </div>

              {/* Timer Preset Buttons */}
              <div className="flex justify-center gap-2">
                {[120, 300, 600].map(secs => (
                  <button
                    key={secs}
                    onClick={() => {
                      setTimerSeconds(secs);
                      setTimerInitial(secs);
                      setIsTimerRunning(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                      timerInitial === secs 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {secs / 60} Mins
                  </button>
                ))}
              </div>

              {/* Timer Play / Pause Controls */}
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition"
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isTimerRunning ? "Pause Timer" : "Start Timer"}
                </button>

                <button
                  onClick={() => {
                    setTimerSeconds(timerInitial);
                    setIsTimerRunning(false);
                  }}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setIsRewardCelebrationOpen(false);
                  handleResetBoard();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition"
              >
                Reset & Start Next Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}