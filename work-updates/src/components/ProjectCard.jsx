import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const ProjectCard = ({ project, onEdit, onDelete, onBodyClick }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const imageSrc = !imageError && project.image && project.image !== ''
        ? project.image
        : "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=500&auto=format&fit=crop";

    return (
        <div
            onClick={() => onBodyClick && onBodyClick(project)}
            className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-xl border border-slate-100 dark:border-slate-800 cursor-pointer"
        >
            <div className="aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center relative">
                <img
                    src={imageSrc}
                    alt={project.name}
                    onError={handleImageError}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
                            ID: {project.id?.slice(-8) || "NEW-... "}
                        </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                            className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 transition"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
