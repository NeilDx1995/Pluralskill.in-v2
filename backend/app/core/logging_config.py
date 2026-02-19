import logging
import sys

from pythonjsonlogger import jsonlogger

from app.core.config import settings


def setup_logging():
    """Configure structured JSON logging for production."""

    # JSON formatter for structured logs
    json_formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level"},
    )

    # Plain formatter for development
    plain_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    is_production = settings.ENVIRONMENT == "production"
    formatter = json_formatter if is_production else plain_formatter

    # Root handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    # Quiet noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

    return logging.getLogger("app")
