from fastapi import FastAPI

from asklearnly.api.routes.health import router as health_router
from asklearnly.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="RAG service for the AskLearnly learning workspace.",
        debug=settings.debug,
    )

    application.include_router(health_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
