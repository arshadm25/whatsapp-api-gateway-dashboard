import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, RefreshCw, Trash2, Eye, X, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const API_URL = 'http://localhost:8080/api';

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/templates`);
            setTemplates(res.data || []);
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setLoading(false);
        }
    };

    const syncFromMeta = async () => {
        try {
            setSyncing(true);
            const res = await axios.post(`${API_URL}/templates/sync`);
            alert(`Synced ${res.data.count} templates from Meta`);
            await fetchTemplates();
        } catch (error) {
            alert('Failed to sync templates: ' + (error.response?.data?.error || error.message));
        } finally {
            setSyncing(false);
        }
    };

    const parseComponents = (componentsStr) => {
        try {
            return JSON.parse(componentsStr || '[]');
        } catch {
            return [];
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'APPROVED': { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
            'PENDING': { icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
            'REJECTED': { icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        };
        const badge = badges[status] || { icon: AlertCircle, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    const getCategoryBadge = (category) => {
        const colors = {
            'MARKETING': 'bg-purple-50 text-purple-700 border-purple-200',
            'UTILITY': 'bg-blue-50 text-blue-700 border-blue-200',
            'AUTHENTICATION': 'bg-orange-50 text-orange-700 border-orange-200',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors[category] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                {category}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Message Templates</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your WhatsApp message templates synced from Meta</p>
                </div>
                <button
                    onClick={syncFromMeta}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-lg shadow-emerald-200/50 disabled:opacity-70"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync from Meta'}
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                    <strong>Note:</strong> Templates are created and managed in the{' '}
                    <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                        Meta Business Suite
                    </a>.
                    Click "Sync from Meta" to fetch the latest templates.
                </div>
            </div>

            {/* Templates Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4">Template Name</th>
                                <th className="px-6 py-4">Language</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading templates...
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">No templates found</p>
                                        <p className="text-slate-400 text-sm mt-1">Click "Sync from Meta" to fetch your templates</p>
                                    </td>
                                </tr>
                            ) : (
                                templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{template.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{template.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                                {template.language}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getCategoryBadge(template.category)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(template.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedTemplate(template)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Count Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
                    Showing {templates.length} template(s)
                </div>
            </div>

            {/* Template Detail Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{selectedTemplate.name}</h3>
                                <p className="text-sm text-slate-500">{selectedTemplate.language} • {selectedTemplate.category}</p>
                            </div>
                            <button onClick={() => setSelectedTemplate(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4">
                                <span className="text-xs uppercase font-semibold text-slate-400">Status</span>
                                <div className="mt-1">{getStatusBadge(selectedTemplate.status)}</div>
                            </div>

                            <div className="mb-4">
                                <span className="text-xs uppercase font-semibold text-slate-400">Template ID</span>
                                <div className="mt-1 font-mono text-sm text-slate-600 bg-slate-50 p-2 rounded">{selectedTemplate.id}</div>
                            </div>

                            <div>
                                <span className="text-xs uppercase font-semibold text-slate-400">Components</span>
                                <div className="mt-2 space-y-3">
                                    {parseComponents(selectedTemplate.components).map((comp, idx) => (
                                        <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium rounded uppercase">{comp.type}</span>
                                                {comp.format && <span className="text-xs text-slate-500">{comp.format}</span>}
                                            </div>
                                            {comp.text && <p className="text-sm text-slate-700 whitespace-pre-wrap">{comp.text}</p>}
                                            {comp.buttons && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {comp.buttons.map((btn, i) => (
                                                        <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">{btn.text}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {parseComponents(selectedTemplate.components).length === 0 && (
                                        <p className="text-slate-400 text-sm">No component data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
