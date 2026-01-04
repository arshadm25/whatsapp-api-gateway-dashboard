import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Settings,
    Save,
    Key,
    Smartphone,
    ShieldCheck,
    Database,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    Copy,
    ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/settings');
            setSettings(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        }
    };

    const handleUpdate = async (key, value) => {
        try {
            setSaving(true);
            await axios.post('http://localhost:8080/api/settings', { key, value });
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            fetchSettings();

            // Clear message after 3 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error('Failed to update setting:', err);
            setMessage({ type: 'error', text: 'Failed to update setting.' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (key, value) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const getIcon = (key) => {
        switch (key) {
            case 'WHATSAPP_TOKEN': return <Key className="w-5 h-5 text-amber-500" />;
            case 'PHONE_NUMBER_ID': return <Smartphone className="w-5 h-5 text-blue-500" />;
            case 'VERIFY_TOKEN': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
            case 'WABA_ID': return <Database className="w-5 h-5 text-purple-500" />;
            default: return <Settings className="w-5 h-5 text-slate-500" />;
        }
    };

    const getLabel = (key) => {
        return key.replace(/_/g, ' ');
    };

    const getDescription = (key) => {
        switch (key) {
            case 'WHATSAPP_TOKEN': return 'Permanent access token for the WhatsApp Business API.';
            case 'PHONE_NUMBER_ID': return 'The unique ID for the phone number you are using.';
            case 'VERIFY_TOKEN': return 'A custom string used to verify your webhook with Meta.';
            case 'WABA_ID': return 'Your WhatsApp Business Account ID.';
            default: return '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
                    <p className="text-slate-500 text-sm">Manage your WhatsApp Business API credentials and system configuration.</p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href="https://developers.facebook.com/apps"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                    >
                        <ExternalLink className="w-4 h-4" /> Meta Dashboard
                    </a>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            WhatsApp Business API Credentials
                        </h2>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {settings.map((setting) => (
                            <div key={setting.key} className="p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className="shrink-0 pt-1">
                                        {getIcon(setting.key)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                                                {getLabel(setting.key)}
                                            </label>
                                            <button
                                                onClick={() => copyToClipboard(setting.value)}
                                                className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                                                title="Copy to clipboard"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">{getDescription(setting.key)}</p>
                                        <div className="flex gap-2">
                                            <input
                                                type={setting.key.includes('TOKEN') ? 'password' : 'text'}
                                                value={setting.value}
                                                onChange={(e) => handleInputChange(setting.key, e.target.value)}
                                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                            />
                                            <button
                                                onClick={() => handleUpdate(setting.key, setting.value)}
                                                disabled={saving}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
                                            >
                                                {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900 text-sm mb-1">Important Note</h4>
                        <p className="text-amber-800 text-xs leading-relaxed">
                            Changes to these settings take effect immediately for new requests. However, it is recommended to <strong>restart the server</strong> after updating tokens to ensure all background processes use the new credentials correctly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
