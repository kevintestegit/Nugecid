#!/usr/bin/env python3
"""Run local OCR over the Arquivo Ribeira photos and export review files."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


DEFAULT_INPUT_DIR = Path("/home/gecid-004/Downloads/Arquivo Ribeira")
DEFAULT_OUTPUT_DIR = Path("/tmp/arquivo-ribeira-ocr")
SUPPORTED_EXTENSIONS = {".heic", ".heif", ".jpg", ".jpeg", ".png", ".webp"}


def normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


def classify_room(text: str) -> str:
    normalized = normalize_text(text).lower()
    if "iml" in normalized or "medico legal" in normalized or "médico legal" in normalized:
        return "Sala do IML"
    if (
        "instituto de identificacao" in normalized
        or "instituto de identificação" in normalized
        or "identificacao" in normalized
        or "identificação" in normalized
    ):
        return "Sala Instituto de Identificacao"
    return "A classificar"


def extract_box_number(text: str) -> str:
    patterns = [
        r"\bcaixa(?:\s+arquivo)?\s*(?:n[oº.]*)?\s*[:\-]?\s*([a-zA-Z]?\d{1,6})\b",
        r"\btombo\s*(?:n[oº.]*)?\s*[:\-]?\s*([a-zA-Z]?\d{1,6})\b",
        r"\b(cx)\s*[:\-]?\s*([a-zA-Z]?\d{1,6})\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        return match.group(match.lastindex or 1)

    return ""


def _coerce_json_result(result_item: Any) -> dict[str, Any]:
    if isinstance(result_item, dict):
        return result_item

    json_value = getattr(result_item, "json", None)
    if isinstance(json_value, dict):
        return json_value

    return {}


def extract_texts_from_paddle_result(result: Any) -> tuple[list[str], float | None]:
    items = result if isinstance(result, list) else [result]
    texts: list[str] = []
    scores: list[float] = []

    for item in items:
        data = _coerce_json_result(item)
        if "res" in data and isinstance(data["res"], dict):
            data = data["res"]

        raw_texts = data.get("rec_texts", [])
        raw_scores = data.get("rec_scores", [])

        if isinstance(raw_texts, list):
            texts.extend(
                normalize_text(str(text))
                for text in raw_texts
                if normalize_text(str(text))
            )

        if isinstance(raw_scores, list):
            for score in raw_scores:
                try:
                    scores.append(float(score))
                except (TypeError, ValueError):
                    continue

    average_score = round(sum(scores) / len(scores), 3) if scores else None
    return texts, average_score


def list_source_images(input_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in input_dir.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def find_imagemagick_command() -> str:
    for command in ("magick", "convert"):
        path = shutil.which(command)
        if path:
            return path
    raise RuntimeError("ImageMagick nao encontrado. Instale 'imagemagick'.")


def convert_for_ocr(source: Path, output_dir: Path, max_side: int) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"{source.stem}.jpg"

    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return target

    try:
        from PIL import Image, ImageOps
        from pillow_heif import register_heif_opener

        register_heif_opener()
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image)
            image.thumbnail((max_side, max_side))
            image.convert("RGB").save(target, quality=92, optimize=True)
        return target
    except ImportError:
        pass

    command = find_imagemagick_command()
    subprocess.run(
        [
            command,
            str(source),
            "-auto-orient",
            "-resize",
            f"{max_side}x{max_side}>",
            "-colorspace",
            "sRGB",
            "-quality",
            "92",
            str(target),
        ],
        check=True,
    )
    return target


def build_record(source: Path, converted: Path, texts: list[str], score: float | None) -> dict[str, Any]:
    full_text = " | ".join(texts)
    return {
        "foto_original": source.name,
        "foto_convertida": str(converted),
        "sala": classify_room(full_text),
        "numero_caixa": extract_box_number(full_text),
        "confianca_media": "" if score is None else score,
        "texto_detectado": full_text,
    }


def write_outputs(records: list[dict[str, Any]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / "arquivo-ribeira-ocr.csv"
    json_path = output_dir / "arquivo-ribeira-ocr.json"

    fieldnames = [
        "foto_original",
        "foto_convertida",
        "sala",
        "numero_caixa",
        "confianca_media",
        "texto_detectado",
    ]

    with csv_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    with json_path.open("w", encoding="utf-8") as json_file:
        json.dump(records, json_file, ensure_ascii=False, indent=2)


def create_ocr(
    model_version: str,
    device: str,
    text_detection_model_name: str | None,
    text_recognition_model_name: str | None,
):
    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", "/tmp/paddlex-cache")
    os.environ.setdefault("PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT", "False")

    try:
        from paddleocr import PaddleOCR
    except ImportError as exc:
        raise RuntimeError(
            "PaddleOCR nao esta instalado. Use: python3 -m pip install paddleocr"
        ) from exc

    return PaddleOCR(
        ocr_version=model_version,
        device=device,
        text_detection_model_name=text_detection_model_name,
        text_recognition_model_name=text_recognition_model_name,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=True,
    )


def run_ocr(
    input_dir: Path,
    output_dir: Path,
    model_version: str,
    device: str,
    max_side: int,
    text_detection_model_name: str | None = None,
    text_recognition_model_name: str | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    images = list_source_images(input_dir)
    if limit is not None:
        images = images[:limit]
    if not images:
        raise RuntimeError(f"Nenhuma imagem encontrada em {input_dir}")

    converted_dir = output_dir / "converted"
    raw_dir = output_dir / "raw-paddle-json"
    raw_dir.mkdir(parents=True, exist_ok=True)

    ocr = create_ocr(
        model_version=model_version,
        device=device,
        text_detection_model_name=text_detection_model_name,
        text_recognition_model_name=text_recognition_model_name,
    )
    records: list[dict[str, Any]] = []

    for index, source in enumerate(images, start=1):
        print(f"[{index}/{len(images)}] OCR {source.name}", flush=True)
        converted = convert_for_ocr(source, converted_dir, max_side=max_side)
        result = ocr.predict(str(converted))

        for item in result if isinstance(result, list) else [result]:
            save_to_json = getattr(item, "save_to_json", None)
            if callable(save_to_json):
                save_to_json(str(raw_dir), ensure_ascii=False)

        texts, score = extract_texts_from_paddle_result(result)
        records.append(build_record(source, converted, texts, score))

    write_outputs(records, output_dir)
    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Processa OCR local das fotos do Arquivo Ribeira com PaddleOCR.",
    )
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--model-version", default="PP-OCRv6")
    parser.add_argument("--text-detection-model-name", default=None)
    parser.add_argument("--text-recognition-model-name", default=None)
    parser.add_argument("--device", default="cpu")
    parser.add_argument("--max-side", type=int, default=2200)
    parser.add_argument("--limit", type=int, default=None)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        records = run_ocr(
            input_dir=args.input_dir,
            output_dir=args.output_dir,
            model_version=args.model_version,
            device=args.device,
            max_side=args.max_side,
            text_detection_model_name=args.text_detection_model_name,
            text_recognition_model_name=args.text_recognition_model_name,
            limit=args.limit,
        )
    except Exception as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1

    print(f"OCR concluido: {len(records)} imagens")
    print(f"CSV: {args.output_dir / 'arquivo-ribeira-ocr.csv'}")
    print(f"JSON: {args.output_dir / 'arquivo-ribeira-ocr.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
