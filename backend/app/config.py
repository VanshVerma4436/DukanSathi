import os
from dotenv import load_dotenv

# Set cache directories in the workspace to avoid home directory permission issues
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cache_dir = os.path.join(backend_dir, "cache")
os.makedirs(cache_dir, exist_ok=True)
os.environ["HF_HOME"] = os.path.join(cache_dir, "huggingface")
os.environ["SENTENCE_TRANSFORMERS_HOME"] = os.path.join(cache_dir, "sentence_transformers")

load_dotenv()


class Settings:
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv(
        "OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free"
    )
    OPENROUTER_BASE_URL: str = os.getenv(
        "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
    )
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    VECTORSTORE_DIR: str = os.getenv("VECTORSTORE_DIR", "vectorstore")
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "3"))
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    def validate(self) -> None:
        if not self.OPENROUTER_API_KEY:
            raise ValueError(
                "OPENROUTER_API_KEY is not set. Please configure your .env file."
            )


settings = Settings()
