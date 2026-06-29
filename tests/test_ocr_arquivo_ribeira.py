import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "ocr_arquivo_ribeira.py"
spec = importlib.util.spec_from_file_location("ocr_arquivo_ribeira", MODULE_PATH)
ocr_arquivo_ribeira = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(ocr_arquivo_ribeira)


class OcrArquivoRibeiraTest(unittest.TestCase):
    def test_classify_room_detects_instituto_identificacao(self):
        room = ocr_arquivo_ribeira.classify_room(
            "Arquivo permanente - Instituto de Identificacao - caixa 023"
        )

        self.assertEqual(room, "Sala Instituto de Identificacao")

    def test_classify_room_detects_iml(self):
        room = ocr_arquivo_ribeira.classify_room("SALA IML TOMBO 104")

        self.assertEqual(room, "Sala do IML")

    def test_extract_box_number_from_common_archive_labels(self):
        number = ocr_arquivo_ribeira.extract_box_number("CAIXA ARQUIVO No 0123")

        self.assertEqual(number, "0123")

    def test_extract_texts_from_paddle_result_supports_dict_shape(self):
        result = [
            {"rec_texts": ["CAIXA 18", "SALA IML"], "rec_scores": [0.91, 0.82]}
        ]

        texts, average_score = ocr_arquivo_ribeira.extract_texts_from_paddle_result(
            result
        )

        self.assertEqual(texts, ["CAIXA 18", "SALA IML"])
        self.assertEqual(average_score, 0.865)


if __name__ == "__main__":
    unittest.main()
