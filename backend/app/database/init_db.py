from sqlalchemy import Engine

from backend.app.database.base import Base
from backend.app.models import entities  # noqa: F401


def init_database(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)

