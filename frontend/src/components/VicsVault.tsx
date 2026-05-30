import React, { useState } from 'react';
import { ShieldCheck, Fingerprint, Lock, Upload, Database, DollarSign } from 'lucide-react';

export default function VicsVault() {
  const [voiceName, setVoiceName] = useState('');
  const [royaltyRate, setRoyaltyRate] = useState(0.005);
  
  const handleUpload = () => {
    alert("VICS Protocol Engaged: Stem uploaded. Extracting phonetic weight and dynamic articulation...\nSealing DNA tag with cryptographic hash.");
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 text-white font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-[#2d2d6b] pb-4">
        <div>
          <h2 className="text-3xl font-black text-[#00ffcc] flex items-center gap-3">
            <ShieldCheck size={32} /> THE PERSONA VAULT [VICS]
          </h2>
          <p className="text-xs text-[#888] font-mono tracking-widest mt-1">Vocal Identity & Consent Steward • Cryptographic Ledger</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-[#666]">Empire 1 Lane 02 Status:</p>
          <p className="text-lg font-bold text-[#00ffcc]">$1,245.50 <span className="text-xs text-[#888]">Micro-Royalties</span></p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        
        {/* Upload & Clone Section */}
        <div className="col-span-1 bg-[#0a0a14] border border-[#2d2d6b] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#eee] flex items-center gap-2 mb-4">
              <Upload size={18} className="text-[#ff1493]" /> Clone Your DNA
            </h3>
            <p className="text-xs text-[#888] mb-6">Upload raw acapella stems. The EPD will map your micro-tremors and emotional breaks.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-[#666] block mb-1">Persona Name</label>
                <input 
                  type="text" 
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="e.g., ShadyBoy 2.0"
                  className="w-full bg-[#13132b] border border-[#2d2d6b] p-2 text-sm focus:border-[#00ffcc] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-mono uppercase text-[#666] block mb-1">"Flip It" Royalty Rate (USD)</label>
                <div className="flex items-center gap-2 bg-[#13132b] border border-[#2d2d6b] p-2">
                  <DollarSign size={14} className="text-[#00ffcc]" />
                  <input 
                    type="number" 
                    step="0.001"
                    value={royaltyRate}
                    onChange={(e) => setRoyaltyRate(parseFloat(e.target.value))}
                    className="bg-transparent w-full text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-[#2d2d6b] p-6 text-center cursor-pointer hover:border-[#00ffcc] transition-colors bg-[#050505]">
                <Fingerprint size={24} className="mx-auto text-[#666] mb-2" />
                <p className="text-xs text-[#888]">Drop .WAV Stems Here</p>
              </div>
            </div>
          </div>

          <button onClick={handleUpload} className="w-full mt-6 bg-[#1a1a4e] hover:bg-[#2d2d6b] border border-[#00ffcc] text-[#00ffcc] font-bold py-3 text-sm tracking-widest transition-all">
            INITIATE VICS SEAL
          </button>
        </div>

        {/* Database / Active Personas */}
        <div className="col-span-2 bg-[#050505] border border-[#2d2d6b] rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#eee] flex items-center gap-2 mb-6">
            <Database size={18} className="text-blue-500" /> Active Protected Personas
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Mateo (Corrido Voice)', tag: '0x8F9A3B...29C', uses: 140500, earned: 702.50 },
              { name: 'Elara (Breathy Alto)', tag: '0x4B2C1F...88A', uses: 89200, earned: 446.00 }
            ].map((p, i) => (
              <div key={i} className="bg-[#13132b] border border-[#2d2d6b] p-4 flex items-center justify-between group hover:border-blue-500 transition-colors">
                <div>
                  <h4 className="font-bold text-[#ddd] text-sm">{p.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono text-[#00ffcc] flex items-center gap-1">
                      <Lock size={10} /> {p.tag}
                    </span>
                    <span className="text-[10px] font-mono text-[#666]">PAIPDS Encrypted</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#ff1493]">{p.uses.toLocaleString()} Flips</p>
                  <p className="text-xs text-[#888] font-mono">+${p.earned.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-[#0a0a14] border border-[#2d2d6b] border-l-4 border-l-[#00ffcc]">
            <p className="text-xs text-[#aaa] font-mono leading-relaxed">
              <strong className="text-[#00ffcc]">Opt-in Biometric Privacy Protocol Active:</strong> Your Voice DNA is currently accessible on the SL Universal public network. The ERMTP (Embedded Rights Management) autonomously scans for unauthorized usage. Smart contracts will automatically split lane 01 revenue to your wallet for every "Flip".
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}