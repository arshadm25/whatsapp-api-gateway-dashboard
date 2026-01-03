import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Plus, Edit2, Trash2, Power, PowerOff, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function Automation() {
    const [rules, setRules] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    const API_URL = 'http://localhost:8080/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rulesRes, analyticsRes] = await Promise.all([
                axios.get(`${API_URL}/automation/rules`),
                axios.get(`${API_URL}/automation/analytics`)
            ]);
            setRules(rulesRes.data || []);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error("Error fetching automation data:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRule = async (ruleId, currentStatus) => {
        try {
            await axios.post(`${API_URL}/automation/rules/${ruleId}/toggle`, {
                enabled: !currentStatus
            });
            fetchData();
        } catch (error) {
            alert("Failed to toggle rule");
        }
    };

    const deleteRule = async (ruleId) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        try {
            await axios.delete(`${API_URL}/automation/rules/${ruleId}`);
            fetchData();
        } catch (error) {
            alert("Failed to delete rule");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-emerald-600" />
                        Automation
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Automate your WhatsApp conversations</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-200/50"
                >
                    <Plus className="w-4 h-4" /> Create Rule
                </button>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase">Total Rules</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{analytics.total_rules}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase">Active</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics.active_rules}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <Power className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase">Executions</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{analytics.total_executions}</p>
                            </div>
                            <div className="p-3 bg-violet-50 rounded-lg">
                                <Activity className="w-6 h-6 text-violet-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium uppercase">Success Rate</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">
                                    {analytics.total_executions > 0
                                        ? Math.round((analytics.successful_executions / analytics.total_executions) * 100)
                                        : 0}%
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rules List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">Automation Rules</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your automated responses and workflows</p>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Loading rules...</div>
                    ) : rules.length === 0 ? (
                        <div className="p-12 text-center">
                            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400">No automation rules yet</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                                Create your first rule
                            </button>
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-slate-800">{rule.name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rule.type === 'auto_reply' ? 'bg-blue-50 text-blue-700' :
                                                rule.type === 'keyword_trigger' ? 'bg-purple-50 text-purple-700' :
                                                    'bg-orange-50 text-orange-700'
                                                }`}>
                                                {rule.type.replace('_', ' ')}
                                            </span>
                                            {rule.enabled ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                    <Power className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                                    <PowerOff className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">
                                            Priority: {rule.priority} • Created {new Date(rule.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleRule(rule.id, rule.enabled)}
                                            className={`p-2 rounded-lg transition ${rule.enabled
                                                ? 'text-emerald-600 hover:bg-emerald-50'
                                                : 'text-slate-400 hover:bg-slate-100'
                                                }`}
                                            title={rule.enabled ? "Disable" : "Enable"}
                                        >
                                            {rule.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => setEditingRule(rule)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteRule(rule.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateRuleModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); fetchData(); }}
                />
            )}

            {/* Edit Modal */}
            {editingRule && (
                <EditRuleModal
                    rule={editingRule}
                    onClose={() => setEditingRule(null)}
                    onSuccess={() => { setEditingRule(null); fetchData(); }}
                />
            )}
        </div>
    );
}

// Simple Create Rule Modal
function CreateRuleModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'auto_reply',
        priority: 0,
        keyword: '',
        message: ''
    });

    const API_URL = 'http://localhost:8080/api';

    const handleSubmit = async (e) => {
        e.preventDefault();

        const conditions = [{
            type: "keyword",
            operator: "contains",
            value: formData.keyword
        }];

        const actions = [{
            type: "send_message",
            params: { message: formData.message }
        }];

        try {
            await axios.post(`${API_URL}/automation/rules`, {
                name: formData.name,
                type: formData.type,
                priority: formData.priority,
                conditions: conditions,
                actions: actions
            });
            onSuccess();
        } catch (error) {
            alert("Failed to create rule");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Create Automation Rule</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., Welcome Message"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Keyword</label>
                        <input
                            type="text"
                            value={formData.keyword}
                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., hello, hi, help"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reply Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                            placeholder="e.g., Hello! How can I help you today?"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority (higher = first)</label>
                        <input
                            type="number"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        >
                            Create Rule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit Rule Modal
function EditRuleModal({ rule, onClose, onSuccess }) {
    // Parse existing conditions and actions
    const parseConditions = () => {
        try {
            const conditions = typeof rule.conditions === 'string'
                ? JSON.parse(rule.conditions)
                : rule.conditions;
            return conditions[0]?.value || '';
        } catch {
            return '';
        }
    };

    const parseActions = () => {
        try {
            const actions = typeof rule.actions === 'string'
                ? JSON.parse(rule.actions)
                : rule.actions;
            return actions[0]?.params?.message || '';
        } catch {
            return '';
        }
    };

    const [formData, setFormData] = useState({
        name: rule.name || '',
        type: rule.type || 'auto_reply',
        priority: rule.priority || 0,
        keyword: parseConditions(),
        message: parseActions()
    });

    const API_URL = 'http://localhost:8080/api';

    const handleSubmit = async (e) => {
        e.preventDefault();

        const conditions = [{
            type: "keyword",
            operator: "contains",
            value: formData.keyword
        }];

        const actions = [{
            type: "send_message",
            params: { message: formData.message }
        }];

        try {
            await axios.put(`${API_URL}/automation/rules/${rule.id}`, {
                name: formData.name,
                type: formData.type,
                priority: formData.priority,
                conditions: conditions,
                actions: actions
            });
            onSuccess();
        } catch (error) {
            alert("Failed to update rule");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Edit Automation Rule</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., Welcome Message"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Keyword</label>
                        <input
                            type="text"
                            value={formData.keyword}
                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., hello, hi, help"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reply Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                            placeholder="e.g., Hello! How can I help you today?"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority (higher = first)</label>
                        <input
                            type="number"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
