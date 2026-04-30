import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useTasks } from '../context/TaskContext';
import EmployeeCard from '../components/EmployeeCard';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { useProjectFilter } from '../context/ProjectFilterContext';
import { Users, Search, Plus, Filter, X } from 'lucide-react';

const EmployeesPanel = () => {
    const { employees, addEmployee, loading } = useTasks();
    const { selectedProjectId, selectedProject } = useProjectFilter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.title || emp.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeId || '').includes(searchQuery)
    );

    const handleAddEmployee = async (employeeData) => {
        try {
            await addEmployee(employeeData);
            setIsAddModalOpen(false);
        } catch (err) {
            throw err; // Let AddEmployeeModal handle the error display
        }
    };

    return (
        <Layout>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        Team Members
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {selectedProject
                            ? `Employees currently assigned to ${selectedProject.name}.`
                            : "Manage all employees across all projects."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, ID or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white w-64 transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="h-4 w-4" />
                        Add Member
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : filteredEmployees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                    {filteredEmployees.map((emp, index) => (
                        <div key={emp.id} className={`animate-fade-in-up stagger-${(index % 5) + 1}`}>
                            <EmployeeCard employee={emp} projectId={selectedProjectId} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                        <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No team members found.</p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline"
                        >
                            Clear search results
                        </button>
                    )}
                </div>
            )}

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddEmployee}
                projectId={selectedProjectId}
                projectName={selectedProject?.name || "Global Organization"}
            />
        </Layout>
    );
};

export default EmployeesPanel;
