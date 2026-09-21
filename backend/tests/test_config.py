import pytest
from pydantic import ValidationError

from asklearnly.core.config import Settings, get_settings
from asklearnly.main import create_app


def test_settings_have_safe_defaults() -> None:
    settings = Settings(_env_file=None)

    assert settings.app_name == "AskLearnly"
    assert settings.app_version == "0.1.0"
    assert settings.environment == "development"
    assert settings.debug is False
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.cors_origins == ["http://localhost:3000"]


def test_settings_read_prefixed_environment_variables(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ASKLEARNLY_ENVIRONMENT", "test")
    monkeypatch.setenv("ASKLEARNLY_DEBUG", "true")
    monkeypatch.setenv(
        "ASKLEARNLY_CORS_ORIGINS",
        '["http://localhost:3000", "http://127.0.0.1:3000"]',
    )

    settings = Settings(_env_file=None)

    assert settings.environment == "test"
    assert settings.debug is True
    assert settings.cors_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


def test_settings_reject_unknown_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ASKLEARNLY_ENVIRONMENT", "staging")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_get_settings_returns_cached_instance() -> None:
    get_settings.cache_clear()

    try:
        assert get_settings() is get_settings()
    finally:
        get_settings.cache_clear()


def test_create_app_uses_environment_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ASKLEARNLY_APP_NAME", "Configured AskLearnly")
    monkeypatch.setenv("ASKLEARNLY_APP_VERSION", "9.9.9")
    monkeypatch.setenv("ASKLEARNLY_DEBUG", "true")
    get_settings.cache_clear()

    try:
        application = create_app()

        assert application.title == "Configured AskLearnly"
        assert application.version == "9.9.9"
        assert application.debug is True

    finally:
        get_settings.cache_clear()
