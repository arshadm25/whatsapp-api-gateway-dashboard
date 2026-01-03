import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, RefreshCw, Search, Phone, MoreVertical, Paperclip, Check, CheckCheck } from 'lucide-react';

export default function Inbox() {
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const API_URL = 'http://localhost:8080/api';

    // Fetch data
    const refreshData = async () => {
        setLoading(true);
        try {
            const [msgRes, contactRes] = await Promise.all([
                axios.get(`${API_URL}/messages`),
                axios.get(`${API_URL}/contacts`)
            ]);
            setMessages(msgRes.data || []);
            setContacts(contactRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    // Derive conversations from messages - group by phone number (sender)
    const conversations = React.useMemo(() => {
        const convos = {};

        messages.forEach(msg => {
            // All messages now use sender field as the phone number
            // (received messages: sender = incoming phone, sent messages: sender = recipient phone)
            const phoneNumber = msg.sender;

            // Skip system messages or invalid entries
            if (!phoneNumber || phoneNumber === 'system') return;

            if (!convos[phoneNumber]) {
                const contact = contacts.find(c => c.wa_id === phoneNumber);
                convos[phoneNumber] = {
                    id: phoneNumber,
                    name: contact?.name || phoneNumber,
                    profilePic: contact?.profile_pic_url,
                    lastMessage: msg.content || '',
                    time: msg.created_at,
                    unread: 0
                };
            } else {
                // Update last message if this message is newer
                if (new Date(msg.created_at) > new Date(convos[phoneNumber].time)) {
                    convos[phoneNumber].lastMessage = msg.content || '';
                    convos[phoneNumber].time = msg.created_at;
                }
            }
        });

        return Object.values(convos).sort((a, b) => new Date(b.time) - new Date(a.time));
    }, [messages, contacts]);

    // Handle Sending
    const handleSend = async (e) => {
        e.preventDefault();
        if (!selectedContactId || !newMessage.trim()) return;

        setSending(true);
        try {
            await axios.post(`${API_URL}/send`, { to: selectedContactId, content: newMessage });
            setNewMessage('');
            // Optimistic update or wait for poll
            await refreshData();
        } catch (error) {
            alert("Failed to send: " + error.message);
        } finally {
            setSending(false);
        }
    };

    // Current Conversation Messages - filter by sender (phone number)
    const currentMessages = messages
        .filter(m => m.sender === selectedContactId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Ascending for chat view

    // Helper to render different message types
    const renderMessageContent = (content) => {
        if (!content) return null;

        if (content.startsWith('[image]:')) {
            const parts = content.split(':');
            const mediaId = parts[1];
            const caption = parts.slice(2).join(':');
            return (
                <div className="space-y-1">
                    <img
                        src={`${API_URL}/whatsapp/media/${mediaId}/proxy`}
                        alt="Shared Image"
                        className="rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-95 transition"
                        onClick={() => window.open(`${API_URL}/whatsapp/media/${mediaId}/proxy`, '_blank')}
                    />
                    {caption && <p>{caption}</p>}
                </div>
            );
        }

        if (content.startsWith('[video]:')) {
            const parts = content.split(':');
            const mediaId = parts[1];
            const caption = parts.slice(2).join(':');
            return (
                <div className="space-y-1">
                    <video
                        controls
                        src={`${API_URL}/whatsapp/media/${mediaId}/proxy`}
                        className="rounded-lg max-h-60 w-full bg-black/5"
                    />
                    {caption && <p>{caption}</p>}
                </div>
            );
        }

        if (content.startsWith('[audio]:')) {
            const mediaId = content.split(':')[1];
            return (
                <audio controls src={`${API_URL}/whatsapp/media/${mediaId}/proxy`} className="w-full min-w-[200px]" />
            );
        }

        if (content.startsWith('[document]:')) {
            const parts = content.split(':');
            const mediaId = parts[1];
            const filename = parts.slice(2).join(':') || 'Document';
            return (
                <a
                    href={`${API_URL}/whatsapp/media/${mediaId}/proxy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition group"
                >
                    <div className="p-2 bg-white rounded-md shadow-sm group-hover:scale-105 transition">
                        <Paperclip className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 truncate max-w-[200px]">{filename}</span>
                </a>
            );
        }

        if (content.startsWith('[flow_response]:')) {
            const jsonStr = content.substring('[flow_response]:'.length);
            try {
                const data = JSON.parse(jsonStr);
                return (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
                        <div className="font-semibold text-slate-500 mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Flow Response
                        </div>
                        <div className="space-y-1">
                            {Object.entries(data).map(([key, value]) => (
                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
                                    <span className="font-medium text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-slate-800 font-mono bg-white px-1.5 rounded border border-slate-100">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            } catch (e) {
                return <p className="text-xs font-mono text-slate-500 break-all">{jsonStr}</p>;
            }
        }

        return <p>{content}</p>;
    };

    return (
        <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 h-[calc(100vh-140px)]">
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b border-slate-100">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedContactId(chat.id)}
                            className={`p-4 border-b border-slate-50 hover:bg-white cursor-pointer transition-colors group ${selectedContactId === chat.id ? 'bg-white border-l-4 border-l-emerald-500 shadow-sm' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex gap-3">
                                <div className="relative">
                                    <img
                                        src={chat.profilePic || `https://ui-avatars.com/api/?name=${chat.name}&background=random`}
                                        alt={chat.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedContactId === chat.id ? 'text-slate-800' : 'text-slate-700'}`}>{chat.name}</h3>
                                        <span className="text-[10px] text-slate-400">{chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate group-hover:text-slate-600">
                                        {chat.lastMessage}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {conversations.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No conversations yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {/* Chat Background Pattern */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat pointer-events-none"></div>

                {selectedContactId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 bg-white border-b border-slate-100 flex items-center justify-between z-10 sticky top-0">
                            <div className="flex items-center gap-3">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${selectedContactId}&background=random`}
                                    className="w-9 h-9 rounded-full"
                                    alt="User"
                                />
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">{selectedContactId}</h3>
                                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400">
                                <button className="hover:text-slate-600 transition"><Phone className="w-5 h-5" /></button>
                                <button className="hover:text-slate-600 transition"><Search className="w-5 h-5" /></button>
                                <button className="hover:text-slate-600 transition"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 z-0">
                            {currentMessages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.status === 'sent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md px-4 py-2 rounded-lg shadow-sm relative text-sm ${msg.status === 'sent'
                                        ? 'bg-emerald-100 text-slate-800 rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-tl-none'
                                        }`}>
                                        {renderMessageContent(msg.content)}
                                        <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.status === 'sent' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 z-10">
                            <form onSubmit={handleSend} className="flex items-center gap-3">
                                <input
                                    type="file"
                                    id="chat-attachment"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        setSending(true);
                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            // 1. Upload Media
                                            const uploadRes = await axios.post(`${API_URL}/whatsapp/media`, formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            const mediaId = uploadRes.data.id;

                                            // 2. Determine type based on MIME
                                            const mimeType = file.type;
                                            let msgType = 'document';
                                            let mediaPayload = { id: mediaId, filename: file.name };

                                            if (mimeType.startsWith('image/')) {
                                                msgType = 'image';
                                                mediaPayload = { id: mediaId, caption: newMessage };
                                            } else if (mimeType.startsWith('video/')) {
                                                msgType = 'video';
                                                mediaPayload = { id: mediaId, caption: newMessage };
                                            } else if (mimeType.startsWith('audio/')) {
                                                msgType = 'audio';
                                                mediaPayload = { id: mediaId };
                                            }

                                            // 3. Send Message
                                            await axios.post(`${API_URL}/whatsapp/send`, {
                                                messaging_product: "whatsapp",
                                                to: selectedContactId,
                                                type: msgType,
                                                [msgType]: mediaPayload
                                            });

                                            setNewMessage('');
                                            await refreshData();
                                        } catch (error) {
                                            alert("Failed to send attachment: " + error.message);
                                        } finally {
                                            setSending(false);
                                            e.target.value = ''; // Reset input
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('chat-attachment').click()}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition"
                                    disabled={sending}
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 py-3 px-4 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 z-0">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-10 h-10 text-slate-300 ml-1" />
                        </div>
                        <p className="font-medium text-slate-400">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
