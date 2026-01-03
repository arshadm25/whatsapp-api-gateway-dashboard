import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Trash2, Upload, ExternalLink, File, Copy, RefreshCw } from 'lucide-react';

export default function Media() {
    const [mediaList, setMediaList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:8080/api/whatsapp';

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/media`);
            setMediaList(res.data || []);
        } catch (error) {
            console.error('Failed to fetch media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(`${API_URL}/media`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Refresh list from server
            fetchMedia();
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const getUrl = async (mediaId) => {
        try {
            const res = await axios.get(`${API_URL}/media/${mediaId}`);
            window.open(res.data.url, '_blank');
        } catch (error) {
            alert('Failed to get URL: ' + error.message);
        }
    };

    const deleteMedia = async (mediaId) => {
        if (!confirm("Are you sure? This deletes it from WhatsApp servers.")) return;
        try {
            await axios.delete(`${API_URL}/media/${mediaId}`);
            setMediaList(mediaList.filter(m => m.media_id !== mediaId));
        } catch (error) {
            alert('Delete failed: ' + error.message);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Media Library</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchMedia}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
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
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-700">Uploaded Media</h3>

                    {loading ? (
                        <div className="text-center py-10 text-slate-400">
                            Loading media...
                        </div>
                    ) : mediaList.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>No media uploaded yet.</p>
                            <p className="text-sm mt-1">Upload images, videos, or documents to use in messages.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mediaList.map((item) => (
                                <div key={item.media_id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
                                    <div className="flex items-start gap-3">
                                        <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100/50">
                                            {item.mime_type?.includes('image') ? (
                                                <Image className="w-6 h-6 text-emerald-500" />
                                            ) : item.mime_type?.includes('video') ? (
                                                <File className="w-6 h-6 text-purple-500" />
                                            ) : (
                                                <File className="w-6 h-6 text-blue-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-800 truncate" title={item.filename}>
                                                {item.filename || 'Unnamed file'}
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                {formatFileSize(item.file_size)} • {new Date(item.uploaded_at).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono truncate max-w-[100px]">
                                                    {item.media_id}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(item.media_id)}
                                                    className="text-slate-400 hover:text-emerald-500"
                                                    title="Copy Media ID"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => getUrl(item.media_id)}
                                            className="flex-1 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center justify-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" /> View
                                        </button>
                                        <button
                                            onClick={() => deleteMedia(item.media_id)}
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
