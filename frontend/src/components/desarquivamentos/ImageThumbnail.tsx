import React, { useEffect, useState } from "react";
import { api } from "@/services/api";

interface ImageThumbnailProps {
  desarquivamentoId: number | null;
  numeroProcesso?: string | null;
  anexoId: number;
  nomeOriginal: string;
  tipoMime: string;
  previewUrl?: string;
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  desarquivamentoId,
  numeroProcesso,
  anexoId,
  nomeOriginal,
  tipoMime,
  previewUrl,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isActive = true;
    const controller = new AbortController();
    const buildProcessoPreviewUrl = (numero: string, id: number) =>
      `/api/nugecid/processo/${encodeURIComponent(numero)}/anexos/${id}/view`;

    const loadImage = async () => {
      try {
        if (!isActive) return;
        setLoading(true);
        setError(false);

        let blob: Blob;

        // Se tem previewUrl, usar ela (vem do backend com a URL correta)
        if (previewUrl) {
          const response = await api.get(previewUrl, {
            responseType: "blob",
            signal: controller.signal,
            baseURL: "",
          });
          blob = response.data;
        } else if (desarquivamentoId) {
          // Anexo de solicitação
          const response = await api.get(
            `/nugecid/${desarquivamentoId}/anexos/${anexoId}/view`,
            {
              responseType: "blob",
              signal: controller.signal,
            },
          );
          blob = response.data;
        } else if (numeroProcesso) {
          // Anexo de processo - usar rota de processo
          const response = await api.get(
            buildProcessoPreviewUrl(numeroProcesso, anexoId),
            {
              responseType: "blob",
              signal: controller.signal,
              baseURL: "",
            },
          );
          blob = response.data;
        } else {
          throw new Error(
            "Nem desarquivamentoId nem numeroProcesso fornecidos",
          );
        }

        // Cria URL temporária
        objectUrl = URL.createObjectURL(blob);
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setImageUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          return;
        }
        if (!isActive) return;
        console.error("Erro ao carregar miniatura:", err);
        setError(true);
        setLoading(false);
      }
    };

    // Só carrega se for imagem
    if (tipoMime.startsWith("image/")) {
      loadImage();
    } else {
      setLoading(false);
    }

    // Cleanup: libera a URL ao desmontar
    return () => {
      isActive = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [desarquivamentoId, numeroProcesso, anexoId, tipoMime, previewUrl]);

  // Mostrar ícone enquanto carrega
  if (loading) {
    return (
      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Se deu erro ou não é imagem, mostrar ícone colorido
  if (error || !tipoMime.startsWith("image/")) {
    return (
      <div
        className={`h-12 w-12 rounded flex items-center justify-center text-white text-xs font-bold ${
          tipoMime.startsWith("image/")
            ? "bg-green-500"
            : tipoMime === "application/pdf"
              ? "bg-red-500"
              : "bg-blue-500"
        }`}
      >
        {tipoMime.startsWith("image/")
          ? "IMG"
          : tipoMime === "application/pdf"
            ? "PDF"
            : "DOC"}
      </div>
    );
  }

  // Mostrar miniatura da imagem
  return (
    <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <img
        src={imageUrl || ""}
        alt={nomeOriginal}
        className="h-full w-full object-cover"
      />
    </div>
  );
};
