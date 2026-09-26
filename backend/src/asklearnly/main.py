from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["POST", "GET"],
        allow_headers=["Accept", "Content-Type"],
    )

    application.include_router(health_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
