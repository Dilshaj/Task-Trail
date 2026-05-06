import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const ProjectCard = ({ project, onEdit, onDelete, onBodyClick }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const imageSrc = project.image || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=500&auto=format&fit=crop";

    return (
        <div
            onClick={() => onBodyClick && onBodyClick(project)}
            className="group relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 cursor-pointer flex flex-col h-full"
        >
            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center relative p-6">
                <img
                    src={imageSrc}
                    alt={project.name}
                    onError={handleImageError}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            <div className="p-5 flex-1 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-[17px] font-bold text-slate-800 dark:text-white transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-1.5 uppercase tracking-wider">
                            ID: {project.id?.slice(-8) || "NEW-... "}
                        </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-sm p-1 backdrop-blur-sm border border-slate-100 dark:border-slate-700">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                            className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 transition"
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
