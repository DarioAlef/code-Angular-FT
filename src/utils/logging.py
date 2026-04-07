import logging
import sys
import os
import warnings

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configura o ROOT logger e silencia avisos externos barulhentos."""
    
    # Silencia avisos do Python (UserWarnings, etc)
    warnings.filterwarnings("ignore")
    
    # Silencia loggers de bibliotecas barulhentas
    logging.getLogger("transformers").setLevel(logging.ERROR)
    logging.getLogger("unsloth").setLevel(logging.ERROR)
    logging.getLogger("datasets").setLevel(logging.ERROR)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    # Silencia logs de sistema (TensorFlow, etc se houver)
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
    
    root = logging.getLogger()
    root.setLevel(level)

    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%H:%M:%S"
        ))
        root.addHandler(handler)

    return root
