"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';

const AGENTS = ['JOE', 'FORGE', 'AURA', 'BEACON'];

export default function AgentChat() {
  const [selectedAgent, setSelectedAgent] = useState('JOE');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new;
        if (
          (newMessage.sender === selectedAgent && newMessage.recipient === 'USER') ||
          (newMessage.sender === 'USER' && newMessage.recipient === selectedAgent)
        ) {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedAgent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.eq.${selectedAgent},recipient.eq.${selectedAgent}`)
      .order('timestamp', { ascending: true });
    
    if (!error && data) {
      const filtered = data.filter(
        (m) => (m.sender === selectedAgent && m.recipient === 'USER') || (m.sender === 'USER' && m.recipient === selectedAgent)
      );
      setMessages(filtered);
    }
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      content: input.trim(),
      sender: 'USER',
      recipient: selectedAgent,
      timestamp: new Date().toISOString()
    };

    setInput('');
    // Optimistic UI update
    const tempId = Math.random().toString();
    setMessages((prev) => [...prev, { ...newMessage, id: tempId }]);

    const { error } = await supabase.from('messages').insert([newMessage]);
    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message and refetch
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      fetchMessages(); 
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-800 bg-slate-950">
        <MessageSquare size={18} className="text-cyan-400" />
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Direct Command</h2>
      </div>
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/50 no-scrollbar">
        {AGENTS.map((agent) => (
          <button
            key={agent}
            onClick={() => setSelectedAgent(agent)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap uppercase tracking-wider transition-colors flex-1 ${
              selectedAgent === agent
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            {agent}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-cyan-500" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm font-medium italic">
            No messages yet. Send a command to {selectedAgent}.
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-indigo-600' : 'bg-cyan-900/80 border border-cyan-700/50'
                }`}>
                  {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-cyan-200" />}
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block opacity-60 ${isUser ? 'text-right' : ''}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form onSubmit={sendMessage} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Send command to ${selectedAgent}...`}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors shadow-lg"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
