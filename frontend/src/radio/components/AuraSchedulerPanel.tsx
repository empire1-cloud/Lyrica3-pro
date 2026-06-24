import React, { useState } from 'react';
import { Clock, Plus, Trash2, Calendar, Sparkles } from 'lucide-react';

interface AuraSchedule {
  id: string;
  time: string;
  days: string[];
  mood: string;
  enabled: boolean;
  eventName?: string;
}

interface AuraSchedulerPanelProps {
  auraSchedules: AuraSchedule[];
  setAuraSchedules: React.Dispatch<React.SetStateAction<AuraSchedule[]>>;
  setToastMessage: (msg: string | null) => void;
}

export const AuraSchedulerPanel: React.FC<AuraSchedulerPanelProps> = ({
  auraSchedules,
  setAuraSchedules,
  setToastMessage,
}) => {
  const [newEventName, setNewEventName] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newMood, setNewMood] = useState('Relaxed');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [showAddForm, setShowAddForm] = useState(false);

  const moodsList = ['Relaxed', 'Focus / Chill', 'Gym / Energetic', 'Sunset Groove'];
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDaySelection = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
    } else {
      setSelectedDays(prev => [...prev, day]);
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert('Please select at least one day for the schedule.');
      return;
    }

    const newSchedule: AuraSchedule = {
      id: `sch_${Date.now()}`,
      time: newTime,
      days: [...selectedDays],
      mood: newMood,
      enabled: true,
      eventName: newEventName.trim() || 'Aura Event'
    };

    setAuraSchedules(prev => [...prev, newSchedule]);
    setNewEventName('');
    setShowAddForm(false);
    
    setToastMessage(`Aura scheduled: "${newSchedule.eventName}" at ${newTime}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const deleteSchedule = (id: string, name: string) => {
    setAuraSchedules(prev => prev.filter(s => s.id !== id));
    setToastMessage(`Removed Aura schedule: "${name}"`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleScheduleEnabled = (id: string) => {
    setAuraSchedules(prev => prev.map(s => {
      if (s.id === id) {
        const nextState = !s.enabled;
        setToastMessage(`${nextState ? 'Enabled' : 'Disabled'} Aura routine: "${s.eventName}"`);
        setTimeout(() => setToastMessage(null), 4000);
        return { ...s, enabled: nextState };
      }
      return s;
    }));
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6 backdrop-blur-xl relative overflow-hidden">
      {/* Background Glow Deco */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-[40px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-pink-500/20 bg-pink-500/5 rounded-xl text-pink-500">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white">Aura Streams Scheduler</h4>
            <span className="text-[10px] font-mono text-white/40 block">Configure time-triggered musical environments</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[10px] font-bold uppercase rounded-lg hover:bg-pink-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancel' : 'Add Routine'}</span>
        </button>
      </div>

      {/* Add Schedule Form */}
      {showAddForm && (
        <form onSubmit={handleAddSchedule} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 animate-fade-in relative z-10">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block">Routine Name</label>
              <input
                type="text"
                placeholder="e.g. Afternoon Focus"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50 placeholder:text-white/20 font-sans"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block">Environment Mood</label>
              <select
                value={newMood}
                onChange={(e) => setNewMood(e.target.value)}
                className="w-full bg-[#15161f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50 cursor-pointer font-sans"
              >
                {moodsList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="space-y-1">
              <label className="text-[9px] font-bold tracking-widest uppercase text-white/40 block">Trigger Clock Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold tracking-widest uppercase text-white/40 block mb-1">Target Days</span>
              <div className="flex gap-1">
                {allDays.map(day => {
                  const isSel = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDaySelection(day)}
                      className={`w-7 h-7 text-[8px] font-bold flex items-center justify-center rounded-lg transition-all border ${
                        isSel 
                          ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' 
                          : 'bg-white/5 border-white/5 text-white/30 hover:text-white/60'
                      }`}
                    >
                      {day[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(236,72,153,0.2)]"
          >
            Create Trigger Routine
          </button>
        </form>
      )}

      {/* Routine list */}
      <div className="space-y-2.5">
        {auraSchedules.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <Calendar className="w-5 h-5 text-white/20 mx-auto mb-2" />
            <p className="text-[10px] font-mono text-white/30">No Scheduled routines registered yet.</p>
          </div>
        ) : (
          auraSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                schedule.enabled 
                  ? 'bg-white/[0.03] border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.1)]' 
                  : 'bg-white/[0.01] border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Time Indicator */}
                <div className="text-center px-2.5 py-1.5 bg-white/5 rounded-xl border border-white/10 font-mono">
                  <span className="text-xs font-bold text-white block">{schedule.time}</span>
                  <span className="text-[7px] text-pink-400 font-bold block uppercase tracking-wider">{schedule.mood.split(' ')[0]}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/90">{schedule.eventName}</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-mono text-pink-400 bg-pink-500/10 rounded border border-pink-500/20">
                      <Sparkles className="w-2 h-2" />
                      {schedule.mood}
                    </span>
                  </div>

                  {/* Active Days indicator */}
                  <div className="flex gap-1">
                    {allDays.map(day => {
                      const isActive = schedule.days.includes(day);
                      return (
                        <span
                          key={day}
                          className={`text-[7px] font-mono font-bold tracking-tight px-1 rounded ${
                            isActive ? 'text-pink-400 bg-pink-500/15' : 'text-white/20'
                          }`}
                        >
                          {day.substring(0, 2)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Toggle switch & Delete */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleScheduleEnabled(schedule.id)}
                  className={`w-8 h-4 rounded-full relative p-0.5 transition-colors duration-200 outline-none ${
                    schedule.enabled ? 'bg-pink-500' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                    schedule.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>

                <button
                  onClick={() => deleteSchedule(schedule.id, schedule.eventName || schedule.mood)}
                  className="p-1.5 hover:text-red-400 text-white/30 transition-colors"
                  title="Remove Trigger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
