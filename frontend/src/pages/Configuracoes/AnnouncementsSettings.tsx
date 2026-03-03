import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Label,
  Input,
  Textarea,
} from "@/components/ui";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  AlertCircle,
  Loader2,
  Save,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { apiService } from "@/services/api";
import axios from "axios";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { Announcement } from "@/types";

const priorityLabels = {
  low: { label: "Baixa", color: "bg-blue-100 text-blue-800" },
  medium: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Crítica", color: "bg-red-100 text-red-800" },
};

export const AnnouncementsSettings: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    startDate: "",
    endDate: "",
    active: true,
    targetRoles: [] as string[],
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAnnouncements(true);
      if (response.success && response.data) {
        setAnnouncements(response.data);
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar avisos:", error);
      toast.error("Erro ao carregar avisos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl || "",
        priority: announcement.priority,
        startDate: announcement.startDate.slice(0, 16),
        endDate: announcement.endDate.slice(0, 16),
        active: announcement.active,
        targetRoles: announcement.targetRoles || [],
      });
      setImagePreview(announcement.imageUrl || null);
    } else {
      setEditingId(null);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData({
        title: "",
        content: "",
        imageUrl: "",
        priority: "medium",
        startDate: now.toISOString().slice(0, 16),
        endDate: tomorrow.toISOString().slice(0, 16),
        active: true,
        targetRoles: [],
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImagePreview(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    try {
      setUploading(true);

      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para o servidor
      const formDataUpload = new FormData();
      formDataUpload.append("image", file);

      const response = await apiService.uploadAnnouncementImage(formDataUpload);

      if (response.success && response.data?.url) {
        setFormData({ ...formData, imageUrl: response.data.url });
        toast.success("Imagem enviada com sucesso!");
      }
    } catch (error: unknown) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Erro ao fazer upload da imagem"
          : "Erro ao fazer upload da imagem",
      );
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageUrl: "" });
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (
      !formData.title ||
      !formData.content ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        imageUrl: formData.imageUrl || undefined,
        targetRoles:
          formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
      };

      if (editingId) {
        await apiService.updateAnnouncement(editingId, payload);
        toast.success("Aviso atualizado com sucesso!");
      } else {
        await apiService.createAnnouncement(payload);
        toast.success("Aviso criado com sucesso!");
      }

      handleCloseModal();
      await loadAnnouncements();
    } catch (error: unknown) {
      console.error("Erro ao salvar aviso:", error);
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Erro ao salvar aviso"
          : "Erro ao salvar aviso",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

    try {
      await apiService.deleteAnnouncement(id);
      toast.success("Aviso excluído com sucesso!");
      await loadAnnouncements();
    } catch (error: unknown) {
      console.error("Erro ao excluir aviso:", error);
      toast.error("Erro ao excluir aviso");
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await apiService.updateAnnouncement(announcement.id, {
        active: !announcement.active,
      });
      toast.success(announcement.active ? "Aviso desativado" : "Aviso ativado");
      await loadAnnouncements();
    } catch (error: unknown) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status do aviso");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando avisos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Avisos do Sistema
              </CardTitle>
              <CardDescription>
                Crie e gerencie avisos que serão exibidos para os usuários na
                tela inicial
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Aviso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum aviso criado</p>
              <p className="text-sm text-muted-foreground/70">
                Crie um aviso para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const isActive =
                  announcement.active &&
                  new Date() >= new Date(announcement.startDate) &&
                  new Date() <= new Date(announcement.endDate);

                return (
                  <div
                    key={announcement.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg truncate">
                            {announcement.title}
                          </h3>
                          <Badge
                            className={
                              priorityLabels[announcement.priority].color
                            }
                          >
                            {priorityLabels[announcement.priority].label}
                          </Badge>
                          {isActive && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Ativo
                            </Badge>
                          )}
                          {!announcement.active && (
                            <Badge
                              variant="outline"
                              className="bg-muted/50 text-muted-foreground"
                            >
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(
                              announcement.startDate,
                            ).toLocaleDateString("pt-BR")}{" "}
                            -{" "}
                            {new Date(announcement.endDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                          <span>
                            Por:{" "}
                            {typeof announcement.createdBy === "object"
                              ? announcement.createdBy?.nome
                              : `ID ${announcement.createdBy}`}
                          </span>
                          <span>
                            {formatDistanceToNow(
                              new Date(announcement.createdAt),
                              {
                                addSuffix: true,
                                locale: ptBR,
                              },
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(announcement)}
                          title={announcement.active ? "Desativar" : "Ativar"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criar/Editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Aviso" : "Novo Aviso"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Manutenção programada"
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Descreva o aviso..."
                rows={4}
              />
            </div>

            {/* Upload de Imagem */}
            <div className="space-y-3">
              <Label htmlFor="image">Imagem (opcional)</Label>

              {imagePreview ? (
                <div className="relative border-2 border-dashed border-border rounded-lg p-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-6 right-6 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="image"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          Enviando imagem...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Clique para fazer upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, GIF ou WebP (máx. 5MB)
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as
                      | "low"
                      | "medium"
                      | "high"
                      | "critical",
                  })
                }
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Aviso ativo
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseModal}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
