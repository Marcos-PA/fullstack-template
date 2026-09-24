from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskResponse(BaseModel):
    id: int
    title: str
    done: bool
    model_config = {"from_attributes": True}
