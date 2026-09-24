from fastapi import APIRouter

from app.db.session import DbSession
from app.schemas.task import TaskCreate, TaskResponse
from app.services import tasks as tasks_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
def list_tasks(db: DbSession):
    return tasks_service.list_tasks(db)


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(db: DbSession, task: TaskCreate):
    return tasks_service.create_task(db, task)
