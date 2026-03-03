import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { createPortal } from "react-dom";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Download from "yet-another-react-lightbox/plugins/download";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import type { ComponentProps, Plugin } from "yet-another-react-lightbox";
import { DesarquivamentoAnexo } from "@/hooks/useDesarquivamentosAnexos";
import { RotateCw, Download as DownloadIcon } from "lucide-react";

export type PreviewAttachment = Omit<Partial<DesarquivamentoAnexo>, "id"> & {
  id: number | string;
  nomeOriginal: string;
  previewUrl?: string;
  url?: string;
  tipoMime?: string;
  tamanhoBytes?: number | string;
  createdAt?: string;
  usuario?: { nome?: string } | null;
};

const inferMimeFromFileName = (name?: string): string | undefined => {
  if (!name) return undefined;

  const ext = name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    default:
      return undefined;
  }
};

const formatBytes = (value?: number | string): string | null => {
  if (value === undefined || value === null) return null;
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  if (numeric === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(numeric) / Math.log(1024)),
    units.length - 1,
  );
  const size = numeric / Math.pow(1024, exponent);

  return `${size.toFixed(
    exponent === 0 ? 0 : size >= 100 ? 0 : 1,
  )} ${units[exponent]}`;
};

interface ImagePreviewModalProps {
  anexo: PreviewAttachment | null;
  previewUrl: string | null;
  onClose: () => void;
  onUpdateDescricao?: (
    anexoId: number | string,
    descricao: string,
  ) => Promise<void>;
  onDownload?: (anexoId: number | string) => void;
  canEdit?: boolean;
  // Lista de todas as imagens para navegação
  allImages?: PreviewAttachment[];
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  anexo,
  previewUrl,
  onClose,
  onDownload,
  allImages = [],
}) => {
  const { theme } = useTheme();
  // Priorizar o previewUrl do prop (blob URL) em vez do anexo.previewUrl (API URL)
  const resolvedPreviewUrl =
    previewUrl || anexo?.previewUrl || anexo?.url || null;
  const isOpen = Boolean(resolvedPreviewUrl && anexo);
  const [rotation, setRotation] = useState(0);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Handler para tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setRotation(0);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Reset rotation when attachment changes
  useEffect(() => {
    setRotation(0);
  }, [anexo?.id]);

  if (!isOpen || !anexo) return null;

  const resolvedMime = (
    anexo.tipoMime ??
    inferMimeFromFileName(anexo.nomeOriginal) ??
    ""
  ).toLowerCase();
  const isPdf = resolvedMime === "application/pdf";
  const formattedSize = formatBytes(anexo.tamanhoBytes);
  const uploadedBy = anexo.usuario?.nome;
  const uploadedAt = anexo.createdAt
    ? new Date(anexo.createdAt).toLocaleDateString("pt-BR")
    : null;

  // Se for PDF, renderizar com iframe
  if (isPdf && resolvedPreviewUrl) {
    const pdfModal = (
      <div
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex h-full w-full items-center justify-center p-4">
          <div
            className="flex h-full max-h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-black/70 px-5 py-4 text-white">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold">
                  {anexo.nomeOriginal}
                </h3>
                <p className="text-sm text-gray-300">
                  {formattedSize && `${formattedSize} • `}
                  {uploadedBy && `Enviado por ${uploadedBy}`}
                  {uploadedAt && ` em ${uploadedAt}`}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={handleRotate}
                  className="rounded bg-zinc-800 p-2 text-white transition-colors hover:bg-zinc-700"
                  aria-label="Rotacionar imagem 90 graus"
                  title="Rotacionar imagem"
                >
                  <RotateCw size={20} />
                </button>
                {onDownload && (
                  <button
                    onClick={() => onDownload(anexo.id)}
                    className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    title="Baixar PDF"
                  >
                    <DownloadIcon size={16} />
                    Baixar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
                  title="Fechar"
                >
                  Fechar (ESC)
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-background flex items-center justify-center overflow-hidden">
              <div
                className="h-full w-full transition-transform duration-200"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  width: rotation % 180 !== 0 ? "auto" : "100%",
                  height: rotation % 180 !== 0 ? "auto" : "100%",
                  maxWidth: rotation % 180 !== 0 ? "100vh" : "100%",
                  maxHeight: rotation % 180 !== 0 ? "100vw" : "100%",
                }}
              >
                <iframe
                  src={resolvedPreviewUrl}
                  className="h-full w-full border-0"
                  title={anexo.nomeOriginal}
                  style={{
                    width: rotation % 180 !== 0 ? "calc(100vh - 4rem)" : "100%",
                    height:
                      rotation % 180 !== 0 ? "calc(100vw - 4rem)" : "100%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(
      <div className={theme === "dark" ? "dark" : ""}>{pdfModal}</div>,
      document.body,
    );
  }

  // Criar slides para todas as imagens ou apenas a atual
  const imagesToShow = allImages.length > 0 ? allImages : [anexo];

  const slides = imagesToShow.map((img) => {
    const imgPreviewUrl =
      img.id === anexo.id && previewUrl
        ? previewUrl
        : img.previewUrl || img.url || "";
    const imgFormattedSize = formatBytes(img.tamanhoBytes);
    const imgUploadedBy = img.usuario?.nome;
    const imgUploadedAt = img.createdAt
      ? new Date(img.createdAt).toLocaleDateString("pt-BR")
      : null;

    let captionText = img.nomeOriginal;
    if (img.descricao) {
      captionText += ` - ${img.descricao}`;
    }
    if (imgUploadedBy || imgUploadedAt) {
      captionText += "\n";
      if (imgUploadedBy) captionText += `Enviado por ${imgUploadedBy}`;
      if (imgUploadedAt) captionText += ` em ${imgUploadedAt}`;
    }
    if (imgFormattedSize) {
      captionText += ` • ${imgFormattedSize}`;
    }

    return {
      type: "image" as const,
      src: imgPreviewUrl,
      title: img.nomeOriginal,
      description: captionText,
      download: imgPreviewUrl,
    };
  });

  const currentIndex =
    allImages.length > 0
      ? allImages.findIndex((img) => img.id === anexo.id)
      : 0;

  const handleDownload = () => {
    if (onDownload && anexo) {
      onDownload(anexo.id);
    }
    return true;
  };

  const RotationPlugin: Plugin = ({ augment }) => {
    augment(
      ({ toolbar, ...rest }: ComponentProps): ComponentProps => ({
        toolbar: {
          ...toolbar,
          buttons: [
            <button
              key="rotate"
              type="button"
              className="yarl__button"
              onClick={handleRotate}
              aria-label="Rotacionar imagem 90 graus"
              title="Rotacionar imagem"
            >
              <RotateCw size={24} />
            </button>,
            ...(toolbar?.buttons || []),
          ],
        },
        ...rest,
      }),
    );
  };

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex >= 0 ? currentIndex : 0}
      plugins={[Zoom, Download, Captions, RotationPlugin]}
      on={{
        view: () => setRotation(0),
      }}
      render={{
        slide: ({ slide, rect }) => {
          if (slide.type === "image") {
            return (
              <div className="flex h-full w-full items-center justify-center overflow-hidden">
                <div
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease-in-out",
                    width: rotation % 180 !== 0 ? rect.height : rect.width,
                    height: rotation % 180 !== 0 ? rect.width : rect.height,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            );
          }
          return undefined;
        },
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      download={{
        download: handleDownload,
      }}
      captions={{
        showToggle: true,
        descriptionTextAlign: "start",
      }}
      carousel={{
        finite: slides.length <= 1,
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      styles={{
        container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
      }}
    />
  );
};
