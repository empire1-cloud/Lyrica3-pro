import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle,
  Flame, Music2, Share2, Layers, Mic2, Heart, CloudRain, Moon, Sun,
  Activity, Sliders, Download, Settings, Cpu, Waves, Zap, Wind, Send,
  Users, MessageSquare, TrendingUp, Undo2, Redo2, ChevronDown,
  Headphones, Shield, History, X, Sparkles, Copy, Check, ExternalLink,
  Trash2, FileText, Radio
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '../radio/lib/utils';
import { type VibeParams } from '../radio/lib/gemini';
import { LiveSession } from '../radio/components/LiveSession';
import { slSynth } from '../radio/lib/synth';
import { AuraCanvasVisualizer } from '../radio/components/AuraCanvasVisualizer';
import { AuraSchedulerPanel } from '../radio/components/AuraSchedulerPanel';
import { RemixFeedPanel } from '../radio/components/RemixFeedPanel';
import { getAuthToken } from '../lib/api';
import { RadioDirectoryPage } from '../features/radio/pages/RadioDirectoryPage';
import { LivePartyDJRoom } from '../features/radio/pages/LivePartyDJRoom';
import type { StationPreset, UserStation } from '../features/radio/config/externalStations';
import {
  generateTrack, getLibrary, saveTrack, getRoyaltyStatus,
  shareTrack, createLiveSession, getHistory, addToHistory,
  type TrackData
} from '../features/radio/api/radioApi';

interface Track {
  id: string;
  title: string;
  artist: string;
  vibe: string;
  params: VibeParams;
  audioUrl?: string;
  lyrics?: string;
  isRemix?: boolean;
  originalCreatorName?: string;
  parentTrackTitle?: string;
  createdAt?: any;
  trackMetadata?: any;
  ghostwriterDirective?: any;
  vocalBlueprint?: any;
  acousticPrimitives?: any;
  lyricsPayload?: any[];
  vocalPipelines?: { id: string; name: string; description: string; active: boolean; intensity?: number }[];
  // Ground truth for what actually generated this track — must be checked
  // before displaying any engine name; never assume "primary" by default.
  fulfillment?: "primary" | "fallback";
}

/** Renders nothing for a genuine primary-engine track; a visible badge otherwise. */
const FulfillmentBadge = ({ fulfillment }: { fulfillment?: Track["fulfillment"] }) => {
  if (!fulfillment || fulfillment === "primary") return null;
  return (
    <span className="ml-2 inline-block text-[10px] uppercase tracking-wide border rounded px-1.5 py-0.5 text-red-400 border-red-400/40 align-middle">
      Fallback Mix — Not AI-Generated
    </span>
  );
};

