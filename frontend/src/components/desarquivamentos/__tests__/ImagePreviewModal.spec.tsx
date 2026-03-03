import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImagePreviewModal } from "../ImagePreviewModal";

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

vi.mock("yet-another-react-lightbox", () => ({
  default: () => null,
}));

vi.mock("yet-another-react-lightbox/plugins/zoom", () => ({
  default: {},
}));

vi.mock("yet-another-react-lightbox/plugins/download", () => ({
  default: {},
}));

vi.mock("yet-another-react-lightbox/plugins/captions", () => ({
  default: {},
}));

describe("ImagePreviewModal", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("renders PDF previews in a portal and locks body scroll", () => {
    const onClose = vi.fn();

    render(
      <ImagePreviewModal
        anexo={{
          id: 10,
          nomeOriginal: "resultado.pdf",
          tipoMime: "application/pdf",
          tamanhoBytes: 2048,
        }}
        previewUrl="blob:http://localhost/test-pdf"
        onClose={onClose}
      />,
    );

    expect(screen.getByText("resultado.pdf")).toBeInTheDocument();
    expect(screen.getByTitle("resultado.pdf")).toHaveAttribute(
      "src",
      "blob:http://localhost/test-pdf",
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("rotates PDF previews without closing the modal", () => {
    const onClose = vi.fn();

    render(
      <ImagePreviewModal
        anexo={{
          id: 12,
          nomeOriginal: "documento.pdf",
          tipoMime: "application/pdf",
        }}
        previewUrl="blob:http://localhost/test-pdf"
        onClose={onClose}
      />,
    );

    const rotateButton = screen.getByRole("button", {
      name: "Rotacionar imagem 90 graus",
    });
    const iframe = screen.getByTitle("documento.pdf");

    fireEvent.click(rotateButton);

    expect(iframe.parentElement).toHaveStyle("transform: rotate(90deg)");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes the PDF preview when the backdrop is clicked", () => {
    const onClose = vi.fn();

    const { container } = render(
      <ImagePreviewModal
        anexo={{
          id: 11,
          nomeOriginal: "resultado.pdf",
          tipoMime: "application/pdf",
        }}
        previewUrl="blob:http://localhost/test-pdf"
        onClose={onClose}
      />,
    );

    const backdrop = container.ownerDocument.body.querySelector(
      ".fixed.inset-0.z-\\[9999\\]",
    );

    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
