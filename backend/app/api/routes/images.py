"""이미지 서빙 API 라우트"""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

from app.api.deps import limiter

router = APIRouter(prefix="/images", tags=["images"])

IMAGES_DIR = (Path(__file__).parent.parent.parent / "data" / "images").resolve()


def _safe_filepath(*parts: str) -> Path:
    """경로 탈출 방지: resolve() 후 IMAGES_DIR 하위인지 검증"""
    filepath = (IMAGES_DIR / Path(*parts)).resolve()
    if not str(filepath).startswith(str(IMAGES_DIR)):
        raise HTTPException(status_code=400, detail="Invalid path")
    return filepath


@router.get("/{scenario_id}/{filename}")
@limiter.limit("120/minute")
async def get_scenario_image(request: Request, scenario_id: str, filename: str) -> FileResponse:
    """시나리오별 폴더에서 이미지 파일 서빙"""
    filepath = _safe_filepath(scenario_id, filename)
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(filepath, media_type="image/png")


@router.get("/{filename}")
@limiter.limit("120/minute")
async def get_image(request: Request, filename: str) -> FileResponse:
    """레거시: 루트 폴더에서 이미지 파일 서빙"""
    filepath = _safe_filepath(filename)
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(filepath, media_type="image/png")
