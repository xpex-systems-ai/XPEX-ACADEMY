from scripts import xpex_wave1_media_canary_final_043 as mission


def test_pre_provider_failures_do_not_consume_submission_budget():
    qa = {"recovery_attempt_count": 1, "provider_call": False}
    assert mission._provider_submission_available(qa) is True
    assert "provider_submission_count" not in qa


def test_provider_submission_budget_can_be_consumed_only_once():
    consumed = mission._begin_provider_submission({"recovery_attempt_count": 1})
    assert consumed["provider_submission_count"] == 1
    assert consumed["provider_call"] is True
    try:
        mission._begin_provider_submission(consumed)
    except RuntimeError as exc:
        assert "budget exhausted" in str(exc)
    else:
        raise AssertionError("a second Fal submission must fail closed")


def test_wrong_provider_request_history_fails_closed():
    assert mission._provider_submission_available({"provider_request_id": "req-existing"}) is False


def test_provider_errors_are_redacted_before_persistence():
    safe = mission._safe_error(RuntimeError("Authorization: Bearer secret-token hf_private"))
    assert "secret-token" not in safe
    assert "hf_private" not in safe
