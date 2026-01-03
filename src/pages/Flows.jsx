import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Plus, Upload, Play, Trash2, MoreVertical, FileCode, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import FlowBuilder from '../components/FlowBuilder';

export default function Flows() {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form
    const [newFlowName, setNewFlowName] = useState('');
    const [newFlowCategory, setNewFlowCategory] = useState(["OTHER"]);
    const [editingFlowId, setEditingFlowId] = useState(null);

    const API_URL = 'http://localhost:8080/api/whatsapp';

    useEffect(() => {
        fetchFlows();
    }, []);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/flows`);
            // Meta response structure is usually { data: [...] }
            setFlows(res.data.data || []);
        } catch (error) {
            console.error("Error fetching flows", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/flows`, {
                name: newFlowName,
                categories: newFlowCategory
            });
            setShowCreateModal(false);
            fetchFlows();
            setNewFlowName('');
        } catch (error) {
            alert('Failed to create flow: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this flow?')) return;
        try {
            await axios.delete(`${API_URL}/flows/${id}`);
            fetchFlows();
        } catch (error) {
            alert('Delete failed (Flow might be published or in use): ' + error.message);
        }
    };

    const handlePublish = async (id) => {
        if (!confirm('Publishing is irreversible. Continue?')) return;
        try {
            await axios.post(`${API_URL}/flows/${id}/publish`);
            fetchFlows();
            alert('Flow published!');
        } catch (error) {
            alert('Publish failed: ' + error.message);
        }
    };

    const handleUploadJSON = async (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post(`${API_URL}/flows/${id}/assets`, formData);
            alert('Flow JSON uploaded successfully.');
        } catch (error) {
            alert('Upload failed: ' + error.message);
        }
    };

    const handleBuilderSave = async (flowJson) => {
        if (!editingFlowId) return;
        const blob = new Blob([JSON.stringify(flowJson, null, 2)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('file', blob, 'flow.json');

        try {
            await axios.post(`${API_URL}/flows/${editingFlowId}/assets`, formData);
            alert('Flow updated successfully.');
            setEditingFlowId(null);
        } catch (error) {
            alert('Update failed: ' + error.message);
        }
    };

    if (editingFlowId) {
        return (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-140px)]">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Layers className="w-5 h-5" /> Visual Flow Builder</h2>
                    <div className="text-xs text-slate-500 font-mono">ID: {editingFlowId}</div>
                </div>
                <div className="p-4 h-full bg-slate-100">
                    <FlowBuilder
                        onSave={handleBuilderSave}
                        onCancel={() => setEditingFlowId(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Flows</h2>
                    <p className="text-slate-500 text-sm">Create and manage interactive WhatsApp flows.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                    <Plus className="w-5 h-5" /> Create Flow
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {flows.map(flow => (
                    <div key={flow.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${flow.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {flow.status}
                                </span>
                                <div className="p-2 hover:bg-slate-50 rounded-full cursor-pointer text-slate-400">
                                    <MoreVertical className="w-4 h-4" />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{flow.name}</h3>
                            <p className="text-xs text-slate-500 font-mono mb-4">ID: {flow.id}</p>

                            <div className="flex gap-2 flex-wrap mb-6">
                                {(flow.categories || []).map(cat => (
                                    <span key={cat} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            {/* Actions */}
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setEditingFlowId(flow.id)}
                                    className="text-xs font-medium text-purple-600 flex items-center gap-1 hover:underline"
                                >
                                    <Edit3 className="w-3 h-3" /> Edit
                                </button>

                                <label className="text-xs font-medium text-slate-600 flex items-center gap-1 cursor-pointer hover:text-emerald-600 transition">
                                    <FileCode className="w-4 h-4" />
                                    <span>Upload JSON</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".json"
                                        onChange={(e) => {
                                            if (e.target.files[0]) handleUploadJSON(flow.id, e.target.files[0]);
                                        }}
                                    />
                                </label>

                                {flow.status !== 'PUBLISHED' && (
                                    <button
                                        onClick={() => handlePublish(flow.id)}
                                        className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline"
                                    >
                                        <Play className="w-3 h-3" /> Publish
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => handleDelete(flow.id)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-lg text-sm transition"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Flow
                            </button>
                        </div>
                    </div>
                ))}

                {flows.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        No flows found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Create New Flow</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Flow Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newFlowName}
                                    onChange={e => setNewFlowName(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categories (Comma separated)</label>
                                <input
                                    type="text"
                                    value={newFlowCategory.join(',')}
                                    onChange={e => setNewFlowCategory(e.target.value.split(',').map(s => s.trim()))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">E.g. OTHER, SIGN_UP, APPOINTMENT_BOOKING</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
