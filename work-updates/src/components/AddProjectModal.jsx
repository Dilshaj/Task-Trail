import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../services/api';

const AddProjectModal = ({ isOpen, onClose, onSave, project }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (project) {
            setName(project.name);
            setImage(project.image || '');
        } else {
            setName('');
            setImage('');
        }
        setUploadError('');
    }, [project, isOpen]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload to backend → Cloudinary, get back a URL
            const response = await api.post('/projects/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setImage(response.data.image_url);
        } catch (err) {
            setUploadError('Image upload failed. Try a URL instead.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && image) {
            onSave({ ...(project ? { id: project.id } : {}), name, image });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-all duration-300">
            <div className="w-full max-w-md card-modern dark:bg-slate-900 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                        {project ? 'Edit Project' : 'Add New Project'}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-indigo-900/50 dark:text-white dark:placeholder:text-slate-500"
                                placeholder="e.g. EduProva"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Image</label>
                                {image && !image.startsWith('data:') && (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Cloudinary</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group">
                                    {uploading ? (
                                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin mb-2" />
                                    ) : (
                                        <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-500 mb-2" />
                                    )}
                                    <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                                        {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
                                    </span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploading} />
                                </label>

                                <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                                    <LinkIcon className="h-5 w-5 text-slate-300 mb-2" />
                                    <span className="text-xs font-medium text-slate-400">Or paste URL below</span>
                                </div>
                            </div>

                            {uploadError && (
                                <p className="text-xs text-rose-500 mb-2">{uploadError}</p>
                            )}

                            <input
                                type="text"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-indigo-900/50 dark:text-white dark:placeholder:text-slate-500"
                                placeholder="https://res.cloudinary.com/..."
                            />
                        </div>

                        <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-center p-2 group mt-4">
                            {image ? (
                                <img src={image} alt="Preview" className="h-full w-full object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="flex flex-col items-center text-slate-300 dark:text-slate-700">
                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                    <span className="text-sm font-medium">Image Preview</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !image}
                            className="rounded-lg btn-gradient px-4 py-2 text-sm font-medium text-white shadow-shadow-soft disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {project ? 'Update Project' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProjectModal;
