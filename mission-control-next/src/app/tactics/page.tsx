"use client";
import React from 'react';
import { Target, ShieldAlert, Crosshair } from 'lucide-react';

export default function Tactics() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-600 font-mono">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Target className="text-rose-500" size={28} />
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Guerrilla Tactics</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Alternative Acquisition Strategies (Post-Digg)</p>
          </div>
        </div>
      </header>

      <div className="bg-rose-950/20 border border-rose-900/50 p-6 rounded-2xl shadow-xl mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="text-rose-500" size={24} />
          <h3 className="text-xl font-bold text-slate-900">Status: PIVOT REQUIRED</h3>
        </div>
        <p className="text-sm text-slate-500">Digg open beta shut down March 14, 2026. All operations shifted to Reddit and direct outreach.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/50 border border-slate-200 p-6 rounded-2xl">
           <h4 className="flex items-center gap-2 text-slate-900 font-bold mb-4"><Crosshair className="text-orange-500" size={18}/> Reddit /r/KDP Infiltration</h4>
           <p className="text-sm text-slate-500 mb-4">Targeting frustrated authors experiencing fake reviews. Offering the 50 Reviews Guarantee as a verified alternative.</p>
           <button className="bg-orange-600/20 text-orange-500 border border-orange-500/50 px-4 py-2 rounded font-bold text-xs w-full hover:bg-orange-600 hover:text-slate-900 transition-colors">
             Launch Campaign
           </button>
        </div>
      </div>
    </div>
  );
}
