from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ======== AUTH ========
class LoginRequest(BaseModel):
    email: Optional[str] = None
    employee_id: Optional[str] = None
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: Optional[str] = None
    employeeId: Optional[str] = None
    name: str
    role: str
    email: Optional[str] = None
    avatar: Optional[str] = None
    projectId: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    image: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None

class ProjectResponse(BaseModel):
    id: Optional[str] = None
    name: str
    image: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class EmployeeCreate(BaseModel):
    employee_id: str
    name: str
    role: str = "EMPLOYEE"
    project_id: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class EmployeeProgressUpdate(BaseModel):
    work_progress_perc: float
    overall_progress_perc: float

class EmployeeResponse(UserResponse):
    workProgress: float = 0.0
    overallProgress: float = 0.0
    dailyProgress: float = 0.0
    weeklyProgress: float = 0.0
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: str = "Medium"
    timeline: str = Field(alias="type", default="daily")
    assignedTo: str
    projectId: str
    progress: Optional[float] = 0.0

    class Config:
        populate_by_name = True

class TaskStatusUpdate(BaseModel):
    status: str

class TaskResponse(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Pending"
    timeline: Optional[str] = "daily"
    assignedTo: Optional[str] = None
    projectId: Optional[str] = None
    progress: Optional[float] = 0.0
    createdAt: Optional[datetime] = None

class CheckInRequest(BaseModel):
    employee_id: Optional[str] = Field(alias="employeeId", default=None)
    date: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None

    class Config:
        populate_by_name = True

class AttendanceResponse(BaseModel):
    id: Optional[str] = None
    employeeId: str = ""
    userId: Optional[str] = None
    userName: Optional[str] = None
    date: str = ""
    checkIn: Optional[str] = None
    checkInTime: Optional[str] = None
    check_in: Optional[str] = None
    checkOut: Optional[str] = None
    checkOutTime: Optional[str] = None
    check_out: Optional[str] = None
    projectId: Optional[str] = None
    locationName: Optional[str] = None
    locationSource: Optional[str] = None
    locationAccuracy: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = "Checked In"

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: str
    from_date: str
    to_date: str
    reason: str
    project_id: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: Optional[str] = None
    employeeId: str = ""
    userName: Optional[str] = None
    leaveType: str = ""
    fromDate: str = ""
    toDate: str = ""
    reason: Optional[str] = None
    status: Optional[str] = "Pending"
    projectId: Optional[str] = None
    createdAt: Optional[datetime] = None

class OfferLetterCreate(BaseModel):
    employee_id: str
    employee_name: str
    role: str
    joining_date: str
    location: str
    package: str
    project_id: Optional[str] = None

class OfferLetterResponse(BaseModel):
    id: Optional[str] = None
    employeeId: str = ""
    employeeName: str = ""
    role: str = ""
    joiningDate: str = ""
    location: str = ""
    package: str = ""
    projectId: Optional[str] = None
    createdAt: Optional[datetime] = None

class PaySlipCreate(BaseModel):
    employee_id: str
    month: str
    amount: str
    status: str = "Generated"

class PaySlipResponse(BaseModel):
    id: Optional[str] = None
    employeeId: str = ""
    employeeName: Optional[str] = None
    month: str = ""
    amount: str = ""
    status: str = ""
    createdAt: Optional[datetime] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    project_id: Optional[str] = None
    avatar: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class DashboardMetricsResponse(BaseModel):
    activeProjects: int
    totalTasks: int
    completedTasks: int
    activeEmployees: int