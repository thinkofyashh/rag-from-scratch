from fastapi import FastAPI

from asklearnly.api.routes.health import router as health_router


def create_app() -> FastAPI:
    application = FastAPI(
        title="AskLearnly",
        version="0.1.0",
        description="RAG service for the AskLearnly learning workspace.",
    )

    application.include_router(health_router, prefix="/api/v1")

    return application


app = create_app()
