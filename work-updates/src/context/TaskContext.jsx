import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { getTasks, getEmployees, addTask as apiAddTask, updateTaskStatus as apiUpdateStatus, updateTaskProgress as apiUpdateTaskProgress, updateEmployeeProgress as apiUpdateProgress, addEmployee as apiAddEmployee, deleteEmployee as apiDeleteEmployee } from '../services/taskService';
import { useProjectFilter } from './ProjectFilterContext';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const { selectedProjectId } = useProjectFilter();

    const fetchAll = useCallback((silent = false) => {
        if (!silent) setLoading(true);

        const safetyTimeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        Promise.all([
            getTasks(selectedProjectId),
            getEmployees(selectedProjectId),
            getEmployees(null) // 🌐 Fetch everyone for the Team Panel
        ])
            .then(([tasksData, empData, allData]) => {
                setTasks(tasksData);
                setEmployees(empData);
                setAllEmployees(allData);
            })
            .catch(() => {
                console.warn("Failed to fetch initial data.");
            })
            .finally(() => {
                clearTimeout(safetyTimeout);
                setLoading(false);
            });
    }, [selectedProjectId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const fetchTasks = useCallback(async () => {
        const data = await getTasks(selectedProjectId);
        setTasks(data);
    }, []);

    const assignTask = async (taskObj) => {
        const newTask = await apiAddTask(taskObj);
        setTasks(prev => [...prev, newTask]);
    };

    const changeTaskStatus = async (id, status) => {
        const updated = await apiUpdateStatus(id, status);
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
    };

    const updateTaskProgress = async (id, progress) => {
        const updated = await apiUpdateTaskProgress(id, progress);
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
    };

    const updateProgress = async (empId, newStats) => {
        const updated = await apiUpdateProgress(empId, newStats);
        setEmployees(prev => prev.map(e => e.id === empId ? updated : e));
        setAllEmployees(prev => prev.map(e => e.id === empId ? updated : e));
    };

    const fetchEmployees = async () => {
        const fresh = await getEmployees(selectedProjectId);
        const global = await getEmployees(null);
        setEmployees(fresh);
        setAllEmployees(global);
    };

    const addNewEmployee = async (employeeData) => {
        const newEmployee = await apiAddEmployee(employeeData);
        setAllEmployees(prev => [...prev, newEmployee]);
        if (selectedProjectId && newEmployee.project_id === selectedProjectId) {
            setEmployees(prev => [...prev, newEmployee]);
        }
        return newEmployee;
    };

    const removeEmployee = async (employeeId) => {
        setAllEmployees(prev => prev.filter(emp => emp.employeeId !== employeeId));
        setEmployees(prev => prev.filter(emp => emp.employeeId !== employeeId));
        await apiDeleteEmployee(employeeId);
    };

    const value = useMemo(() => ({
        tasks,
        employees,
        allEmployees,
        loading,
        fetchTasks,
        fetchEmployees,
        assignTask,
        changeTaskStatus,
        updateTaskProgress,
        updateProgress,
        addEmployee: addNewEmployee,
        removeEmployee,
        refreshEmployees: fetchEmployees
    }), [tasks, employees, allEmployees, loading, fetchTasks, fetchEmployees, assignTask, changeTaskStatus, updateProgress, addNewEmployee, removeEmployee]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => useContext(TaskContext);
