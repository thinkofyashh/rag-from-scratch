from fastapi.testclient import TestClient

from asklearnly.main import app

client = TestClient(app)

ALLOWED_ORIGIN = "http://localhost:3000"
REJECTED_ORIGIN = "https://untrusted.example"


def test_cors_allows_configured_origin() -> None:
    response = client.get("/api/v1/health", headers={"Origin": ALLOWED_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN


def test_cors_handles_preflight_request() -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": ALLOWED_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert "GET" in response.headers["access-control-allow-methods"]


def test_cors_does_not_approve_unknown_origin() -> None:
    response = client.get("/api/v1/health", headers={"Origin": REJECTED_ORIGIN})

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
