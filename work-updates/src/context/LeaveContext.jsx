import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useProjectFilter } from './ProjectFilterContext';
import { getAllLeaves, getMyLeaves, updateLeaveStatus as updateStatusAPI, applyLeave as applyLeaveAPI } from '../services/leaveService';

const LeaveContext = createContext();

export const useLeaves = () => useContext(LeaveContext);

export const LeaveProvider = ({ children }) => {
    const { user } = useAuth();
    const { selectedProjectId } = useProjectFilter();
    const [leaves, setLeaves] = useState([]);

    useEffect(() => {
        const fetchLeaves = async () => {
            if (!user) return;

            let data = [];
            if (user.role === 'admin') {
                data = await getAllLeaves(selectedProjectId);
            } else {
                const empId = user.employee_id || user.employeeId;
                if (empId) {
                    data = await getMyLeaves(empId);
                }
            }

            const mappedData = data.map(l => ({
                id: l.id,
                userId: (l.employee_id || l.employeeId),
                userName: (l.userName || l.employee_id || l.employeeId),
                type: (l.leave_type || l.type),
                startDate: (l.from_date || l.startDate),
                endDate: (l.to_date || l.endDate),
                reason: l.reason,
                status: l.status,
                appliedAt: (l.created_at || l.createdAt)
            }));

            setLeaves(mappedData);
        };

        fetchLeaves();
    }, [user, selectedProjectId]);

    const applyLeaveAction = async (leaveData) => {
        try {
            const empId = user.employee_id || user.employeeId;

            // Map the frontend format to backend schema
            const payload = {
                employee_id: empId,
                leave_type: leaveData.type || leaveData.leave_type,
                from_date: leaveData.startDate || leaveData.from_date,
                to_date: leaveData.endDate || leaveData.to_date,
                reason: leaveData.reason
            };

            // 1. Submit to API first
            await applyLeaveAPI(payload);

            // 2. Fetch fresh data
            let data = [];
            if (user.role === 'admin') {
                data = await getAllLeaves(selectedProjectId);
            } else {
                data = await getMyLeaves(empId);
            }

            const mappedData = data.map(l => ({
                id: l.id,
                userId: (l.employee_id || l.employeeId),
                userName: (l.userName || l.employee_id || l.employeeId),
                type: (l.leave_type || l.type),
                startDate: (l.from_date || l.startDate),
                endDate: (l.to_date || l.endDate),
                reason: l.reason,
                status: l.status,
                appliedAt: (l.created_at || l.createdAt)
            }));
            setLeaves(mappedData);
        } catch (error) {
            console.error(error);
            alert("Error applying for leave: " + error.message);
            throw error;
        }
    };

    const updateLeaveStatusAction = async (leaveId, status) => {
        try {
            await updateStatusAPI(leaveId, status);
            setLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l));
        } catch (error) {
            alert(error.message);
        }
    };

    const deleteLeave = (leaveId) => {
        setLeaves(prev => prev.filter(l => l.id !== leaveId));
    };

    const value = {
        leaves,
        applyLeave: applyLeaveAction,
        updateLeaveStatus: updateLeaveStatusAction,
        deleteLeave
    };

    return (
        <LeaveContext.Provider value={value}>
            {children}
        </LeaveContext.Provider>
    );
};
