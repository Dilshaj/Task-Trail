import time
from fastapi import Request, HTTPException, status
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# Simple in-memory sliding window rate limiter
# Key: Client IP, Value: List of timestamps of requests
class SlidingWindowRateLimiter:
    def __init__(self, limit: int = 5, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        # Remove timestamps outside the sliding window
        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window_seconds]
        
        if len(self.requests[client_ip]) >= self.limit:
            return False
            
        self.requests[client_ip].append(now)
        return True

# Initialize a global limiter for the login endpoint
login_limiter = SlidingWindowRateLimiter(limit=5, window_seconds=60)

async def rate_limit_login(request: Request):
    """
    Dependency to rate limit requests on the login route.
    """
    client_ip = request.client.host if request.client else "unknown"
    if not login_limiter.is_allowed(client_ip):
        logger.warning(f"🚨 RATE LIMIT TRIGGERED: Brute-force block on IP [{client_ip}]")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again after 60 seconds."
        )
