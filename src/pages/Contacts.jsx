import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, MoreHorizontal, Filter, Download, Plus, MessageSquare, X, Tag, Trash2, Edit2, Check } from 'lucide-react';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filterTag, setFilterTag] = useState('');
    const [editingContact, setEditingContact] = useState(null);
    const [newContact, setNewContact] = useState({ wa_id: '', name: '', tags: '' });

    const API_URL = 'http://localhost:8080/api';

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const res = await axios.get(`${API_URL}/contacts`);
            setContacts(res.data || []);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/contacts`, {
                wa_id: newContact.wa_id.replace(/[^0-9]/g, ''), // Clean phone number
                name: newContact.name,
                tags: newContact.tags ? JSON.stringify(newContact.tags.split(',').map(t => t.trim())) : '[]'
            });
            setShowAddModal(false);
            setNewContact({ wa_id: '', name: '', tags: '' });
            fetchContacts();
        } catch (error) {
            alert('Failed to add contact: ' + error.message);
        }
    };

    const handleDeleteContact = async (waId) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            await axios.delete(`${API_URL}/contacts/${waId}`);
            fetchContacts();
        } catch (error) {
            alert('Failed to delete contact: ' + error.message);
        }
    };

    const handleUpdateContact = async (waId, name, tags) => {
        try {
            await axios.put(`${API_URL}/contacts/${waId}`, { name, tags });
            setEditingContact(null);
            fetchContacts();
        } catch (error) {
            alert('Failed to update contact: ' + error.message);
        }
    };

    const handleExport = () => {
        window.open(`${API_URL}/contacts/export`, '_blank');
    };

    // Parse tags safely
    const parseTags = (tagsStr) => {
        if (!tagsStr) return [];
        try {
            const parsed = JSON.parse(tagsStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return tagsStr ? [tagsStr] : [];
        }
    };

    // Get all unique tags for filter dropdown
    const allTags = [...new Set(contacts.flatMap(c => parseTags(c.tags)))];

    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.wa_id?.includes(searchTerm);
        const matchesTag = !filterTag || parseTags(c.tags).includes(filterTag);
        return matchesSearch && matchesTag;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Contacts</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your customer database</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors shadow-lg shadow-emerald-200/50"
                    >
                        <Plus className="w-4 h-4" /> Add Contact
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Search by name or number..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto relative">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterTag ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters {filterTag && `(${filterTag})`}
                    </button>

                    {/* Filter Dropdown */}
                    {showFilters && (
                        <div className="absolute top-12 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 min-w-[200px]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-medium text-slate-700">Filter by Tag</span>
                                <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <select
                                value={filterTag}
                                onChange={(e) => { setFilterTag(e.target.value); setShowFilters(false); }}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                            >
                                <option value="">All Tags</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            {filterTag && (
                                <button
                                    onClick={() => { setFilterTag(''); setShowFilters(false); }}
                                    className="mt-2 text-sm text-red-500 hover:underline"
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">WhatsApp ID</th>
                                <th className="px-6 py-4">Tags</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 animate-pulse">
                                        Loading contacts...
                                    </td>
                                </tr>
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        No contacts found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.wa_id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={contact.profile_pic_url || `https://ui-avatars.com/api/?name=${contact.name}&background=random`}
                                                        alt={contact.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                    />
                                                </div>
                                                {editingContact === contact.wa_id ? (
                                                    <input
                                                        type="text"
                                                        defaultValue={contact.name}
                                                        className="px-2 py-1 border border-slate-300 rounded text-sm"
                                                        id={`edit-name-${contact.wa_id}`}
                                                    />
                                                ) : (
                                                    <div className="font-medium text-slate-900">{contact.name || 'Unknown'}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-500">
                                            {contact.wa_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingContact === contact.wa_id ? (
                                                <input
                                                    type="text"
                                                    defaultValue={parseTags(contact.tags).join(', ')}
                                                    placeholder="tag1, tag2, tag3"
                                                    className="px-2 py-1 border border-slate-300 rounded text-sm w-full"
                                                    id={`edit-tags-${contact.wa_id}`}
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {parseTags(contact.tags).map((tag, i) => (
                                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {parseTags(contact.tags).length === 0 && (
                                                        <span className="text-slate-400 text-xs">No tags</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(contact.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingContact === contact.wa_id ? (
                                                    <button
                                                        onClick={() => {
                                                            const nameInput = document.getElementById(`edit-name-${contact.wa_id}`);
                                                            const tagsInput = document.getElementById(`edit-tags-${contact.wa_id}`);
                                                            const tagsArray = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
                                                            handleUpdateContact(contact.wa_id, nameInput.value, JSON.stringify(tagsArray));
                                                        }}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingContact(contact.wa_id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteContact(contact.wa_id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
                    <div>Showing 1 to {filteredContacts.length} of {contacts.length} results</div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-white disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Add New Contact</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddContact} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                                <input
                                    type="text"
                                    placeholder="919876543210"
                                    value={newContact.wa_id}
                                    onChange={(e) => setNewContact({ ...newContact, wa_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Enter with country code, no + or spaces</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={newContact.name}
                                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                                <input
                                    type="text"
                                    placeholder="customer, vip, new"
                                    value={newContact.tags}
                                    onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Comma-separated tags</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                                >
                                    Add Contact
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
