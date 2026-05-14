import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  Flame, 
  Mic2, 
  Zap,
  Heart
} from 'lucide-react';
import { cn } from 'lib/utils';

interface Message {
  id: string;
  user: string;
  text: string;
  type: 'lyric' | 'theme' | 'chat';
  color: string;
  themeValue?: string;
}

interface Persona {
  id: string;
  name: string;
  vocalStyle: string;
  color: string;
}

const PERSONAS: Persona[] = [
  { id: 'shadyboy', name: 'ShadyBoy', vocalStyle: 'Grit Soul', color: 'from-orange-500 to-red-600' },
  { id: 'auraveda', name: 'AuraVeda', vocalStyle: 'Ethereal Soprano', color: 'from-blue-400 to-purple-600' },
  { id: 'neonpulse', name: 'NeonPulse', vocalStyle: 'Glitch Baritone', color: 'from-green-400 to-cyan-600' },
];

const COLORS = ['text-orange-500', 'text-red-500', 'text-blue-500', 'text-purple-500', 'text-green-500'];
const MOCK_USERS = ['AuraSeeker', 'VibeMaster', 'BassDrop', 'LyricLover', 'SynthSoul', 'NeonDreamer', 'EchoPulse'];
const MOCK_LYRICS = [
  "The velvet cage is now unlocked...",
  "Two broken smiles in the rain...",
  "Neon lights reflecting in the puddles...",
  "Searching for a ghost in the machine...",
  "Heartbeat syncopated with the rhythm...",
  "Lost in the frequency of your love..."
];
const MOCK_THEMES = ["Cyberpunk Soul", "Dark Cabaret", "Rio Drift Phonk", "90s R&B Nostalgia", "Ethereal Trap", "Soulful House", "Dark Techno", "Ambient Drift"];

const normalizeTheme = (text: string) => {
  const normalized = text.toLowerCase().trim();
  const keywords = ["soul", "trap", "phonk", "r&b", "nostalgia", "cyberpunk", "dark", "ethereal", "cabaret", "techno", "house", "ambient"];
  for (const kw of keywords) {
    if (normalized.includes(kw)) return kw.toUpperCase();
  }
  return normalized.toUpperCase();
};

