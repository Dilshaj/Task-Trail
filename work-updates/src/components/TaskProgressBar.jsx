import React from 'react';
import clsx from 'clsx';

const TaskProgressBar = ({ progress, color = 'bg-blue-600' }) => {
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
                className={clsx("h-full transition-all duration-500 ease-in-out", color)}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default TaskProgressBar;
