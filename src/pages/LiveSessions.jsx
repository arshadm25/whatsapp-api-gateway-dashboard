import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Users,
    MessageSquare,
    Clock,
    XCircle,
    RefreshCcw,
    ChevronRight,
    Activity,
    Bot,
    Trash2,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function LiveSessions() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const chatEndRef = useRef(null);

    const fetchSessions = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/automation/sessions');
            setSessions(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        }
    };

    const fetchMessages = async (session) => {
        if (!session) return;
        setMessagesLoading(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/automation/sessions/${session.wa_id}/messages`, {
                params: { started_at: session.started_at }
            });
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    };

    const terminateSession = async (id) => {
        if (!confirm('Are you sure you want to forcefully terminate this session?')) return;
        try {
            await axios.delete(`http://localhost:8080/api/automation/sessions/${id}`);
            fetchSessions();
            if (selectedSession?.id === id) {
                setSelectedSession(null);
            }
        } catch (err) {
            console.error('Failed to terminate session:', err);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000); // Poll sessions every 5s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchMessages(selectedSession);
            const interval = setInterval(() => fetchMessages(selectedSession), 3000); // Poll messages more frequently
            return () => clearInterval(interval);
        }
    }, [selectedSession]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50">
            {/* Sessions List */}
            <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-bold text-slate-800">Live Sessions</h2>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {sessions.length} Active
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCcw className="w-6 h-6 text-slate-300 animate-spin" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <Bot className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No active chatbot sessions at the moment.</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative ${selectedSession?.id === session.id
                                        ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-slate-800 truncate pr-8">
                                        {session.contact_name || session.wa_id}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(session.updated_at), 'HH:mm')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                        {session.flow_name || 'Flow'}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                                        {session.current_node}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 truncate italic">
                                    {session.wa_id}
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        terminateSession(session.id);
                                    }}
                                    className="absolute bottom-4 right-4 p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Close Session"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Session Detail / Chat View */}
            <div className="flex-1 flex flex-col bg-slate-50 relative">
                {selectedSession ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg">
                                    {(selectedSession.contact_name || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">
                                        {selectedSession.contact_name || selectedSession.wa_id}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Started {format(new Date(selectedSession.started_at), 'MMM d, HH:mm')}
                                        </span>
                                        <span>•</span>
                                        <span className="text-emerald-600 font-medium">Currently at {selectedSession.current_node}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => terminateSession(selectedSession.id)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition"
                                >
                                    <Trash2 className="w-4 h-4" /> End Session
                                </button>
                            </div>
                        </div>

                        {/* Messages View */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://wweb.dev/assets/whatsapp-chat-back.png')] bg-repeat">
                            {messages.map((msg, i) => {
                                const isOutgoing = msg.status === 'sent';
                                return (
                                    <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm relative group ${isOutgoing
                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 rounded-tl-none'
                                            }`}>
                                            {/* Type Badge */}
                                            {msg.type !== 'text' && (
                                                <div className={`text-[10px] font-bold uppercase mb-1 ${isOutgoing ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                    {msg.type}
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                                                {msg.content}
                                            </div>

                                            {/* Time */}
                                            <div className={`text-[10px] mt-1 text-right ${isOutgoing ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">Select a session</h3>
                        <p className="max-w-xs text-center">
                            Click on an active session from the left sidebar to monitor the real-time conversation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