export function LiveSession({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [crowdEmotion, setCrowdEmotion] = useState(0.75);
  const [activeThemes, setActiveThemes] = useState<string[]>(["Soul", "Electronic", "Dark"]);
  const [themeVotes, setThemeVotes] = useState<Record<string, number>>({
    "Cyberpunk": 1240,
    "Soul": 890,
    "Dark": 450
  });
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [liveParams, setLiveParams] = useState({
    key: "B Minor",
    bpm: 125,
    energy: 0.7,
    sadness: 0.3,
    harmonies: false,
    genre: "Soul",
    vocalCrackle: 0.2
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [listeners, setListeners] = useState(2412891);

  // Simulate "millions" of users chatting
  useEffect(() => {
    const interval = setInterval(() => {
      const isLyric = Math.random() > 0.7;
      const isTheme = Math.random() > 0.8;
      
      const themeText = isTheme ? MOCK_THEMES[Math.floor(Math.random() * MOCK_THEMES.length)] : null;
      const normalized = themeText ? normalizeTheme(themeText) : undefined;
      
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
        text: isLyric 
          ? MOCK_LYRICS[Math.floor(Math.random() * MOCK_LYRICS.length)]
          : isTheme 
            ? `Let's try ${themeText}!`
            : "This vibe is insane! 🔥",
        type: isLyric ? 'lyric' : isTheme ? 'theme' : 'chat',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        themeValue: normalized
      };

      setMessages(prev => [...prev.slice(-50), newMessage]);
      
      if (isTheme && normalized) {
        setThemeVotes(prev => ({
          ...prev,
          [normalized]: (prev[normalized] || 0) + Math.floor(Math.random() * 10) + 1
        }));
      }

      // Randomly shift crowd emotion
      setCrowdEmotion(prev => Math.max(0.1, Math.min(1, prev + (Math.random() - 0.5) * 0.1)));
      
      // Dynamic listener count
      setListeners(prev => prev + Math.floor((Math.random() - 0.4) * 100));
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Update active themes based on top votes
  useEffect(() => {
    const sortedThemes = Object.entries(themeVotes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);
    
    setActiveThemes(sortedThemes);
    
    // Influence track generation with the top theme
    if (sortedThemes.length > 0 && sortedThemes[0] !== liveParams.genre) {
      setLiveParams(prev => ({ ...prev, genre: sortedThemes[0] }));
    }
  }, [themeVotes, liveParams.genre]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVote = (theme: string) => {
    setThemeVotes(prev => ({
      ...prev,
      [theme]: (prev[theme] || 0) + 10
    }));
    setCrowdEmotion(prev => Math.min(1, prev + 0.02));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const isTheme = inputText.toLowerCase().includes('theme') || inputText.length < 15;
    const themeMatch = inputText.match(/theme:\s*(.*)/i);
    const themeText = themeMatch ? themeMatch[1] : (isTheme ? inputText : null);
    const normalized = themeText ? normalizeTheme(themeText) : undefined;

    const newMessage: Message = {
      id: Date.now().toString(),
      user: "You",
      text: inputText,
      type: inputText.includes('"') ? 'lyric' : (themeText ? 'theme' : 'chat'),
      color: 'text-white',
      themeValue: normalized
    };

    // Emotional Feedback Loop Logic
    const lowerText = inputText.toLowerCase();
    if (lowerText.includes('💔') || lowerText.includes('heartbreak')) {
      setLiveParams(prev => ({ 
        ...prev, 
        sadness: Math.min(1, prev.sadness + 0.2), 
        key: "B Minor",
        vocalCrackle: Math.min(1, prev.vocalCrackle + 0.3)
      }));
    } else if (lowerText.includes('sadder') || lowerText.includes('darker')) {
      setLiveParams(prev => ({ ...prev, sadness: Math.min(1, prev.sadness + 0.1), key: "D# Minor" }));
    } else if (lowerText.includes('energy') || lowerText.includes('faster')) {
      setLiveParams(prev => ({ ...prev, energy: Math.min(1, prev.energy + 0.1), bpm: prev.bpm + 5 }));
    } else if (lowerText.includes('harmonies')) {
      setLiveParams(prev => ({ ...prev, harmonies: true }));
    } else if (lowerText.includes('oldies')) {
      setLiveParams(prev => ({ ...prev, genre: "Chicano Oldies" }));
    }

    setMessages(prev => [...prev, newMessage]);
    
    if (themeText) {
      const normalized = normalizeTheme(themeText);
      setThemeVotes(prev => ({
        ...prev,
        [normalized]: (prev[normalized] || 0) + 50 // User boost
      }));
    }

    setInputText('');
    
    // Boost emotion on user interaction
    setCrowdEmotion(prev => Math.min(1, prev + 0.05));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col"
    >
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <div>
            <h2 className="text-xl font-bold tracking-tighter uppercase">Live Studio Session: {currentPersona.name}</h2>
            <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {listeners.toLocaleString()} LISTENING</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> SONANCE PRO v4.2 LIVE</span>
            </div>
          </div>
        </div>
        
        {/* Persona Selector */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentPersona(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all",
                currentPersona.id === p.id 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Performance Visualizer */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-12 overflow-hidden">
          {/* Dynamic Crowd Emotion Visualizer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Shifting Gradient Background */}
            <motion.div 
              animate={{ 
                background: crowdEmotion > 0.7 
                  ? `radial-gradient(circle at 50% 50%, rgba(249, 115, 22, ${crowdEmotion * 0.2}), transparent 70%)`
                  : `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, ${crowdEmotion * 0.2}), transparent 70%)`,
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0"
            />
            
            {/* Animated Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`, 
                  opacity: 0,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  y: [`${Math.random() * 100}%`, `${Math.random() * 100 - 20}%`],
                  opacity: [0, crowdEmotion * 0.4, 0],
                  scale: [1, 1.5, 1],
                  x: [`${Math.random() * 100}%`, `${Math.random() * 100 + (Math.random() - 0.5) * 10}%`]
                }}
                transition={{ 
                  duration: 5 + Math.random() * 5, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 5
                }}
                className={cn(
                  "absolute w-1 h-1 rounded-full blur-[1px]",
                  crowdEmotion > 0.6 ? "bg-orange-500" : "bg-blue-400"
                )}
              />
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden opacity-20">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={cn("absolute inset-0 bg-gradient-to-br blur-[120px] transition-colors duration-1000", currentPersona.color)}
            />
          </div>

          <div className="relative z-10 text-center space-y-12 w-full max-w-2xl">
            {/* Trending Themes Overlay */}
            <div className="flex justify-center items-end gap-6 mb-8 h-16">
              {activeThemes.map((theme, i) => (
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: i === 0 ? 1.2 : 1,
                  }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "px-6 py-2.5 rounded-full border flex items-center gap-3 backdrop-blur-xl transition-all duration-500",
                    i === 0 
                      ? "bg-orange-500 text-black border-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.4)]" 
                      : "bg-white/5 border-white/10 text-white/40"
                  )}
                >
                  <TrendingUp className={cn("w-4 h-4", i === 0 ? "text-black" : "text-white/40")} />
                  <span className={cn("text-xs font-black tracking-[0.2em] uppercase", i === 0 ? "text-black" : "text-white/40")}>
                    {theme}
                  </span>
                  {i === 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Flame className="w-4 h-4 text-black" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="space-y-4">
              <p className="text-orange-500 font-mono text-[10px] tracking-[0.3em] uppercase">Aggregating Crowd Emotion</p>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  animate={{ width: `${crowdEmotion * 100}%` }}
                  className={cn("h-full bg-gradient-to-r transition-colors duration-1000", currentPersona.color)}
                />
                {/* Pulse Glow */}
                <motion.div
                  animate={{ 
                    opacity: [0, 0.5, 0],
                    x: ['-100%', '100%']
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-white/20 blur-sm"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-white/20 uppercase tracking-widest">
                <span>Melancholic</span>
                <span>Euphoric</span>
              </div>
            </div>

            <div className="aspect-square w-64 mx-auto relative group">
              <div className={cn("absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000", currentPersona.color.split(' ')[0].replace('from-', 'bg-'))} />
              <div className="relative w-full h-full border-2 border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className={cn("absolute inset-0 opacity-10 transition-colors duration-1000", currentPersona.color.split(' ')[0].replace('from-', 'bg-'))}
                />
                <Mic2 className="w-16 h-16 text-white" />
              </div>
              
              {/* Floating Particles representing "Themes" */}
              {activeThemes.map((theme, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -100],
                    x: [0, (i % 2 === 0 ? 50 : -50)],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold tracking-widest uppercase whitespace-nowrap"
                >
                  {theme}
                </motion.div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-4xl font-black tracking-tighter uppercase italic">
                {crowdEmotion > 0.8 ? "The Velvet Cage" : "Neon Raindrops"}
              </h3>
              <p className="text-white/40 font-serif italic text-lg">
                "The velvet cage is now unlocked, searching for a ghost in the machine..."
              </p>
            </div>

            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <p className="text-[10px] font-mono text-white/20 uppercase mb-2">Current Key</p>
                <p className="text-xl font-bold">{liveParams.key}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-white/20 uppercase mb-2">BPM</p>
                <p className="text-xl font-bold">{liveParams.bpm}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-white/20 uppercase mb-2">Vocal Style</p>
                <p className="text-xl font-bold">{currentPersona.vocalStyle}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-white/20 uppercase mb-2">Genre Blend</p>
                <p className="text-xl font-bold">{liveParams.genre}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-white/20 uppercase mb-2">Vocal Crackle</p>
                <p className="text-xl font-bold">{(liveParams.vocalCrackle * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Chat */}
        <div className="w-96 border-l border-white/10 flex flex-col bg-black/40">
          <div className="p-4 border-b border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold tracking-widest uppercase">Live Feedback</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                <TrendingUp className="w-3 h-3" />
                <span>TRENDING</span>
              </div>
            </div>
            
            {/* Trending Themes Aggregation */}
            <div className="space-y-2">
              {Object.entries(themeVotes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([theme, votes], i) => (
                  <div key={theme} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold",
                        i === 0 ? "bg-orange-500 text-black" : "bg-white/10 text-white/40"
                      )}>
                        {i + 1}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold tracking-widest uppercase",
                        i === 0 ? "text-white" : "text-white/40"
                      )}>
                        {theme}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-white/20">{votes.toLocaleString()} VOTES</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", msg.color)}>
                      {msg.user}
                    </span>
                    {msg.type === 'lyric' && <Flame className="w-3 h-3 text-orange-500" />}
                    {msg.type === 'theme' && <Zap className="w-3 h-3 text-blue-500" />}
                  </div>
                  
                  {msg.type === 'theme' && msg.themeValue && (
                    <button 
                      onClick={() => handleVote(msg.themeValue!)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <Heart className="w-2.5 h-2.5 text-red-500" />
                      <span className="text-[8px] font-mono text-white/60">
                        {themeVotes[msg.themeValue]?.toLocaleString() || 0}
                      </span>
                    </button>
                  )}
                </div>
                <p className={cn(
                  "text-sm",
                  msg.type === 'lyric' ? "font-serif italic text-white/90" : "text-white/60"
                )}>
                  {msg.text}
                </p>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type lyrics or themes..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 transition-colors pr-12"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-500 hover:text-white transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="mt-2 text-[8px] font-mono text-white/20 uppercase text-center">
              Your input influences the live Sonance Pro performance
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
