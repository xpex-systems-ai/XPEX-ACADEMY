"""Deterministic premium 1080p lesson renderer for XPeX Academy.

Renders brand-safe 16:9 scenes with real text using Pillow, then animates them
with ffmpeg. No generative model is allowed to invent on-screen typography.
"""

from __future__ import annotations

import math
import os
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from src.services.xpex.video_factory import VideoAsset
from src.services.xpex.video_media import VideoMediaError, _run_ffmpeg, probe_duration_seconds

W, H = 1920, 1080
BG = (5, 16, 29)
PANEL = (12, 31, 50)
PANEL_2 = (18, 42, 65)
WHITE = (246, 249, 252)
MUTED = (164, 181, 199)
CYAN = (0, 212, 255)
ORANGE = (255, 122, 0)
GREEN = (70, 220, 160)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def _rounded(draw: ImageDraw.ImageDraw, box, radius=28, fill=PANEL, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    words = " ".join(text.split()).split(" ")
    lines, line = [], ""
    for word in words:
        test = word if not line else f"{line} {word}"
        if draw.textlength(test, font=font) <= max_width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def _brand_header(draw: ImageDraw.ImageDraw, scene_no: int, total: int):
    _rounded(draw, (74, 60, 248, 126), radius=18, fill=ORANGE)
    draw.text((102, 72), "XP", font=_font(34, True), fill=(7, 16, 28))
    draw.text((278, 63), "XPEX ACADEMY", font=_font(40, True), fill=WHITE)
    draw.text((280, 108), "KELLE DIGITAL LAB", font=_font(20, True), fill=CYAN)
    draw.text((1655, 74), f"{scene_no:02d}/{total:02d}", font=_font(24, True), fill=MUTED)


def _footer(draw: ImageDraw.ImageDraw, label: str):
    draw.line((78, 984, 1840, 984), fill=(37, 66, 88), width=2)
    draw.text((78, 1007), label, font=_font(21), fill=MUTED)
    draw.text((1535, 1007), "xpex.academy", font=_font(21, True), fill=ORANGE)


def _accent_grid(draw: ImageDraw.ImageDraw):
    for x in range(0, W, 96):
        draw.line((x, 0, x, H), fill=(10, 28, 44), width=1)
    for y in range(0, H, 96):
        draw.line((0, y, W, y), fill=(10, 28, 44), width=1)
    draw.ellipse((1470, -120, 2070, 480), outline=(0, 120, 155), width=4)
    draw.ellipse((-260, 700, 300, 1260), outline=(140, 70, 0), width=4)


def _scene(path: str, *, scene_no: int, total: int, kicker: str, title: str, body: str,
           bullets: list[str] | None = None, badge: str | None = None):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    _accent_grid(draw)
    _brand_header(draw, scene_no, total)

    if badge:
        _rounded(draw, (80, 184, 420, 238), radius=18, fill=(11, 50, 65), outline=(0, 104, 132))
        draw.text((106, 195), badge.upper(), font=_font(21, True), fill=CYAN)

    draw.text((80, 286), kicker.upper(), font=_font(24, True), fill=ORANGE)

    title_font = _font(66, True)
    y = 338
    for line in _wrap(draw, title, title_font, 1550):
        draw.text((80, y), line, font=title_font, fill=WHITE)
        y += 78

    _rounded(draw, (80, y + 28, 1840, 910), radius=32, fill=PANEL, outline=(28, 71, 95), width=2)

    body_font = _font(33)
    body_y = y + 74
    for line in _wrap(draw, body, body_font, 1640):
        draw.text((126, body_y), line, font=body_font, fill=MUTED)
        body_y += 48

    if bullets:
        body_y += 24
        for idx, item in enumerate(bullets[:4], 1):
            _rounded(draw, (126, body_y, 1760, body_y + 92), radius=18, fill=PANEL_2)
            draw.ellipse((152, body_y + 27, 190, body_y + 65), fill=CYAN if idx % 2 else ORANGE)
            draw.text((208, body_y + 23), item, font=_font(28, True), fill=WHITE)
            body_y += 108

    _footer(draw, "Tecnologia educacional XPeX Academy")
    img.save(path, format="PNG")


def render_premium_lesson_video(
    *,
    narration_path: str,
    output_path: str,
    title: str,
    objective: str,
    explanation: str,
    practice: str,
    assessment: str,
) -> VideoAsset:
    narration = Path(narration_path)
    if not narration.is_file() or narration.stat().st_size == 0:
        raise VideoMediaError("premium renderer narration input is missing")

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    work = out.parent

    scenes = [
        ("BOAS-VINDAS", "Inteligência Artificial — do Básico ao Avançado",
         "Uma formação prática para transformar conhecimento em aplicação real.",
         ["Aprenda", "Pratique", "Converse com o GX", "Comprove"], "CURSO OFICIAL"),
        ("OBJETIVO DA AULA", title, objective,
         ["Conceito central", "Exemplo prático", "Aplicação responsável"], "MÓDULO 1"),
        ("ENTENDA", "O conceito em linguagem simples", explanation,
         ["Sem jargão desnecessário", "Foco em uso real", "Validação antes de confiar"], "FUNDAMENTOS"),
        ("PRATIQUE", "Aprender fazendo", practice,
         ["Execute a tarefa", "Registre evidências", "Compare o resultado"], "MÃO NA MASSA"),
        ("USE O GX", "Seu mentor de aprendizagem com IA",
         "Use o GX para revisar conceitos, pedir exemplos, comparar alternativas e melhorar seu raciocínio. A decisão final continua sendo sua.",
         ["Pergunte", "Teste", "Valide", "Melhore"], "MENTOR IA"),
        ("PROGRESSO", "Comprove o que aprendeu", assessment,
         ["Atividade concluída", "Checkpoint", "Projeto verificável"], "AVALIAÇÃO"),
        ("PRÓXIMO PASSO", "Continue sua jornada na XPeX Academy",
         "Avance para o próximo conteúdo somente depois de compreender e praticar os fundamentos desta aula.",
         ["Fundamento sólido", "Prática progressiva", "Projeto real"], "XPEX ACADEMY"),
    ]

    duration = max(1, probe_duration_seconds(str(narration)))
    weights = [1.0, 1.15, 1.35, 1.15, 1.25, 1.1, 0.9]
    total_weight = sum(weights)
    scene_durations = [max(4.0, duration * w / total_weight) for w in weights]
    scale = duration / sum(scene_durations)
    scene_durations = [d * scale for d in scene_durations]

    segment_paths: list[str] = []
    total = len(scenes)
    for idx, (kicker, scene_title, body, bullets, badge) in enumerate(scenes, 1):
        png = str(work / f"scene-{idx:02d}.png")
        seg = str(work / f"scene-{idx:02d}.mp4")
        _scene(
            png,
            scene_no=idx,
            total=total,
            kicker=kicker,
            title=scene_title,
            body=body,
            bullets=bullets,
            badge=badge,
        )
        frames = max(1, int(scene_durations[idx - 1] * 30))
        _run_ffmpeg(
            [
                "ffmpeg", "-y", "-loop", "1", "-i", png,
                "-vf",
                (
                    "scale=1920:1080,"
                    f"zoompan=z='min(zoom+0.00028,1.035)':d={frames}:s=1920x1080:fps=30,"
                    "fade=t=in:st=0:d=0.35"
                ),
                "-t", f"{scene_durations[idx - 1]:.3f}",
                "-an", "-c:v", "libx264", "-preset", "medium",
                "-crf", "18", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", seg,
            ],
            timeout_seconds=600,
        )
        segment_paths.append(seg)

    concat_file = work / "premium-scenes.txt"
    concat_file.write_text(
        "".join(f"file '{Path(p).name}'\n" for p in segment_paths),
        encoding="utf-8",
    )
    visual_bed = str(work / "premium-visual-bed.mp4")
    _run_ffmpeg(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_file), "-c", "copy", visual_bed,
        ],
        timeout_seconds=600,
    )

    _run_ffmpeg(
        [
            "ffmpeg", "-y", "-i", visual_bed, "-i", str(narration),
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-shortest", "-movflags", "+faststart", str(out),
        ],
        timeout_seconds=1200,
    )
    if not out.is_file() or out.stat().st_size == 0:
        raise VideoMediaError("premium lesson render produced no video")
    import hashlib
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    return VideoAsset(
        uri=str(out),
        checksum_sha256=digest,
        mime_type="video/mp4",
        duration_seconds=max(probe_duration_seconds(str(out)), 1),
    )
