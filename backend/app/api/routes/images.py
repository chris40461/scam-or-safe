"""이미지 서빙 API 라우트"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/images", tags=["images"])

IMAGES_DIR = Path(__file__).parent.parent.parent / "data" / "images"


@router.get("/{filename}")
async def get_image(filename: str) -> FileResponse:
    """생성된 이미지 파일 서빙"""
    # 경로 탈출 방지
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    filepath = IMAGES_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(filepath, media_type="image/png")
