"""보안 강화 검증 테스트"""
import pytest
from unittest.mock import patch
from datetime import datetime, timezone
from fastapi import HTTPException


# === 1. Path Traversal 검증 ===

class TestPathTraversal:
    def test_traversal_with_dotdot_raises(self):
        from app.api.routes.images import _safe_filepath
        with pytest.raises(HTTPException) as exc_info:
            _safe_filepath("..", "..", "etc", "passwd")
        assert exc_info.value.status_code == 400

    def test_traversal_url_encoded_style(self):
        """URL 디코딩된 ../가 들어와도 차단"""
        from app.api.routes.images import _safe_filepath
        with pytest.raises(HTTPException):
            _safe_filepath("../../etc", "passwd")

    def test_valid_path_does_not_raise(self):
        from app.api.routes.images import _safe_filepath
        # 유효한 경로는 예외 없이 Path 반환
        result = _safe_filepath("scenario_abc", "image.png")
        assert "scenario_abc" in str(result)
        assert "image.png" in str(result)

    def test_traversal_single_dotdot(self):
        from app.api.routes.images import _safe_filepath
        with pytest.raises(HTTPException):
            _safe_filepath("..", "secret.json")


# === 2. Input Validation 검증 ===

class TestInputValidation:
    def test_generate_request_valid(self):
        from app.api.routes.scenario import GenerateRequest
        req = GenerateRequest(phishing_type="보이스피싱", difficulty="medium")
        assert req.phishing_type == "보이스피싱"

    def test_generate_request_phishing_type_too_long(self):
        from app.api.routes.scenario import GenerateRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            GenerateRequest(phishing_type="a" * 51)

    def test_generate_request_invalid_difficulty(self):
        from app.api.routes.scenario import GenerateRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            GenerateRequest(phishing_type="test", difficulty="extreme")

    def test_generate_request_seed_info_too_long(self):
        from app.api.routes.scenario import GenerateRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            GenerateRequest(phishing_type="test", seed_info="x" * 2001)

    def test_generate_request_seed_info_within_limit(self):
        from app.api.routes.scenario import GenerateRequest
        req = GenerateRequest(phishing_type="test", seed_info="x" * 2000)
        assert len(req.seed_info) == 2000

    def test_refresh_request_too_many_keywords(self):
        from app.api.routes.crawler import RefreshRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RefreshRequest(keywords=["kw"] * 11)

    def test_refresh_request_keyword_too_long(self):
        from app.api.routes.crawler import RefreshRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            RefreshRequest(keywords=["a" * 101])

    def test_refresh_request_valid(self):
        from app.api.routes.crawler import RefreshRequest
        req = RefreshRequest(keywords=["피싱", "보이스피싱"])
        assert len(req.keywords) == 2

    def test_generate_from_article_invalid_difficulty(self):
        from app.api.routes.crawler import GenerateFromArticleRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            GenerateFromArticleRequest(article_id="abc", difficulty="nightmare")

    def test_generate_scenarios_request_max_scenarios_cap(self):
        from app.api.routes.crawler import GenerateScenariosRequest
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            GenerateScenariosRequest(max_scenarios=4)

    def test_generate_scenarios_request_valid(self):
        from app.api.routes.crawler import GenerateScenariosRequest
        req = GenerateScenariosRequest(max_scenarios=2, difficulty="hard")
        assert req.max_scenarios == 2


# === 3. Task Dict Cleanup 검증 ===

class TestTaskCleanup:
    def test_cleanup_prunes_to_max(self):
        from app.api.deps import cleanup_task_dict
        tasks = {}
        for i in range(60):
            tasks[f"task_{i}"] = {"status": "completed"}
        cleanup_task_dict(tasks)
        assert len(tasks) == 50

    def test_cleanup_keeps_pending_tasks(self):
        from app.api.deps import cleanup_task_dict
        tasks = {}
        for i in range(55):
            tasks[f"done_{i}"] = {"status": "completed"}
        tasks["active_1"] = {"status": "generating"}
        tasks["active_2"] = {"status": "pending"}
        cleanup_task_dict(tasks)
        # active tasks should survive
        assert "active_1" in tasks
        assert "active_2" in tasks
        assert len(tasks) <= 50

    def test_cleanup_noop_when_under_limit(self):
        from app.api.deps import cleanup_task_dict
        tasks = {f"t_{i}": {"status": "completed"} for i in range(10)}
        cleanup_task_dict(tasks)
        assert len(tasks) == 10


# === 4. Error Sanitization 검증 ===

class TestSanitizeError:
    def test_long_error_truncated(self):
        from app.api.deps import sanitize_error
        e = Exception("x" * 500)
        result = sanitize_error(e)
        assert len(result) <= 203  # 200 + "..."
        assert result.endswith("...")

    def test_short_error_unchanged(self):
        from app.api.deps import sanitize_error
        e = Exception("짧은 에러")
        result = sanitize_error(e)
        assert result == "짧은 에러"


# === 5. Admin Auth 검증 ===

class TestAdminAuth:
    def test_no_token_returns_403(self):
        from app.api.deps import require_admin
        with pytest.raises(HTTPException) as exc_info:
            require_admin(admin_token=None)
        assert exc_info.value.status_code == 403

    def test_invalid_token_returns_403(self):
        from app.api.deps import require_admin
        with pytest.raises(HTTPException) as exc_info:
            require_admin(admin_token="fake_token_123")
        assert exc_info.value.status_code == 403

    def test_valid_token_passes(self):
        from app.api.deps import require_admin
        from app.api.routes.auth import valid_tokens
        from datetime import timedelta
        token = "test_valid_token"
        valid_tokens[token] = datetime.now(timezone.utc) + timedelta(hours=1)
        try:
            result = require_admin(admin_token=token)
            assert result is None  # no exception = pass
        finally:
            valid_tokens.pop(token, None)


# === 6. Task Slot 검증 ===

class TestTaskSlot:
    def test_acquire_and_release(self):
        from app.api.deps import acquire_task_slot, release_task_slot, _active_tasks
        # clean state
        _active_tasks.clear()
        assert acquire_task_slot("test_1") is True
        release_task_slot("test_1")
        assert "test_1" not in _active_tasks

    def test_max_concurrent_1(self):
        from app.api.deps import acquire_task_slot, release_task_slot, _active_tasks
        _active_tasks.clear()
        # max_concurrent_tasks defaults to 1
        assert acquire_task_slot("slot_a") is True
        assert acquire_task_slot("slot_b") is False
        release_task_slot("slot_a")
        assert acquire_task_slot("slot_b") is True
        release_task_slot("slot_b")
