from fastapi import APIRouter, status

from asklearnly.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def get_health() -> HealthResponse:
    return HealthResponse()
