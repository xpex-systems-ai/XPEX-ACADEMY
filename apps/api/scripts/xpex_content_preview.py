"""Generate an AI-assisted XPeX CourseDraft without mutating LearnHouse data."""

import argparse
import asyncio

from src.services.xpex.content_studio import (
    CourseStudioNotConfigured,
    CourseStudioProviderError,
    generate_and_review_course_draft,
)


async def run(topic: str, audience: str, modules: int, skip_hf_review: bool) -> int:
    try:
        result = await generate_and_review_course_draft(
            topic,
            audience,
            modules,
            review_with_hf=not skip_hf_review,
        )
    except CourseStudioNotConfigured as exc:
        print(f"BLOCKED provider_not_configured detail={exc}")
        return 2
    except CourseStudioProviderError as exc:
        print(f"BLOCKED provider_error detail={exc}")
        return 3
    except ValueError as exc:
        print(f"BLOCKED invalid_request detail={exc}")
        return 4

    print(result.model_dump_json(indent=2))
    print("PASS preview_generated=true published=false learnhouse_mutated=false")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", required=True)
    parser.add_argument("--audience", default="Iniciantes e profissionais em transição")
    parser.add_argument("--modules", type=int, default=1)
    parser.add_argument("--skip-hf-review", action="store_true")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.topic, args.audience, args.modules, args.skip_hf_review)))


if __name__ == "__main__":
    main()
