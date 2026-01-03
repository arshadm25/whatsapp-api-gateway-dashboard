import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radio, RefreshCw, Send, Users, FileText, Smartphone, CheckCircle } from 'lucide-react';

export default function Broadcast() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [contacts, setContacts] = useState([]);
    const [sending, setSending] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const API_URL = 'http://localhost:8080/api';

    useEffect(() => {
        fetchTemplates();
        fetchContacts();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/templates`);
            setTemplates(res.data || []);
            // Sync fallback
            if (!res.data || res.data.length === 0) {
                await axios.post(`${API_URL}/templates/sync`);
                const res2 = await axios.get(`${API_URL}/templates`);
                setTemplates(res2.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const res = await axios.get(`${API_URL}/contacts`);
            setContacts(res.data || []);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        }
    };

    const handleBroadcast = async () => {
        if (!selectedTemplate) return;
        setSending(true);
        try {
            const tmpl = templates.find(t => t.id === selectedTemplate) || { name: selectedTemplate, language: "en_US" };
            await axios.post(`${API_URL}/broadcast`, {
                template_name: tmpl.name,
                language: tmpl.language || "en_US",
                contacts: contacts.map(c => c.wa_id) // Sending to ALL contacts
            });
            alert("Broadcast campaign launched successfully!");
            setCurrentStep(1);
            setSelectedTemplate('');
        } catch (error) {
            alert("Broadcast failed.");
        } finally {
            setSending(false);
        }
    };

    const tmplObj = templates.find(t => t.id === selectedTemplate);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">New Campaign</h2>
                    <p className="text-slate-500 text-sm mt-1">Send bulk messages to your audience</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Wizard Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Steps Indicator */}
                    <div className="flex items-center gap-4 mb-8">
                        {[1, 2, 3].map(step => (
                            <div key={step} className={`flex items-center gap-2 ${currentStep >= step ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${currentStep >= step ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>
                                    {step}
                                </div>
                                <span className="text-sm">
                                    {step === 1 ? 'Audience' : step === 2 ? 'Content' : 'Review'}
                                </span>
                                {step < 3 && <div className="w-8 h-0.5 bg-slate-200 mx-2" />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Audience */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all ${currentStep === 1 ? 'ring-2 ring-emerald-500/20' : 'opacity-50 pointer-events-none'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Select Audience</h3>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-emerald-300 transition">
                            <div>
                                <h4 className="font-semibold text-slate-900">All Contacts</h4>
                                <p className="text-sm text-slate-500">Currently {contacts.length} active contacts</p>
                            </div>
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        {currentStep === 1 && (
                            <button onClick={() => setCurrentStep(2)} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition">
                                Next: Choose Content
                            </button>
                        )}
                    </div>

                    {/* Step 2: Content */}
                    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all ${currentStep === 2 ? 'ring-2 ring-emerald-500/20' : currentStep < 2 ? 'opacity-40 grayscale' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-semibold text-slate-800">Message Template</h3>
                            </div>
                            <button onClick={fetchTemplates} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Sync Meta
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTemplate === t.id ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="font-medium text-slate-900 truncate">{t.name}</div>
                                    <div className="text-xs text-slate-500 uppercase mt-1">{t.language}</div>
                                </div>
                            ))}
                        </div>
                        {/* If no templates */}
                        {templates.length === 0 && !loading && (
                            <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                                No templates found. Click "Sync Meta" to fetch from WhatsApp.
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setCurrentStep(1)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
                                    Back
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    disabled={!selectedTemplate}
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
                                >
                                    Next: Review & Send
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3 mb-6">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-semibold text-slate-800">Ready to Launch?</h3>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Recipients</span>
                                    <span className="font-semibold text-slate-900">{contacts.length} Contacts</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Template</span>
                                    <span className="font-semibold text-slate-900">{tmplObj?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Cost Estimate</span>
                                    <span className="font-semibold text-slate-900">~ $ {(contacts.length * 0.05).toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBroadcast}
                                disabled={sending}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {sending ? 'Launching Campaign...' : <><Send className="w-5 h-5" /> Launch Campaign Now</>}
                            </button>
                            <button onClick={() => setCurrentStep(2)} className="w-full mt-3 py-2 text-slate-500 text-sm hover:text-slate-800">
                                Back to Edit
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm uppercase font-semibold tracking-wider">
                            <Smartphone className="w-4 h-4" /> Message Preview
                        </div>

                        <div className="bg-slate-900 rounded-[3rem] p-4 shadow-2xl border-4 border-slate-800 relative z-10 w-full max-w-sm mx-auto aspect-[9/19]">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-800 rounded-b-2xl z-20"></div>

                            {/* Screen */}
                            <div className="bg-[#efeae2] w-full h-full rounded-[2.2rem] overflow-hidden relative flex flex-col">
                                <div className="h-20 bg-[#075e54] flex items-end pb-3 px-4 shadow-md z-10">
                                    <div className="flex items-center gap-3 text-white">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs">A</div>
                                        <div>
                                            <div className="font-semibold text-sm leading-none">Business</div>
                                            <div className="text-[10px] opacity-80 mt-0.5">Verified Business</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                                    {tmplt => selectedTemplate ? (
                                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm relative">
                                            <div className="font-bold text-slate-800 mb-1">{tmplObj?.name}</div>
                                            <div className="text-slate-600 leading-relaxed text-xs">
                                                Hello {"{{1}}"}, <br />
                                                This is a preview of your template message content...
                                            </div>
                                            <span className="text-[10px] text-slate-400 absolute bottom-1 right-2">12:00 PM</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center mt-10">
                                            <div className="bg-[#fff5c4] text-slate-600 text-[10px] py-1 px-3 rounded shadow-sm text-center">
                                                Select a template to preview <br /> encrypted end-to-end
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
