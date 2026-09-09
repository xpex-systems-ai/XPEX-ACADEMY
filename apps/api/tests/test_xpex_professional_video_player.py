from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PLAYER = (
    REPO_ROOT
    / "apps"
    / "web"
    / "components"
    / "Objects"
    / "Activities"
    / "Video"
    / "Video.tsx"
)


def test_hosted_player_accepts_only_https_external_sources() -> None:
    source = PLAYER.read_text(encoding="utf-8")

    assert "resolveExternalHostedSource" in source
    assert "parsed.protocol !== 'https:'" in source
    assert "activity.content?.uri" in source
    assert "externalSource || getInternalVideoSource()" in source


def test_external_hls_and_internal_media_remain_supported() -> None:
    source = PLAYER.read_text(encoding="utf-8")

    assert "endsWith('.m3u8')" in source
    assert "resolveActivityVideoSource" in source
    assert "SUBTYPE_VIDEO_HOSTED" in source
    assert "SUBTYPE_VIDEO_YOUTUBE" in source
    assert "LearnHousePlayer" in source
