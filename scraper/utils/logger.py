import logging
import sys
from ..config import LOG_LEVEL, LOG_FORMAT

def setup_logger(name: str) -> logging.Logger:
    """Setup a logger with consistent formatting and level."""
    logger = logging.getLogger(name)
    
    # Convert string log level to logging constant
    level = getattr(logging, LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(level)
    
    # Create handler if it doesn't exist
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(LOG_FORMAT)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    logger.propagate = False
    return logger
