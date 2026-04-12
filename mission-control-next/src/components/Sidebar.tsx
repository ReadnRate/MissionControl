"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Search, FileText, Settings, Target, ListTodo, Map, Users, Mail, Bot, Building2, Vote } from 'lucide-react';

const menuGroups = [
  {
    title: "Command Center",
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Tasks', path: '/tasks', icon: ListTodo },
      { name: 'Daily Brief', path: '/daily-brief', icon: FileText },
      { name: 'Roadmap', path: '/roadmap', icon: Map },
    ]
  },
  {
    title: "Creative",
    items: [
      { name: 'Ideas Vault', path: '/ideas', icon: Lightbulb },
      { name: 'Ideas Vote', path: '/ideas-vote', icon: Vote },
      { name: 'Campaigns', path: '/campaigns', icon: Mail },
      { name: 'Tactics', path: '/tactics', icon: Target },
    ]
  },
  {
    title: "Intelligence",
    items: [
      { name: 'Intel & Research', path: '/intel', icon: Search },
      { name: 'Author Leads', path: '/authors', icon: Users },
      { name: 'Trym Leads', path: '/trym-leads', icon: Building2 },
      { name: 'Outreach', path: '/outreach', icon: Mail },
      { name: 'Scrap.io', path: '/scrapio', icon: Bot },
      { name: 'Cities', path: '/scrapio/cities', icon: Map },
    ]
  },
  {
    title: "System",
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-slate-950 border-r border-slate-800/60 flex flex-col h-screen z-50 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-slate-950 font-black text-sm leading-none">MC</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Mission Control</div>
            <div className="text-slate-500 text-[10px] font-medium tracking-wide">ReadnRate</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-cyan-400' : 'text-slate-600'} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-800/60">
        <p className="text-[10px] text-slate-600 font-mono">ReadnRate · Mission Control</p>
      </div>
    </aside>
  );
}
