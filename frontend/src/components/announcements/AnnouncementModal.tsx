import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, AlertTriangle, Info, Megaphone } from "lucide-react";
import { apiService } from "@/services/api";
import type { Announcement } from "@/types";

const priorityConfig = {
  low: {
    icon: Info,
    bgColor: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500",
    iconColor: "text-blue-500",
  },
  medium: {
    icon: Megaphone,
    bgColor: "from-yellow-500 to-yellow-600",
    borderColor: "border-yellow-500",
    iconColor: "text-yellow-500",
  },
  high: {
    icon: AlertTriangle,
    bgColor: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500",
    iconColor: "text-orange-500",
  },
  critical: {
    icon: AlertCircle,
    bgColor: "from-red-500 to-red-600",
    borderColor: "border-red-500",
    iconColor: "text-red-500",
  },
};

interface AnnouncementModalProps {
  onClose: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  onClose,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (!loading && (error || isEmpty || announcements.length === 0)) {
      onClose();
    }
  }, [loading, error, isEmpty, announcements.length, onClose]);

  // Bloquear scroll da página quando o modal estiver aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getActiveAnnouncements();
      if (response.success && response.data && response.data.length > 0) {
        setAnnouncements(response.data);
      } else {
        setIsEmpty(true);
      }
    } catch (error) {
      console.error("Erro ao carregar avisos:", error);
      setError("Não foi possível carregar avisos agora.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const currentAnnouncement = announcements[currentIndex];

    try {
      // Só marca como visualizado se marcou "Não mostrar novamente"
      if (dontShowAgain) {
        await apiService.markAnnouncementAsViewed(currentAnnouncement.id);
      }
    } catch (error) {
      console.error("Erro ao marcar aviso como visualizado:", error);
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDontShowAgain(false); // Reset para o próximo anúncio
    } else {
      onClose();
    }
  };

  if (loading) {
    return null;
  }

  if (error || isEmpty || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const config = priorityConfig[currentAnnouncement.priority];
  const Icon = config.icon;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header com gradiente */}
        <div
          className={`bg-gradient-to-r ${config.bgColor} p-6 text-white relative`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-background/20 rounded-xl backdrop-blur-sm">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {currentAnnouncement.title}
                </h2>
                {announcements.length > 1 && (
                  <p className="text-sm text-white/80 mt-1">
                    Aviso {currentIndex + 1} de {announcements.length}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background/20 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentAnnouncement.imageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
              <img
                src={currentAnnouncement.imageUrl}
                alt={currentAnnouncement.title}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
              {currentAnnouncement.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {/* Checkbox "Não mostrar novamente" */}
          <div className="mb-4 flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              Não mostrar este aviso novamente
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {announcements.length > 1 ? (
                <span>
                  {dontShowAgain
                    ? "Este aviso não será exibido novamente"
                    : 'Pressione "Entendi" para ver o próximo aviso'}
                </span>
              ) : (
                <span>
                  {dontShowAgain
                    ? "Este aviso não será exibido novamente"
                    : 'Pressione "Entendi" para continuar'}
                </span>
              )}
            </div>
            <button
              onClick={handleConfirm}
              className={`px-8 py-3 bg-gradient-to-r ${config.bgColor} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
            >
              {currentIndex < announcements.length - 1 ? "Próximo" : "Entendi"}
            </button>
          </div>

          {/* Indicadores de progresso */}
          {announcements.length > 1 && (
            <div className="flex gap-2 mt-4 justify-center">
              {announcements.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? `w-8 bg-gradient-to-r ${config.bgColor}`
                      : index < currentIndex
                        ? "w-2 bg-green-500"
                        : "w-2 bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar usando Portal para garantir que o modal fique acima de tudo
  return createPortal(
    <div className={theme === "dark" ? "dark" : ""}>
      modalContent
    </div>,
    document.body
  );
};
