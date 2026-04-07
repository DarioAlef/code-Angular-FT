import logging
import sys

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configura o ROOT logger para que todos os módulos herdem."""
    root = logging.getLogger()  # ROOT, não nomeado
    root.setLevel(level)

    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%H:%M:%S"
        ))
        root.addHandler(handler)

    return root