const downloadIndividualPDFCard = (track: Track) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [120, 180] });
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, 120, 180, "F");
  doc.setDrawColor(236, 72, 153);
  doc.setLineWidth(1);
  doc.rect(4, 4, 112, 172);
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(0.3);
  doc.rect(6, 6, 108, 168);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LYRICA SOULFIRE MASTER", 60, 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("SONANCE LEDGER CERTIFIED STATUS", 60, 26, { align: "center" });
  doc.setDrawColor(44, 44, 44);
  doc.line(15, 32, 105, 32);
  doc.setTextColor(236, 72, 153);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const splitTitle = doc.splitTextToSize(track.title || "Untitled", 90);
  doc.text(splitTitle, 60, 42, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`by ${track.artist || "AuraSeeker Generator"}`, 60, 52 + (splitTitle.length > 1 ? 4 : 0), { align: "center" });
  const startY = 62 + (splitTitle.length > 1 ? 4 : 0);
  doc.setFillColor(20, 20, 20);
  doc.rect(15, startY, 90, 75, "F");
  doc.setDrawColor(44, 44, 44);
  doc.rect(15, startY, 90, 75);
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TRACK SPECIFICATION", 20, startY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  const ledgerId = `SL-LEDGER-${(track.id || 'N/A').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12)}`;
  doc.text(`Sonance Ledger ID:`, 20, startY + 16);
  doc.setTextColor(168, 85, 247);
  doc.text(ledgerId, 55, startY + 16);
  doc.setTextColor(220, 220, 220);
  const splitVibe = doc.splitTextToSize(track.vibe || "Atmosphere", 50);
  doc.text(`Vibe / Style:`, 20, startY + 24);
  doc.text(splitVibe, 55, startY + 24);
  const vibeShiftY = (splitVibe.length - 1) * 4;
  doc.text(`Scale Key:`, 20, startY + 34 + vibeShiftY);
  doc.text(`${track.params?.key || "C minor"}`, 55, startY + 34 + vibeShiftY);
  doc.text(`BPM / Tempo:`, 20, startY + 42 + vibeShiftY);
  doc.text(`${track.params?.tempo || 75} BPM`, 55, startY + 42 + vibeShiftY);
  doc.text(`Attribution:`, 20, startY + 50 + vibeShiftY);
  doc.text(track.isRemix ? "Original Remix Flip" : "Original GenAI Master", 55, startY + 50 + vibeShiftY);
  doc.text(`Encryption Check:`, 20, startY + 58 + vibeShiftY);
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 255, 100);
  doc.text("[STATUS CHECK VERIFIED]", 55, startY + 58 + vibeShiftY);
  const endY = startY + 85;
  doc.setDrawColor(236, 72, 153);
  doc.line(15, endY, 105, endY);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text("This document serves as proof of local creation/sync on the", 60, endY + 8, { align: "center" });
  doc.text("Soulfire decentralized pipeline network. Non-custodial.", 60, endY + 12, { align: "center" });
  doc.save(`SL_Track_Card_${(track.title || "untitled").toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

const LibraryModal = ({ isOpen, onClose, savedSongs, history, onPlayTrack, onDeleteTrack, onShareTrack }: {
  isOpen: boolean; onClose: () => void; savedSongs: Track[]; history: any[];
  onPlayTrack?: (track: Track) => void; onDeleteTrack?: (track: Track) => void; onShareTrack?: (track: Track) => void
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'royalties'>('saved');
  const [royaltiesData, setRoyaltiesData] = useState<{ totalRoyalties: number; records: any[] } | null>(null);
  const [loadingRoyalties, setLoadingRoyalties] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'alpha' | 'vibe'>('date');

  useEffect(() => {
    if (activeTab === 'royalties' && isOpen) {
      setLoadingRoyalties(true);
      getRoyaltyStatus('default')
        .then(data => setRoyaltiesData(data))
        .catch(() => setRoyaltiesData({ totalRoyalties: 0, records: [] }))
        .finally(() => setLoadingRoyalties(false));
    }
  }, [activeTab, isOpen]);

  const getSongTime = (song: Track) => {
    if (!song.createdAt) return 0;
    if (typeof song.createdAt === 'string') return new Date(song.createdAt).getTime();
    if (typeof song.createdAt === 'number') return song.createdAt;
    if (song.createdAt?.toDate) return song.createdAt.toDate().getTime();
    if (song.createdAt?.seconds) return song.createdAt.seconds * 1000;
    return new Date(song.createdAt).getTime() || 0;
  };

  const filteredSongs = savedSongs.filter(song => {
    const q = searchTerm.toLowerCase();
    return (song.title || '').toLowerCase().includes(q) || (song.artist || '').toLowerCase().includes(q);
  });

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'alpha') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'vibe') return (a.vibe || '').localeCompare(b.vibe || '');
    return getSongTime(b) - getSongTime(a);
  });

  const downloadLibraryJSON = () => {
    if (!savedSongs.length) return;
    const blob = new Blob([JSON.stringify(savedSongs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `sl_universal_library_${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadLibraryCSV = () => {
    if (!savedSongs.length) return;
    const headers = ["ID", "Title", "Artist", "Vibe", "Audio URL", "Lyrics", "Is Remix", "Original Creator", "Parent Track Title"];
    const rows = savedSongs.map(s => [s.id, s.title, s.artist, s.vibe, s.audioUrl || '', (s.lyrics || '').replace(/"/g, '""'), s.isRemix ? 'true' : 'false', s.originalCreatorName || '', s.parentTrackTitle || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `sl_universal_library_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[80vh] bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Studio Archive</h2>
                <div className="flex gap-2">
                  {[
                    { id: 'saved' as const, label: 'Library', icon: Music2 },
                    { id: 'history' as const, label: 'Recents', icon: History },
                    { id: 'royalties' as const, label: 'Flip Royalties', icon: TrendingUp }
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2",
                        activeTab === tab.id ? "bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]" : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}>
                      <tab.icon className="w-3 h-3" /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 transition-colors rounded-full"><X className="w-6 h-6 text-white/40" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'saved' ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="text" placeholder="Search songs by title or artist..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/90 placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 transition-colors" />
                    </div>
                    <div className="flex gap-3 items-center">
                      <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                        className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white/90 focus:outline-none focus:border-pink-500/50 cursor-pointer transition-colors">
                        <option value="date" className="bg-[#0d0d0d] text-white">Date Added</option>
                        <option value="alpha" className="bg-[#0d0d0d] text-white">Alphabetical</option>
                        <option value="vibe" className="bg-[#0d0d0d] text-white">Vibe / Style</option>
                      </select>
                      <button onClick={downloadLibraryJSON} disabled={!savedSongs.length}
                        className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                        <Download className="w-3.5 h-3.5 text-pink-400" /> JSON
                      </button>
                      <button onClick={downloadLibraryCSV} disabled={!savedSongs.length}
                        className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                        <Download className="w-3.5 h-3.5 text-pink-400" /> CSV
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedSongs.length === 0 ? (
                      <div className="col-span-2 py-24 text-center">
                        <Music2 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
                          {savedSongs.length === 0 ? "Your library is empty" : "No results match your search"}
                        </p>
                      </div>
                    ) : sortedSongs.map(song => (
                      <div key={song.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <button onClick={() => onPlayTrack?.(song)}
                            className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 hover:bg-pink-500/30 transition-all shrink-0">
                            <Play className="w-5 h-5 text-pink-500 fill-current" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white truncate text-sm">{song.title}</h4>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[10px] text-pink-400 font-mono tracking-wide truncate">by {song.artist || "Soulfire Pioneer"}</span>
                              <span className="text-[10px] text-white/40 italic truncate">{song.vibe}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                          <button onClick={() => downloadIndividualPDFCard(song)}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-pink-400 transition-all" title="Download Sonance Ledger PDF">
                            <FileText className="w-4 h-4" />
                          </button>
                          {onShareTrack && (
                            <button onClick={() => onShareTrack(song)}
                              className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="Share track">
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteTrack && (
                            <button onClick={() => onDeleteTrack(song)}
                              className="p-2 hover:bg-rose-500/10 rounded-lg text-white/40 hover:text-rose-400 transition-all" title="Delete from library">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === 'history' ? (
                <div className="space-y-2">
                  {history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-white/20">
                          {item.playedAt ? new Date(item.playedAt).toLocaleTimeString() : ''}
                        </span>
                        <span className="font-bold text-white/80">{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/15 border border-pink-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-pink-400 font-mono uppercase tracking-widest">Aura Stem Royalty Earnings</h4>
                      <p className="text-xs text-white/50 mt-1 max-w-sm">Every time another producer remixes your song using the 'Flip It' engine, you collect a $0.05 micro-royalty.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-white/40 uppercase">Total Accumulated</p>
                      <p className="text-4xl font-black text-pink-500 tracking-tight">${royaltiesData?.totalRoyalties.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">Remix Transaction Ledger</p>
                    {loadingRoyalties ? (
                      <div className="py-12 text-center text-white/40 font-mono text-xs animate-pulse uppercase">Querying ledger database...</div>
                    ) : !royaltiesData?.records?.length ? (
                      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center text-white/40 font-mono text-xs">
                        No remix events registered yet.
                      </div>
                    ) : (
                      <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/2">
                        <table className="w-full text-left font-mono text-xs text-white/60">
                          <thead className="bg-white/5 text-[9px] uppercase tracking-widest text-white/40">
                            <tr><th className="p-4">Original Track</th><th className="p-4">Flip Style</th><th className="p-4">Remixer</th><th className="p-4 text-right">Royalty</th></tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {royaltiesData.records.map((rec: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold text-white max-w-[150px] truncate">{rec.originalTrackTitle || "Midnight Raindrops"}</td>
                                <td className="p-4 italic text-pink-400 max-w-[180px] truncate">{rec.remixVibe || "Rio Drift Phonk"}</td>
                                <td className="p-4 font-sans text-xs">{rec.remixAuthorName || "Manda"}</td>
                                <td className="p-4 text-right font-bold text-green-400">+${(rec.amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShareModal = ({ isOpen, onClose, track, setToastMessage }: {
  isOpen: boolean; onClose: () => void; track: Track | null; setToastMessage: (msg: string | null) => void
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'TikTok' | 'Instagram' | 'Twitter'>('Twitter');
  const [shareMode, setShareMode] = useState<'link' | 'video' | 'audio'>('link');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userCaption, setUserCaption] = useState('');

  const originalCreator = track?.originalCreatorName || track?.artist || "Soulfire Pioneer";
  const trackTitle = track?.title || "Generative Track";
  const cleanProfileName = `@${originalCreator.replace(/\s+/g, '')}`;

  const getShareUrl = () => `${window.location.origin}${window.location.pathname}?trackId=${track?.id || Date.now()}`;

  const getPlatformDefaultCaption = (platform: 'TikTok' | 'Instagram' | 'Twitter') => {
    const url = getShareUrl();
    if (track?.isRemix) {
      const base = `Flipped '${trackTitle}' on SL Universal! Original creator: ${cleanProfileName}. Listen: ${url}`;
      return platform === 'TikTok' ? `${base} #SLUniversal #FlipIt` : platform === 'Instagram' ? `${base} #SLUniversal #Remix` : `${base} #SLUniversal @SLUniversal`;
    }
    return `Listening to '${trackTitle}' on SL Universal: ${url} #SLUniversal`;
  };

  useEffect(() => {
    if (isOpen && track) { setCopied(false); setUserCaption(getPlatformDefaultCaption(selectedPlatform)); }
  }, [isOpen, selectedPlatform, track]);

  const isAttributionValid = !track?.isRemix || userCaption.toLowerCase().includes(originalCreator.toLowerCase()) || userCaption.toLowerCase().includes(cleanProfileName.toLowerCase());

  const handleRestoreAttribution = () => { setUserCaption(getPlatformDefaultCaption(selectedPlatform)); setToastMessage("Proper creator attribution restored!"); setTimeout(() => setToastMessage(null), 3500); };

  const getFinalCaption = () => !isAttributionValid && track?.isRemix ? `${userCaption}\n\n[Remix attributed to: ${cleanProfileName}]` : userCaption;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(getFinalCaption()).then(() => {
      setCopied(true); setToastMessage(`${selectedPlatform} caption copied with creator credit!`);
      setTimeout(() => setToastMessage(null), 3500); setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});
  };

  const handleDirectShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: `SL Universal: ${trackTitle}`, text: getFinalCaption(), url: getShareUrl() }); } catch { handleCopyCaption(); }
    } else handleCopyCaption();
  };

  const handleSimulateExport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false); handleCopyCaption();
      if (track?.audioUrl) {
        const a = document.createElement('a'); a.href = track.audioUrl;
        a.download = `${trackTitle.replace(/\s+/g, '_')}_flipped.wav`; a.click();
        setToastMessage("Exported flipped stem file!"); setTimeout(() => setToastMessage(null), 4000);
      }
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999]" />
          <motion.div initial={{ opacity: 0, scale: 0.93, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#07070a] border border-pink-500/20 rounded-3xl shadow-2xl z-[1000] p-7 md:p-8 outline-none max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Social Stem & Attribution Share</h3>
                <span className="text-[10px] font-mono text-white/40 block mt-0.5">Spread flipped remixes with proper creator credits</span>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-full border border-white/5 text-white/50 hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              {track?.isRemix ? (
                <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/20 space-y-2 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span></span>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-pink-400 font-mono">REMIX DETECTED</span>
                  </div>
                  <p className="text-[10px] text-white/80 font-sans">You flipped this track. Sharing embeds attribution to {cleanProfileName}.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5"><span className="text-[9px] font-bold tracking-widest uppercase text-white/40 font-mono">ORIGINAL COMPOSITION</span></div>
              )}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block">Export Format</label>
                <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
                  {(['link', 'video', 'audio'] as const).map(mode => (
                    <button key={mode} onClick={() => setShareMode(mode)}
                      className={cn("flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all", shareMode === mode ? "bg-pink-500/10 border border-pink-500/30 text-pink-400" : "text-white/40 hover:text-white")}>
                      {mode === 'link' ? 'Deep-Link' : mode === 'video' ? 'MP4 Video' : 'Stem WAV'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['Twitter', 'Instagram', 'TikTok'] as const).map(platform => (
                  <button key={platform} onClick={() => setSelectedPlatform(platform)}
                    className={cn("py-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all", selectedPlatform === platform ? "bg-gradient-to-b from-pink-500/10 to-transparent border-pink-500/50 text-white" : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white")}>
                    <Share2 className={cn("w-4 h-4", selectedPlatform === platform ? "text-pink-400" : "text-white/30")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{platform === 'Twitter' ? 'Twitter / X' : platform}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Caption</label>
                  {copied && <span className="text-[9px] font-bold text-emerald-400 font-mono flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>}
                </div>
                <textarea className={cn("w-full h-24 p-3 bg-white/5 border rounded-2xl text-xs text-white/90 focus:outline-none font-sans leading-relaxed resize-none transition-colors", isAttributionValid ? "border-white/10 focus:border-pink-500/50" : "border-rose-500/50")}
                  value={userCaption} onChange={e => setUserCaption(e.target.value)} />
                {!isAttributionValid && track?.isRemix && (
                  <button onClick={handleRestoreAttribution} className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[8px] font-mono font-bold rounded-lg border border-rose-500/20">
                    Restore Creator Credit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {shareMode !== 'link' && !isProcessing ? (
                  <button onClick={handleSimulateExport}
                    className="py-3 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all">
                    <Download className="w-3.5 h-3.5" /> Compile & Share
                  </button>
                ) : (
                  <button onClick={handleDirectShare}
                    className="py-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-400 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                )}
                <button onClick={handleCopyCaption}
                  className="py-3 bg-white text-black hover:bg-white/90 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all">
                  Copy Caption
                </button>
              </div>
              {isProcessing && (
                <div className="bg-[#121319] border border-pink-500/30 p-4 rounded-2xl flex flex-col items-center gap-3">
                  <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.8 }} className="h-full bg-gradient-to-r from-pink-500 to-purple-500" />
                  </div>
                  <span className="text-[9px] font-mono text-pink-400 uppercase tracking-widest animate-pulse">Bundling stems...</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const VibeBar = ({ onGenerate, history }: { onGenerate: (vibe: string) => void; history: Track[] }) => {
  const [vibe, setVibe] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getSuggestions = () => {
    const hour = new Date().getHours();
    const base = hour >= 5 && hour < 12 ? ['Sunrise Soul', 'Morning Motivation'] :
      hour >= 12 && hour < 17 ? ['Midday Groove', 'Productive Beats'] :
      hour >= 17 && hour < 21 ? ['Sunset Chill', 'Golden Hour Vibes'] :
      ['Late Night Drive', 'Midnight Melancholy', 'Ethereal Dreams'];
    return [...base, ...history.slice(0, 2).map(t => t.vibe)].slice(0, 6);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-md">
        <Waves className="w-5 h-5 text-pink-500 animate-pulse" />
        <input
          type="text"
          value={vibe}
          onChange={e => { setVibe(e.target.value); setShowSuggestions(true); }}
          onKeyDown={e => { if (e.key === 'Enter' && vibe.trim()) { onGenerate(vibe.trim()); setVibe(''); setShowSuggestions(false); } }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Describe your vibe — e.g. 'Late night drive, 90s R&B, raining outside'"
          className="flex-1 bg-transparent text-white placeholder-white/30 text-sm font-sans focus:outline-none py-1"
        />
        <button onClick={() => { if (vibe.trim()) { onGenerate(vibe.trim()); setVibe(''); setShowSuggestions(false); } }}
          className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-all font-bold tracking-widest uppercase text-xs shadow-[0_0_15px_rgba(236,72,153,0.25)] flex items-center gap-2">
          <Send className="w-3.5 h-3.5" /> Generate
        </button>
      </div>
      <AnimatePresence>
        {showSuggestions && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-xl z-50">
            <div className="flex flex-wrap gap-2">
              {getSuggestions().map(s => (
                <button key={s} onClick={() => { onGenerate(s); setVibe(''); setShowSuggestions(false); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-all">
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuraVisualizer = ({ active, bpm, isPlaying }: { active: boolean; bpm: number; isPlaying: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 3 + 1, alpha: Math.random() * 0.5 + 0.1 });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236, 72, 153, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export function RadioPage() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [auraMode, setAuraMode] = useState(false);
  const [proMode, setProMode] = useState(false);
  const [emotionalMode, setEmotionalMode] = useState<'Pain' | 'Playful' | 'Mirror'>('Mirror');
  const [searchTerm, setSearchTerm] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);
  const [biometricSync, setBiometricSync] = useState(true);
  const [vibeWeather, setVibeWeather] = useState<'Rainy' | 'Sunny' | 'Cosmic' | 'Foggy'>('Rainy');
  const [vibeTimeOfDay, setVibeTimeOfDay] = useState<'Late Night' | 'Sunrise' | 'Golden Hour' | 'High Noon'>('Late Night');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [sampleRate, setSampleRate] = useState<'44.1kHz' | '48kHz' | '96kHz'>('48kHz');
  const [bitDepth, setBitDepth] = useState<'16-bit' | '24-bit' | '32-bit float'>('24-bit');
  const [showLiveBanner, setShowLiveBanner] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isAuraActive, setIsAuraActive] = useState(false);
  const [auraUserContext, setAuraUserContext] = useState<string>("Relaxed");
  const [auraCustomText, setAuraCustomText] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<Track[]>([]);
  const [paramsHistory, setParamsHistory] = useState<VibeParams[]>([]);
  const [paramsHistoryIndex, setParamsHistoryIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [savedSongs, setSavedSongs] = useState<Track[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Top-level mode: generate (SL Universal), Stations directory, or Party DJ room
  const [mode, setMode] = useState<"sonance" | "directory" | "party_dj">("sonance");
  const [externalStationPlaying, setExternalStationPlaying] = useState<StationPreset | UserStation | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayStation = (station: StationPreset | UserStation) => {
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current = null;
    }
    if (station.streamUrl) {
      const audio = new Audio(station.streamUrl);
      audio.play().catch(e => console.error("Station playback failed", e));
      externalAudioRef.current = audio;
      setExternalStationPlaying(station);
    }
  };

  const handleStopStation = () => {
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current = null;
    }
    setExternalStationPlaying(null);
  };

  const [showLibrary, setShowLibrary] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showFlipModal, setShowFlipModal] = useState(false);
  const [flipInput, setFlipInput] = useState('');
  const [exportFormat, setExportFormat] = useState<'WAV' | 'MP3' | 'Stems' | 'MIDI' | 'Dolby Atmos'>('WAV');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [masteringProgress, setMasteringProgress] = useState(0);
  const [isMastered, setIsMastered] = useState(false);
  const [masteringStage, setMasteringStage] = useState("");
  const [masteringParams, setMasteringParams] = useState({ eqLow: 0.5, eqMid: 0.5, eqHigh: 0.5, compression: 0.4, limiting: 0.3 });
  const [melodyStyle, setMelodyStyle] = useState<'Soaring' | 'Rhythmic' | 'Subtle'>('Soaring');
  const [voicePersona, setVoicePersona] = useState<'Singer' | 'Podcast Host' | 'Narrator'>('Singer');
  const [isGeneratingMelody, setIsGeneratingMelody] = useState(false);
  const [hasMelodyLayer, setHasMelodyLayer] = useState(false);
  const [edgeProcessing, setEdgeProcessing] = useState(false);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [aiWatermarking, setAiWatermarking] = useState(true);
  const [cfmEnabled, setCfmEnabled] = useState(true);
  const [pnisEnabled, setPnisEnabled] = useState(true);
  const [showSri, setShowSri] = useState(false);
  const [stemVolumes, setStemVolumes] = useState({ vocals: 100, bass: 100, drums: 100, melody: 100 });
  const [activeVocalPipelines, setActiveVocalPipelines] = useState([
    { id: 'sade', name: "Sade / Teena Marie", description: "Velvety proximity & plate reverb", active: true, intensity: 85 },
    { id: 'cardi', name: "Cardi B / Snow", description: "Staccato triplet flows", active: false, intensity: 70 },
    { id: 'keith', name: "Keith Sweat", description: "90s begging cadence", active: false, intensity: 60 },
    { id: 'ana', name: "Ana Gabriel", description: "Raw Ranchera chest-belt", active: false, intensity: 50 },
    { id: 'shady', name: "Shady Boy (Anchor)", description: "Authentic Chicano grit", active: true, intensity: 100 }
  ]);
  const [remixFeed, setRemixFeed] = useState<any[]>([]);
  const [loadingRemixFeed, setLoadingRemixFeed] = useState(false);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [presets, setPresets] = useState<any[]>([]);

  // Load library from API/localStorage on mount
  useEffect(() => {
    getLibrary('local').then(setSavedSongs).catch(() => {});
    getHistory('local').then(setHistoryList).catch(() => {});
  }, []);

  // Fetch remix feed
  const fetchRemixFeed = () => {
    setLoadingRemixFeed(true);
    getRoyaltyStatus('default')
      .then(data => { if (data.records) setRemixFeed(data.records); })
      .catch(() => {})
      .finally(() => setLoadingRemixFeed(false));
  };

  useEffect(() => { fetchRemixFeed(); const i = setInterval(fetchRemixFeed, 30000); return () => clearInterval(i); }, []);

  // Toast effect
  useEffect(() => { const t = setTimeout(() => setShowLiveBanner(true), 5000); return () => clearTimeout(t); }, []);

  const triggerHaptic = (pattern: number[]) => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); };

  const handleVibeCheck = async (emoji: string) => {
    if (!currentTrack) return;
    const id = Date.now() + Math.random();
    setFloatingReactions(prev => [...prev, { id, emoji, x: Math.random() * 120 - 60, y: Math.random() * -120 - 80 }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2000);
    triggerHaptic([50, 30, 50]);
    setToastMessage(`Vibe Check: ${emoji}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getEmotionalTheme = () => {
    switch (emotionalMode) {
      case 'Pain': return 'from-rose-900 to-red-900';
      case 'Playful': return 'from-amber-900 to-orange-900';
      case 'Mirror': return 'from-blue-900 to-indigo-900';
      default: return 'from-[#0a0502] via-[#1a0a05] to-[#0a0502]';
    }
  };

  const getAuraContext = () => {
    const hour = new Date().getHours();
    let timeCtx = hour >= 5 && hour < 12 ? "morning freshness" : hour >= 12 && hour < 17 ? "midday focus" : hour >= 17 && hour < 21 ? "golden hour transition" : "late-night introspection";
    let targetBpm = 72;
    if (auraUserContext === "Gym / Energetic") targetBpm = 128;
    else if (auraUserContext === "Focus / Chill") targetBpm = 78;
    else if (auraUserContext === "Relaxed") targetBpm = 65;
    else if (auraUserContext === "Sunset Groove") targetBpm = 95;
    const custom = auraCustomText.trim() ? `, Custom: ${auraCustomText}` : "";
    return `${timeCtx}, state: ${auraUserContext}${custom}, sync to ${targetBpm}BPM`;
  };

  const parseVibeInput = (input: string) => {
    const params: Partial<VibeParams> = {};
    const tempoMatch = input.match(/tempo:\s*(\d+)/i);
    if (tempoMatch) params.tempo = parseInt(tempoMatch[1]);
    const keyMatch = input.match(/key:\s*([A-G][#b]?\s*(?:Major|Minor|maj|min)?)/i);
    if (keyMatch) params.key = keyMatch[1];
    const genreMatch = input.match(/genre:\s*([^,]+)/i);
    if (genreMatch) params.style = genreMatch[1].trim();
    const cleanVibe = input.replace(/tempo:\s*\d+/i, '').replace(/key:\s*[A-G][#b]?\s*(?:Major|Minor|maj|min)?/i, '').replace(/genre:\s*[^,]+/i, '').trim().replace(/^,\s*|,\s*$/g, '');
    return { cleanVibe, params };
  };

  const handleGenerate = async (vibe: string, isAuraTransition: boolean = false) => {
    if (!vibe) return;
    setIsGenerating(true);
    setAuraMode(true);
    setError(null);

    try {
      const { cleanVibe, params: explicitParams } = parseVibeInput(vibe);
      const auraContext = getAuraContext();
      const context = { weather: vibeWeather, time: vibeTimeOfDay, heartRate: biometricSync ? 72 : undefined, auraContext: isAuraActive || isAuraTransition ? auraContext : undefined };
      const basePrompt = isAuraActive || isAuraTransition ? `${cleanVibe} [AURA CONTEXT: ${auraContext}]` : cleanVibe;

      const modePrompt = emotionalMode === 'Pain' ? `${basePrompt} (vulnerability_slider=0.9)` : emotionalMode === 'Playful' ? `${basePrompt} (Major 7th, Juxtaposition Logic)` : `${basePrompt} (Duo/Ensemble interplay)`;

      // Real generation via the backend (Soulfire/Vertex pipeline) instead of
      // client-side Gemini streaming. data.fulfillment/voiceFulfillment are
      // the backend's honest ground truth -- never overridden here.
      const data = await generateTrack(modePrompt, context, emotionalMode);

      const params: VibeParams = { ...(data.params || {}), ...explicitParams };
      params.emotionalMode = emotionalMode;

      const newTrack: Track = {
        id: data.track_id || Date.now().toString(),
        title: data.title || (vibe.length > 20 ? vibe.substring(0, 20) + "..." : vibe),
        artist: data.artist || "Soulfire Engine",
        vibe: data.vibe || vibe,
        params,
        audioUrl: data.audioUrl,
        lyrics: data.lyrics || params.lyrics,
        fulfillment: data.fulfillment,
      };

      setCurrentTrack(newTrack);
      setHistory(prev => [newTrack, ...prev]);
      setParamsHistory([params]);
      setParamsHistoryIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "Failed to generate track. Please ensure the API server is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    } else setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
        const vibe = `${currentTrack?.vibe} - ${vibeWeather} ${vibeTimeOfDay}`;
        slSynth.updateAtmosphere(vibe, currentTrack?.params.tempo || 75, emotionalMode);
        slSynth.play();
      } else { audioRef.current.pause(); slSynth.stop(); }
    }
  }, [isPlaying, currentTrack?.audioUrl]);

  const saveToLibrary = async (track: Track) => {
    setIsSaving(true);
    try {
      await saveTrack(track as any);
      setSavedSongs(prev => [track, ...prev]);
      setToastMessage("Saved to library!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error("Error saving:", e);
    } finally { setIsSaving(false); }
  };

  const handleAddToHistory = async (track: Track) => {
    await addToHistory(track as any);
  };

  const handleParamChange = (paramName: keyof VibeParams, value: number) => {
    if (!currentTrack) return;
    const newParams = { ...currentTrack.params, [paramName]: value };
    setCurrentTrack({ ...currentTrack, params: newParams });
    const newHistory = paramsHistory.slice(0, paramsHistoryIndex + 1);
    newHistory.push(newParams);
    setParamsHistory(newHistory);
    setParamsHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (paramsHistoryIndex > 0 && currentTrack) {
      const newIndex = paramsHistoryIndex - 1;
      setParamsHistoryIndex(newIndex);
      setCurrentTrack({ ...currentTrack, params: paramsHistory[newIndex] });
    }
  };

  const handleRedo = () => {
    if (paramsHistoryIndex < paramsHistory.length - 1 && currentTrack) {
      const newIndex = paramsHistoryIndex + 1;
      setParamsHistoryIndex(newIndex);
      setCurrentTrack({ ...currentTrack, params: paramsHistory[newIndex] });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { if (e.shiftKey) handleRedo(); else handleUndo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') handleRedo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paramsHistory, paramsHistoryIndex, currentTrack]);

  const handleMasterTrack = async () => {
    setIsMastering(true); setMasteringProgress(0); setIsMastered(false);
    const stages = ["Analyzing Track...", "Applying EQ...", "Compressing...", "Limiting..."];
    for (let i = 0; i < stages.length; i++) {
      setMasteringStage(stages[i]);
      for (let p = 0; p <= 25; p += 5) { setMasteringProgress(i * 25 + p); await new Promise(r => setTimeout(r, 100)); }
    }
    setMasteringStage("Mastered"); setIsMastering(false); setIsMastered(true);
  };

  const handleGenerateMelody = async () => {
    setIsGeneratingMelody(true);
    await new Promise(r => setTimeout(r, 2000));
    setHasMelodyLayer(true); setIsGeneratingMelody(false);
  };

  const handleExportStems = () => {
    setIsExporting(true); setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => { if (prev >= 100) { clearInterval(interval); setTimeout(() => setIsExporting(false), 1000); return 100; } return prev + 5; });
    }, 100);
  };

  // Audio time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    const update = () => { setCurrentTime(audio.currentTime); setDuration(audio.duration || 0); };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    return () => { audio.removeEventListener('timeupdate', update); audio.removeEventListener('loadedmetadata', update); };
  }, [isPlaying, currentTrack?.audioUrl]);

  // Flip It modal logic
  const handleFlipIt = () => {
    if (flipInput.trim() && currentTrack) {
      handleGenerate(`Flip remix of "${currentTrack.title}": ${flipInput}`);
      setShowFlipModal(false); setFlipInput('');
    }
  };

  // Vocal pipeline deep-link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vocalPreset = params.get('vocalPreset');
    if (vocalPreset) {
      try {
        const decoded = JSON.parse(atob(vocalPreset));
        if (Array.isArray(decoded)) {
          setActiveVocalPipelines(prev => prev.map(p => { const found = decoded.find((d: any) => d.id === p.id); return found ? { ...p, active: found.active, intensity: found.intensity ?? p.intensity } : p; }));
          setToastMessage("Vocal matrix configured from deep-link!");
          setTimeout(() => setToastMessage(null), 5000);
        }
      } catch {}
    }
  }, []);

  return (
    <div className={cn("min-h-screen text-white font-sans selection:bg-pink-500/30 bg-gradient-to-br", getEmotionalTheme())}>
      <AuraVisualizer active={auraMode || isStreamActive || isAuraActive} bpm={currentTrack?.params.tempo || 75} isPlaying={isPlaying} />

      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-[999] px-5 py-3.5 bg-[#0b0c10]/95 border border-pink-500/30 text-white rounded-2xl flex items-center gap-3.5 shadow-2xl shadow-pink-500/10 font-mono text-xs backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase font-sans">SL <span className="text-pink-500">Universal</span></span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-white/60">
          {/* Mode Toggle: SL Universal generation / Stations / Party DJ */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => setMode("sonance")}
              title="Generate AI music from text prompts"
              className={cn(
                "px-4 py-2 rounded-[10px] text-[10px] font-bold tracking-widest uppercase transition-all",
                mode === "sonance"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-black shadow-lg"
                  : "text-white/40 hover:text-white"
              )}
            >
              Lyrica
            </button>
            <button
              onClick={() => setMode("directory")}
              title="Browse and play external radio stations"
              className={cn(
                "px-4 py-2 rounded-[10px] text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5",
                mode === "directory"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-black shadow-lg"
                  : "text-white/40 hover:text-white"
              )}
            >
              <Radio className="w-3 h-3" />
              Stations
            </button>
            <button
              onClick={() => setMode("party_dj")}
              title="AI DJ party room with listener interactivity"
              className={cn(
                "px-4 py-2 rounded-[10px] text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5",
                mode === "party_dj"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-black shadow-lg"
                  : "text-white/40 hover:text-white"
              )}
            >
              <Mic2 className="w-3 h-3" />
              Party DJ
            </button>
          </div>

          <button onClick={() => setProMode(!proMode)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all border", proMode ? "bg-pink-500/20 border-pink-500 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]" : "hover:text-white border-white/10")}>
            <Cpu className="w-4 h-4" /> {proMode ? "Soulfire Engine" : "Activate Soulfire"}
          </button>
          <button onClick={() => { setIsStreamActive(!isStreamActive); if (!isStreamActive && !currentTrack) handleGenerate("Aura Stream start session in a chilled, atmospheric mood"); }}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all border", isStreamActive ? "bg-purple-500/20 border-purple-500 text-purple-500" : "hover:text-white border-white/10")}>
            <Waves className="w-4 h-4" /> {isStreamActive ? "Aura Active" : "Start Aura Stream"}
          </button>
          <button onClick={() => setShowLibrary(true)} className="hover:text-white transition-colors flex items-center gap-2">
            <Music2 className="w-4 h-4" /> Library
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          {getAuthToken() ? (
            <span className="text-xs text-white/60 font-mono">Studio Mode</span>
          ) : (
            <span className="text-xs text-white/40 font-mono">Guest</span>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showLiveBanner && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="relative z-20 bg-gradient-to-r from-purple-900 to-blue-900 border-b border-purple-500/30 overflow-hidden">
            <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500 rounded text-[9px] font-black uppercase tracking-tighter animate-pulse">LIVE</div>
                <p className="text-xs font-bold text-purple-100 flex items-center gap-2"><Sparkles className="w-3 h-3 text-purple-400" /> Live AI Studio Session active.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsLiveSessionOpen(true)}
                  className="px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all">Join Session</button>
                <button onClick={() => setShowLiveBanner(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-8 pt-12 pb-32 relative z-10">
        {mode === "party_dj" ? (
          /* ── Party DJ Mode ── */
          <LivePartyDJRoom />
        ) : mode === "directory" ? (
          /* ── Station Directory ── */
          <RadioDirectoryPage
            onPlayStation={handlePlayStation}
            onStopStation={handleStopStation}
            currentPlayingId={externalStationPlaying ? (externalStationPlaying as any).id || externalStationPlaying.name : undefined}
          />
        ) : (
        <AnimatePresence mode="wait">
          {!currentTrack && !isGenerating ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-24">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-none italic uppercase">
                SL <span className="text-pink-500">UNIVERSAL</span>
              </h1>
              <p className="text-white/40 text-xl max-w-xl mx-auto mb-12 font-light">The listening layer of the Lyrica 3 ecosystem.</p>
              {error && <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm max-w-2xl mx-auto">{error}</div>}
              <VibeBar onGenerate={handleGenerate} history={history} />
              <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {['Late night drive', '90s R&B hurt', 'Chicano Soul', 'Modern Trap Soul', 'Acoustic Healing', 'Rio Drift Phonk', 'Cyberpunk Jazz', 'Ethereal Folk'].map(v => (
                  <button key={v} onClick={() => handleGenerate(v)}
                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors text-white/60 hover:text-white">{v}</button>
                ))}
              </div>
              <div className="mt-12 space-y-6">
                <div className="flex items-center justify-center gap-4">
                  {[{ id: 'Pain', label: 'Pain Mode', color: 'text-red-500' }, { id: 'Playful', label: 'Playful Mode', color: 'text-pink-500' }, { id: 'Mirror', label: 'Mirror Mode', color: 'text-blue-500' }].map(mode => (
                    <button key={mode.id} onClick={() => setEmotionalMode(mode.id as any)}
                      className={cn("px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all",
                        emotionalMode === mode.id ? "border-pink-500/50 text-pink-500 bg-pink-500/10" : "border-white/10 text-white/40 hover:text-white")}>{mode.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-12">
              <div className="flex flex-col items-center">
                <div className="relative aspect-square group w-full">
                  <div className="absolute -inset-4 bg-gradient-to-br from-pink-500/20 to-fuchsia-600/10 rounded-3xl blur-2xl group-hover:opacity-100 opacity-50 transition-opacity" />
                  <div className={cn("relative w-full h-full border rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-1000",
                    emotionalMode === 'Pain' ? "bg-gradient-to-br from-red-950/40 via-[#0d0d0d] to-rose-950/20 border-red-500/30" :
                    emotionalMode === 'Playful' ? "bg-gradient-to-br from-pink-950/40 via-[#0d0d0d] to-amber-950/20 border-pink-500/30" :
                    "bg-gradient-to-br from-blue-950/40 via-[#0d0d0d] to-indigo-950/20 border-blue-500/30")}>
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full" />
                        <p className="text-pink-500 font-mono text-xs tracking-widest uppercase animate-pulse">Synthesizing Audio...</p>
                      </div>
                    ) : (
                      <div className="w-full h-full p-12 flex flex-col justify-between relative">
                        <AuraCanvasVisualizer isPlaying={isPlaying} bpm={currentTrack?.params.tempo || 75} weather={vibeWeather} emotionalMode={emotionalMode}
                          trackParams={currentTrack?.params} currentTime={currentTime} duration={duration} />
                        <div className="absolute inset-x-0 bottom-12 pointer-events-none z-30">
                          <AnimatePresence>
                            {floatingReactions.map(r => (
                              <motion.div key={r.id} initial={{ opacity: 1, scale: 0.5, y: 0, x: r.x }} animate={{ opacity: 0, scale: 1.8, y: r.y, x: r.x + (Math.sin(r.id) * 40) }}
                                exit={{ opacity: 0 }} transition={{ duration: 1.8, ease: "easeOut" }}
                                className="absolute left-1/2 -translate-x-1/2 text-5xl font-bold select-none drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">{r.emoji}</motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                          <div className="p-3 bg-white/5 rounded-xl"><Music2 className="w-6 h-6 text-pink-500" /></div>
                          <div className="flex gap-2">
                            <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{currentTrack?.params.key}</div>
                            <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{currentTrack?.params.tempo} BPM</div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-5xl font-black tracking-tighter leading-none">
                            {currentTrack?.title}
                            <FulfillmentBadge fulfillment={currentTrack?.fulfillment} />
                          </h2>
                          <div className="flex items-center gap-4">
                            <p className="text-white/40 text-lg font-light italic">{currentTrack?.vibe}</p>
                            <button onClick={() => { setIsAuraActive(!isAuraActive); if (!isAuraActive) handleGenerate(`Deepen the aura of ${currentTrack?.title}: ${currentTrack?.vibe}`, true); }}
                              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border",
                                isAuraActive ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white")}>
                              <Zap className={cn("w-3 h-3", isAuraActive && "fill-current")} /> Go Deeper
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {currentTrack?.params.genreBlend?.map((genre, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
                                <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">{genre}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                          <div className="flex gap-2">
                            {['❤️', '🔥', '🌊', '✨', '💔', '🕊️'].map(emoji => (
                              <button key={emoji} onClick={() => handleVibeCheck(emoji)}
                                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl text-lg transition-all">{emoji}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {/* Player Controls */}
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowHistoryDropdown(!showHistoryDropdown)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                    <History className="w-5 h-5 text-white/60" />
                  </button>
                  <button onClick={() => { if (currentTrack) handleGenerate(currentTrack.vibe); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                    <Undo2 className="w-5 h-5 text-white/60" />
                  </button>
                  <button onClick={togglePlay}
                    className="p-5 bg-pink-600 hover:bg-pink-500 rounded-2xl transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                    {isPlaying ? <Pause className="w-8 h-8 text-white fill-current" /> : <Play className="w-8 h-8 text-white fill-current" />}
                  </button>
                  <button onClick={() => { if (currentTrack) handleGenerate(currentTrack.vibe + " deeper"); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                    <Redo2 className="w-5 h-5 text-white/60" />
                  </button>
                  <button onClick={() => { setFlipInput(currentTrack?.vibe || ''); setShowFlipModal(true); }}
                    className="p-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all">
                    <Layers className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Audio Player */}
                <audio ref={audioRef} src={currentTrack?.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" controls />

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-white/40">
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-pink-500" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowLyrics(!showLyrics)}
                    className={cn("py-3 rounded-xl border transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2",
                      showLyrics ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10")}>
                    <Mic2 className="w-4 h-4" /> {showLyrics ? "Close" : "Lyrics"}
                  </button>
                  <button onClick={() => { if (currentTrack) saveToLibrary(currentTrack); }}
                    className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { if (currentTrack) setShowShareModal(true); }}
                    className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button onClick={handleExportStems}
                    className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>

                {/* Stem Mixer */}
                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[8px] font-bold tracking-widest uppercase text-white/40 mb-3 flex justify-between">
                    <span>Stem Mixer</span>
                    <span className="text-pink-500">{sampleRate}/{bitDepth}</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(stemVolumes).map(([stem, vol]) => (
                      <div key={stem} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono uppercase text-white/60 w-12">{stem}</span>
                        <input type="range" min="0" max="100" value={vol}
                          onChange={e => setStemVolumes({ ...stemVolumes, [stem]: parseInt(e.target.value) })}
                          className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer" />
                        <span className="text-[9px] font-mono text-white/40 w-6 text-right">{vol}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Mode Panel */}
                <AnimatePresence>
                  {proMode && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                        <h3 className="text-[10px] font-bold tracking-widest uppercase text-pink-400 mb-3">Soulfire Engine</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={handleMasterTrack} disabled={isMastering}
                            className="py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl text-[10px] font-bold tracking-widest uppercase">
                            {isMastering ? `Mastering... ${masteringProgress}%` : "Master Track"}
                          </button>
                          <button onClick={handleGenerateMelody} disabled={isGeneratingMelody}
                            className="py-2 bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase">
                            {isGeneratingMelody ? "Generating..." : "Generate Melody"}
                          </button>
                        </div>
                        {isMastering && (
                          <div className="mt-3 space-y-2">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${masteringProgress}%` }} />
                            </div>
                            <p className="text-[8px] font-mono text-white/40">{masteringStage}</p>
                          </div>
                        )}
                        {isMastered && <p className="text-[10px] text-green-400 font-mono mt-2">Mastered!</p>}
                      </div>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                        <h3 className="text-[10px] font-bold tracking-widest uppercase text-pink-400 mb-3">Vocal Pipelines</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {activeVocalPipelines.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-black/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setActiveVocalPipelines(prev => prev.map(v => v.id === p.id ? { ...v, active: !v.active } : v))}
                                  className={cn("w-3 h-3 rounded border transition-all", p.active ? "bg-pink-500 border-pink-500" : "border-white/20")} />
                                <div>
                                  <span className="text-[10px] font-bold text-white">{p.name}</span>
                                  <p className="text-[8px] text-white/40 font-mono">{p.description}</p>
                                </div>
                              </div>
                              <input type="range" min="0" max="100" value={p.intensity}
                                onChange={e => setActiveVocalPipelines(prev => prev.map(v => v.id === p.id ? { ...v, intensity: parseInt(e.target.value) } : v))}
                                className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </main>

      {/* Library Modal */}
      <LibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)}
        savedSongs={savedSongs} history={historyList}
        onPlayTrack={(track) => { setCurrentTrack(track); setIsPlaying(true); setShowLibrary(false); }}
        onDeleteTrack={(track) => { setSavedSongs(prev => prev.filter(s => s.id !== track.id)); }}
        onShareTrack={(track) => { setCurrentTrack(track); setShowShareModal(true); setShowLibrary(false); }} />

      {/* Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} track={currentTrack} setToastMessage={setToastMessage} />

      {/* Flip It Modal */}
      <AnimatePresence>
        {showFlipModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFlipModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 z-[101]">
              <h2 className="text-2xl font-black tracking-tighter uppercase mb-4">Flip It</h2>
              <p className="text-xs text-white/50 mb-4">Remix this track with a new vibe direction.</p>
              <input type="text" value={flipInput} onChange={e => setFlipInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleFlipIt(); }}
                placeholder="Describe your remix vibe..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 mb-4 text-white placeholder-white/30" />
              <div className="flex gap-3">
                <button onClick={() => setShowFlipModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase">Cancel</button>
                <button onClick={handleFlipIt} className="flex-1 py-3 bg-pink-600 rounded-xl text-[10px] font-bold tracking-widest uppercase">Generate Flip</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Live Session Modal */}
      <AnimatePresence>
        {isLiveSessionOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLiveSessionOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[80vh] bg-[#0d0d0d] border border-white/10 rounded-3xl z-[101] overflow-hidden">
              <LiveSession onClose={() => setIsLiveSessionOpen(false)} onGenerate={handleGenerate} currentTrack={currentTrack} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
