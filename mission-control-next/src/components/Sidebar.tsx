"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lightbulb, Search, Calendar, FileText, Settings, Target, ListTodo, Map, Users, Mail, Bot, Building2 } from 'lucide-react';

const menuGroups = [
  {
    title: "COMMAND CENTER",
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Tasks (Kanban)', path: '/tasks', icon: ListTodo },
      { name: 'Daily Brief', path: '/daily-brief', icon: FileText },
      { name: 'Roadmap', path: '/roadmap', icon: Map },
    ]
  },
  {
    title: "CREATIVE",
    items: [
      { name: 'Ideas Vault', path: '/ideas', icon: Lightbulb },
      { name: 'Ideas Vote', path: '/ideas-vote', icon: Lightbulb },
      { name: 'Marketing Campaigns', path: '/campaigns', icon: Mail },
      { name: 'Guerrilla Tactics', path: '/tactics', icon: Target },
    ]
  },
  {
    title: "INTELLIGENCE",
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
    title: "SYSTEM",
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-screen z-50 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white">M</div>
          Mission Control
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/50 shadow-inner' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 font-mono text-center">
        ReadnRate · Mission Control
      </div>
    </aside>
  );
}
