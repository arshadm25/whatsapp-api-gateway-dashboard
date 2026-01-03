import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Trash2, Upload, ExternalLink, File, Copy } from 'lucide-react';

export default function Media() {
    const [mediaList, setMediaList] = useState([]); // This would ideally be fetched from a DB tracking uploads
    const [uploading, setUploading] = useState(false);
    // Since we don't track media IDs in a separate DB table in the current backend impl (only logs), 
    // we will just show a UI to upload and get the ID back, and then maybe list them if we add local state or a DB table later.
    // For now, let's keep a local list of "Recently Uploaded" in session or just show the upload result.
    const [uploadedItems, setUploadedItems] = useState([]);

    const API_URL = 'http://localhost:8080/api/whatsapp';

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/media`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newItem = {
                id: res.data.id,
                name: file.name,
                type: file.type,
                uploadedAt: new Date(),
                url: null // Retrievable
            };
            setUploadedItems([newItem, ...uploadedItems]);
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const getUrl = async (id) => {
        try {
            const res = await axios.get(`${API_URL}/media/${id}`);
            window.open(res.data.url, '_blank');
        } catch (error) {
            alert('Failed to get URL: ' + error.message);
        }
    };

    const deleteMedia = async (id) => {
        if (!confirm("Are you sure? This deletes it from WhatsApp servers.")) return;
        try {
            await axios.delete(`${API_URL}/media/${id}`);
            setUploadedItems(uploadedItems.filter(i => i.id !== id));
        } catch (error) {
            alert('Delete failed: ' + error.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Media Library</h2>
                <div className="relative">
                    <input
                        type="file"
                        id="media-upload"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="media-upload"
                        className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Upload className="w-5 h-5" />
                        {uploading ? 'Uploading...' : 'Upload Media'}
                    </label>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Recently Uploaded</h3>

                    {uploadedItems.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No media uploaded yet in this session.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uploadedItems.map((item) => (
                                <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100/50">
                                            {item.type.includes('image') ? (
                                                <Image className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <File className="w-6 h-6 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-800 truncate" title={item.name}>{item.name}</h4>
                                            <p className="text-xs text-slate-500">{new Date(item.uploadedAt).toLocaleString()}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono truncate max-w-[100px]">
                                                    {item.id}
                                                </span>
                                                <button onClick={() => { navigator.clipboard.writeText(item.id) }} className="text-slate-400 hover:text-emerald-500" title="Copy ID">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => getUrl(item.id)}
                                            className="flex-1 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center justify-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" /> View
                                        </button>
                                        <button
                                            onClick={() => deleteMedia(item.id)}
                                            className="py-1.5 px-3 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
