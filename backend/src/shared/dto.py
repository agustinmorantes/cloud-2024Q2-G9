from datetime import datetime
from typing import Optional

from pydantic import BaseModel, UUID4

from models import Bandoru, File
from utils import uuid4_to_base64
from bandoru_s3_bucket import get_file_url

class FileDTO(BaseModel):
    id: str
    filename: str
    url:str

    @staticmethod
    def from_model(model: File):
        model_data = model.model_dump()
        model_data['id'] = uuid4_to_base64(model.id)
        model_data['url'] = get_file_url(model_data['id'],model.filename)
        return FileDTO(**model_data)

class BandoruDTO(BaseModel):
    id: str
    parent_id: Optional[UUID4] = None
    description: Optional[str] = None
    files: list[FileDTO]
    created_at: datetime
    last_modified: datetime

    @staticmethod
    def from_model(model: Bandoru):
        model_data = model.model_dump()
        model_data['id'] = uuid4_to_base64(model.id)
        model_data['files'] = [FileDTO.from_model(file) for file in model.files]
        model_data['parent_id'] = None if model.parent_id is None else uuid4_to_base64(model.parent_id)

        return BandoruDTO(**model_data)