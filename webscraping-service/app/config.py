import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # SEIRN Configuration
    SEIRN_BASE_URL: str = os.getenv("SEIRN_BASE_URL", "https://seirn.itep.rn.gov.br")
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "3600"))
    
    # Scraping Configuration
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    TIMEOUT: int = int(os.getenv("TIMEOUT", "30"))
    HEADLESS: bool = os.getenv("HEADLESS", "true").lower() == "true"
    
    # API Configuration
    API_PORT: int = int(os.getenv("API_PORT", "8001"))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Chrome Options
    CHROME_OPTIONS = [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
    ]

settings = Settings()
