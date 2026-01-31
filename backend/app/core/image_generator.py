"""이미지 생성 모듈 (Google Imagen via Vertex AI)"""
import asyncio
import os
from pathlib import Path
from uuid import uuid4
from functools import partial

from google import genai
from google.genai import types

from app.config import settings

IMAGES_DIR = Path(__file__).parent.parent / "data" / "images"


def _generate_image_sync(prompt: str, node_id: str) -> str | None:
    """동기 이미지 생성 (스레드에서 실행)"""
    if not settings.gcp_project_id:
        print("Image generation skipped: GCP_PROJECT_ID not configured")
        return None

    # 서비스 계정 인증 설정
    if settings.google_application_credentials:
        creds_path = Path(__file__).parent.parent.parent / settings.google_application_credentials
        if creds_path.exists():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_path)
        else:
            print(f"Credentials file not found: {creds_path}")
            return None

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    try:
        # Vertex AI 모드로 클라이언트 생성
        client = genai.Client(
            vertexai=True,
            project=settings.gcp_project_id,
            location=settings.gcp_location,
        )

        response = client.models.generate_images(
            model=settings.image_model,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",
                person_generation="ALLOW_ADULT",
            ),
        )

        if not response.generated_images:
            print("Image generation returned no images")
            return None

        # 이미지 저장
        image = response.generated_images[0].image
        filename = f"{node_id}_{uuid4().hex[:8]}.png"
        filepath = IMAGES_DIR / filename

        # PIL Image를 파일로 저장
        image.save(str(filepath))
        print(f"Image saved: {filepath}")

        return f"/api/v1/images/{filename}"

    except Exception as e:
        print(f"Image generation failed: {e}")
        return None


async def generate_image(prompt: str, node_id: str) -> str | None:
    """비동기 이미지 생성 (스레드풀 사용)"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, partial(_generate_image_sync, prompt, node_id)
    )


async def generate_images_for_nodes(
    nodes: dict, max_concurrent: int = 3
) -> dict[str, str]:
    """여러 노드의 이미지를 병렬 생성"""
    semaphore = asyncio.Semaphore(max_concurrent)
    results: dict[str, str] = {}

    async def gen_with_limit(node_id: str, prompt: str):
        async with semaphore:
            url = await generate_image(prompt, node_id)
            if url:
                results[node_id] = url

    tasks = []
    for node_id, node in nodes.items():
        if node.get("image_prompt") and not node.get("image_url"):
            tasks.append(gen_with_limit(node_id, node["image_prompt"]))

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    return results
