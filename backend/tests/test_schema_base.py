from asklearnly.schemas.base import ApiModel


class ExampleSchema(ApiModel):
    page_count: int


def test_api_model_serializes_using_camel_case() -> None:
    model = ExampleSchema(page_count=14)

    assert model.model_dump(by_alias=True) == {"pageCount": 14}


def test_api_model_accepts_camel_case_input() -> None:
    model = ExampleSchema.model_validate({"pageCount": 14})

    assert model.page_count == 14
