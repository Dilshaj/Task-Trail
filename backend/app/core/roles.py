from enum import Enum

class Role(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TEAM_LEAD = "TEAM_LEAD"
    DOMAIN_LEAD = "DOMAIN_LEAD"
    EMPLOYEE = "EMPLOYEE"
