from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str
    anthropic_api_key: str

    # Scraper settings
    scraper_max_concurrency: int = 3
    scraper_min_delay: float = 1.5
    scraper_max_delay: float = 3.0
    scraper_max_retries: int = 3

    # TTL settings (hours)
    ttl_career_stats: int = 24
    ttl_innings: int = 24
    ttl_profile: int = 168  # 7 days
    ttl_inactive_innings: int = 720  # 30 days


settings = Settings()
