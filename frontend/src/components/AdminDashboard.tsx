import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { AssetType, StemType, SFXCategory, AudioMetadata } from '../types';
import { Plus, Trash2, Music, Mic, Wind, Layers, Tag, Link as LinkIcon, Clock, Hash, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [assets, setAssets] = useState<AudioMetadata[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: AssetType.FULL_TRACK,
    stemType: StemType.VOCAL,
    sfxCategory: SFXCategory.FOLEY,
    genre: '',
    bpm: 120,
    key: 'C Major',
    duration: 0,
    fileUrl: '',
    tags: '',
    isLoopable: false,
    sampleRate: 48000,
    bitDepth: 24,
  });

  useEffect(() => {
    const q = query(collection(db, 'audio_assets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudioMetadata));
      setAssets(assetsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audio_assets');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const assetData = {
        ...formData,
        id: crypto.randomUUID(),
        authorUid: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        bpm: Number(formData.bpm),
        duration: Number(formData.duration),
        sampleRate: Number(formData.sampleRate),
        bitDepth: Number(formData.bitDepth),
      };

      await addDoc(collection(db, 'audio_assets'), assetData);
      setIsAdding(false);
      setFormData({
        title: '',
        description: '',
        type: AssetType.FULL_TRACK,
        stemType: StemType.VOCAL,
        sfxCategory: SFXCategory.FOLEY,
        genre: '',
        bpm: 120,
        key: 'C Major',
        duration: 0,
        fileUrl: '',
        tags: '',
        isLoopable: false,
        sampleRate: 48000,
        bitDepth: 24,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'audio_assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deleteDoc(doc(db, 'audio_assets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `audio_assets/${id}`);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#050505] min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Admin Dashboard</h1>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">Asset Management & Production Control</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 bg-studio-accent text-black font-black uppercase text-xs tracking-widest rounded-full hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Cancel' : 'Add New Asset'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 rounded-3xl border border-white/10"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</label>
                  <input
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    placeholder="Asset Title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none h-24 resize-none"
                    placeholder="Describe the sound..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Type</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as AssetType })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    >
                      {Object.values(AssetType).map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                    </select>
                  </div>
                  {formData.type === AssetType.STEM && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Stem Type</label>
                      <select
                        value={formData.stemType}
                        onChange={e => setFormData({ ...formData, stemType: e.target.value as StemType })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                      >
                        {Object.values(StemType).map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                      </select>
                    </div>
                  )}
                  {formData.type === AssetType.SFX && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">SFX Category</label>
                      <select
                        value={formData.sfxCategory}
                        onChange={e => setFormData({ ...formData, sfxCategory: e.target.value as SFXCategory })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                      >
                        {Object.values(SFXCategory).map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Genre</label>
                    <input
                      value={formData.genre}
                      onChange={e => setFormData({ ...formData, genre: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                      placeholder="e.g. Synthwave"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Key</label>
                    <input
                      value={formData.key}
                      onChange={e => setFormData({ ...formData, key: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                      placeholder="e.g. C Minor"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">BPM</label>
                    <input
                      type="number"
                      value={formData.bpm}
                      onChange={e => setFormData({ ...formData, bpm: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Duration (s)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">File URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      required
                      type="url"
                      value={formData.fileUrl}
                      onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-sm focus:border-studio-accent outline-none"
                      placeholder="https://storage.googleapis.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tags (comma separated)</label>
                  <input
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    placeholder="dark, heavy, bass, cinematic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sample Rate</label>
                    <input
                      type="number"
                      value={formData.sampleRate}
                      onChange={e => setFormData({ ...formData, sampleRate: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bit Depth</label>
                    <input
                      type="number"
                      value={formData.bitDepth}
                      onChange={e => setFormData({ ...formData, bitDepth: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-studio-accent outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    checked={formData.isLoopable}
                    onChange={e => setFormData({ ...formData, isLoopable: e.target.checked })}
                    className="w-4 h-4 accent-studio-accent"
                  />
                  <label className="text-xs font-bold uppercase tracking-widest">Is Loopable</label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-black font-black uppercase text-sm tracking-[0.2em] rounded-xl hover:bg-studio-accent transition-colors disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Publish Asset'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20 pb-4 border-b border-white/5">
          <div className="w-12">Icon</div>
          <div className="flex-1">Asset Name</div>
          <div className="w-32">Type</div>
          <div className="w-32">Genre</div>
          <div className="w-24">BPM</div>
          <div className="w-24">Key</div>
          <div className="w-24 text-right">Actions</div>
        </div>
        {assets.map(asset => (
          <div key={asset.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-studio-accent">
              {asset.type === AssetType.FULL_TRACK && <Music className="w-6 h-6" />}
              {asset.type === AssetType.STEM && <Layers className="w-6 h-6" />}
              {asset.type === AssetType.SFX && <Activity className="w-6 h-6" />}
              {asset.type === AssetType.AMBIENT && <Wind className="w-6 h-6" />}
              {asset.type === AssetType.LOOP && <Clock className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">{asset.title}</h3>
              <p className="text-[10px] text-white/40 font-mono truncate max-w-md">{asset.description}</p>
            </div>
            <div className="w-32">
              <span className="px-2 py-1 bg-white/5 rounded text-[9px] font-black uppercase tracking-widest text-white/60">{asset.type}</span>
            </div>
            <div className="w-32 text-xs text-white/60">{asset.genre || '-'}</div>
            <div className="w-24 text-xs font-mono text-white/40">{asset.bpm || '-'}</div>
            <div className="w-24 text-xs font-mono text-white/40">{asset.key || '-'}</div>
            <div className="w-24 flex justify-end">
              <button
                onClick={() => handleDelete(asset.id)}
                className="p-2 text-white/20 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
