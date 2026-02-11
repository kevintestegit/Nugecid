import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SpreadsheetPreview } from '@/components/ui/SpreadsheetPreview';
import {
  PastaItem,
  usePastaDetalhes,
  usePastas,
  UploadArquivosInput,
} from '@/hooks/usePastas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ImagePreviewModal, PreviewAttachment } from '@/components/desarquivamentos/ImagePreviewModal';
import { EnhancedConfirmDialog } from '@/components/ui/EnhancedConfirmDialog';

const PrateleiraDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const pastaId = id ?? '';
  const { checkPermission } = useAuth();
  const canManageArquivos =
    checkPermission('create', 'arquivos') ||
    checkPermission('update', 'arquivos') ||
    checkPermission('delete', 'arquivos');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedPlanilhas, setSelectedPlanilhas] = useState<File[]>([]);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [deleteArquivoItem, setDeleteArquivoItem] = useState<{ id: string; nome: string } | null>(null);
  const ensureManagePermission = () => {
    if (canManageArquivos) {
      return true;
    }
    toast.error('Você não tem permissão para alterar arquivos desta prateleira.');
    return false;
  };

  const { data, isLoading, error, refetch } = usePastaDetalhes(pastaId);
  const { uploadArquivos, isUploadingArquivos, deleteArquivo, isDeletingArquivo } = usePastas();

  const pasta = data?.pasta;
  const planilhas = useMemo(() => data?.planilhas ?? [], [data?.planilhas]);
  const totalItens = data?.totalItens ?? 0;
  const arquivos = useMemo(() => pasta?.arquivos ?? [], [pasta?.arquivos]);

  const cardClass = "rounded-xl border border-border/50 bg-muted/20"
  const cardTitleClass = "text-lg font-semibold text-foreground"
  const cardDescriptionClass = "text-xs text-muted-foreground"

  const imagens = useMemo(
    () => arquivos.filter(arquivo => arquivo.tipo === 'IMAGEM'),
    [arquivos],
  );
  const imagemEmPreview = useMemo<PreviewAttachment | null>(() => {
    const imagem = imagens.find(item => item.id === previewImageId);
    if (!imagem) {
      return null;
    }

    return {
      id: imagem.id,
      nomeOriginal: imagem.nomeOriginal,
      previewUrl: imagem.previewUrl,
      url: imagem.url,
      tamanhoBytes: imagem.tamanhoBytes,
      createdAt: imagem.dataUpload,
    };
  }, [imagens, previewImageId]);
  const planilhaArquivos = useMemo(
    () => arquivos.filter(arquivo => arquivo.tipo === 'PLANILHA'),
    [arquivos],
  );

  const destacandoPrimeirosItens = useMemo<PastaItem[]>(() => {
    for (const planilha of planilhas) {
      if (planilha.itens.length) {
        return planilha.itens.slice(0, 5);
      }
    }
    return [];
  }, [planilhas]);

  const handleVoltar = () => {
    navigate('/arquivo', { replace: true });
  };

  const handleImagemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!ensureManagePermission()) {
      event.target.value = '';
      return;
    }
    const files = Array.from(event.target.files ?? []);
    setSelectedImages(files);
  };

  const handlePlanilhaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!ensureManagePermission()) {
      event.target.value = '';
      return;
    }
    const files = Array.from(event.target.files ?? []);
    setSelectedPlanilhas(files);
  };

  const handleUpload = async (payload: UploadArquivosInput) => {
    if (!ensureManagePermission()) return;
    try {
      await uploadArquivos(payload);
      toast.success('Arquivos enviados com sucesso!');
      setSelectedImages([]);
      setSelectedPlanilhas([]);
      setPreviewImageId(null);
      await refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error('Não foi possível enviar os arquivos.');
    }
  };

  const handleUploadImagens = () => {
    if (!selectedImages.length || !pastaId) return;
    if (!ensureManagePermission()) return;
    handleUpload({
      pastaId,
      imagens: selectedImages,
    });
  };


  const handleDeleteArquivo = (arquivoId: string, arquivoNome: string) => {
    if (!pastaId || !arquivoId) return;
    if (!ensureManagePermission()) return;
    setDeleteArquivoItem({ id: arquivoId, nome: arquivoNome });
  };

  const handleConfirmDeleteArquivo = async () => {
    if (!deleteArquivoItem || !pastaId) return;
    if (!ensureManagePermission()) return;
    try {
      await deleteArquivo({ pastaId, arquivoId: deleteArquivoItem.id });
      if (previewImageId === deleteArquivoItem.id) {
        setPreviewImageId(null);
      }
      toast.success('Anexo removido com sucesso.');
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível remover o anexo.');
    } finally {
      setDeleteArquivoItem(null);
    }
  };

  const handleUploadPlanilhas = () => {
    if (!selectedPlanilhas.length || !pastaId) return;
    if (!ensureManagePermission()) return;
    handleUpload({
      pastaId,
      planilhas: selectedPlanilhas,
    });
  };

  const handleOpenPreview = (imagemId: string) => {
    setPreviewImageId(imagemId);
  };

  const handleClosePreview = () => {
    setPreviewImageId(null);
  };

  const handleDownloadPreviewImage = (anexoId: number | string) => {
    const imagem = imagens.find(item => item.id === String(anexoId));
    if (imagem?.url) {
      const link = document.createElement('a');
      link.href = imagem.url;
      link.download = imagem.nomeOriginal || 'imagem';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!pastaId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card className="border border-destructive/40 bg-destructive/10">
          <CardContent className="py-6 text-destructive">
            Nenhuma prateleira foi selecionada.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {pasta?.nome ?? 'Prateleira'}
            </h1>
            {pasta?.descricao && (
              <p className="text-sm text-muted-foreground mt-1">
                {pasta.descricao}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">
            <ImageIcon className="h-4 w-4" />
            {pasta?.imagens ?? 0}{' '}
            {(pasta?.imagens ?? 0) === 1 ? 'imagem' : 'imagens'}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-amber-600">
            <FileSpreadsheet className="h-4 w-4" />
            {pasta?.planilhas ?? 0}{' '}
            {(pasta?.planilhas ?? 0) === 1 ? 'planilha' : 'planilhas'}
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border border-destructive/40 bg-destructive/10">
          <CardContent className="py-6 text-destructive">
            Não foi possível carregar os detalhes desta prateleira. Tente
            novamente mais tarde.
          </CardContent>
        </Card>
      ) : null}

      {pasta?.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {pasta.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={cardTitleClass}>Fotos da Prateleira</CardTitle>
            <CardDescription className={cardDescriptionClass}>
              Upload e visualização das imagens de referência da prateleira.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById('upload-imagens-input')?.click()
                }
                disabled={!canManageArquivos || isUploadingArquivos}
                title={
                  canManageArquivos
                    ? undefined
                    : 'Apenas administradores ou coordenadores podem enviar imagens'
                }
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Selecionar imagens
              </Button>
              <Button
                onClick={handleUploadImagens}
                disabled={
                  !canManageArquivos ||
                  isUploadingArquivos ||
                  selectedImages.length === 0
                }
              >
                {isUploadingArquivos ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar imagens
                  </>
                )}
              </Button>
              <input
                id="upload-imagens-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={!canManageArquivos}
                onChange={handleImagemChange}
              />
            </div>
            {selectedImages.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
                {selectedImages.map(file => (
                  <span
                    key={file.name}
                    className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground/80"
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}

            {imagens.length ? (
              <div className="grid gap-2 md:grid-cols-3 sm:grid-cols-4">
                {imagens.map(imagem => (
                  <div
                    key={imagem.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenPreview(imagem.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenPreview(imagem.id);
                      }
                    }}
                    className="group relative flex h-44 cursor-pointer items-end overflow-hidden rounded-xl border border-border/70 bg-black/10 transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  >
                    {imagem.previewUrl ? (
                      <img
                        src={imagem.previewUrl}
                        alt={imagem.nomeOriginal}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/60" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={event => {
                          event.stopPropagation();
                          handleOpenPreview(imagem.id);
                        }}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      {canManageArquivos && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={event => {
                            event.stopPropagation();
                            handleDeleteArquivo(imagem.id, imagem.nomeOriginal);
                          }}
                          disabled={isDeletingArquivo}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="relative z-10 mt-auto w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-xs text-primary-foreground">
                      <p className="font-medium truncate">
                        {imagem.nomeOriginal}
                      </p>
                      <span className="text-[11px] text-primary-foreground/80">
                        {new Date(imagem.dataUpload).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
                
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 bg-background/70 py-10 text-center text-sm text-muted-foreground">
                Nenhuma imagem cadastrada ainda.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={cardTitleClass}>Planilhas da Prateleira</CardTitle>
            <CardDescription className={cardDescriptionClass}>
              Envie planilhas para alimentar a lista de itens desta prateleira.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById('upload-planilhas-input')?.click()
                }
                disabled={!canManageArquivos || isUploadingArquivos}
                title={
                  canManageArquivos
                    ? undefined
                    : 'Apenas administradores ou coordenadores podem enviar planilhas'
                }
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Selecionar planilhas
              </Button>
              <Button
                onClick={handleUploadPlanilhas}
                disabled={
                  !canManageArquivos ||
                  isUploadingArquivos ||
                  selectedPlanilhas.length === 0
                }
              >
                {isUploadingArquivos ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar planilhas
                  </>
                )}
              </Button>
              <input
                id="upload-planilhas-input"
                type="file"
                accept=".xls,.xlsx,.csv,.ods,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="hidden"
                disabled={!canManageArquivos}
                onChange={handlePlanilhaChange}
              />
            </div>
            {selectedPlanilhas.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
                {selectedPlanilhas.map(file => (
                  <span
                    key={file.name}
                    className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground/80"
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}

            {planilhaArquivos.length ? (
              <div className="space-y-3">
                {planilhaArquivos.map(planilha => (
                  <div
                    key={planilha.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-4 py-3 text-sm transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {planilha.nomeOriginal}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Atualizada em{' '}
                        {new Date(planilha.dataUpload).toLocaleDateString(
                          'pt-BR',
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => {
                          if (planilha.url) {
                            window.open(planilha.url, '_blank', 'noopener');
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canManageArquivos && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() =>
                            handleDeleteArquivo(planilha.id, planilha.nomeOriginal)
                          }
                          disabled={isDeletingArquivo}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 bg-background/70 py-10 text-center text-sm text-muted-foreground">
                Nenhuma planilha anexada ainda.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={cardClass}>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className={cardTitleClass}>Itens catalogados</CardTitle>
          <CardDescription>
            {totalItens > 0
              ? `Foram identificados ${totalItens} item(s) a partir das planilhas anexadas.`
              : 'Aguardando upload de planilhas para catálogo de itens.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando itens...
            </div>
          ) : null}

          {destacandoPrimeirosItens.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {destacandoPrimeirosItens.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground"
                >
                  <p className="text-base font-semibold text-foreground">
                    {item.destaque || 'Item de catálogo'}
                  </p>
                  <div className="mt-2 grid gap-1">
                    {Object.entries(item.valores)
                      .filter(([, valor]) => valor && valor.trim().length > 0)
                      .slice(0, 4)
                      .map(([chave, valor]) => (
                        <div key={chave} className="flex justify-between text-xs">
                          <span className="font-medium text-foreground/70">
                            {chave}
                          </span>
                          <span className="text-right text-foreground/90">
                            {valor}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {planilhas.length ? (
            <div className="space-y-6">
              {planilhas.map(planilha => (
                <div
                  key={planilha.planilhaId}
                  className="rounded-xl border border-border/60 bg-muted/20 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        {planilha.planilhaNome || 'Planilha'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Aba: {planilha.sheetName || 'Principal'} ({planilha.itens.length} itens)
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const arquivo = planilhaArquivos.find(
                          item => item.id === planilha.planilhaId,
                        );
                        if (arquivo?.url) {
                          window.open(arquivo.url, '_blank', 'noopener');
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar planilha
                    </Button>
                  </div>
                  <div className="mt-4">
                    <SpreadsheetPreview
                      headers={planilha.colunas}
                      data={planilha.itens.map(item => item.valores)}
                      maxHeight="max-h-[360px]"
                      showRowNumbers
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/70 py-12 text-center text-sm text-muted-foreground">
              Nenhuma planilha processada até o momento.
            </div>
          )}
        </CardContent>
      </Card>

      <ImagePreviewModal
        anexo={imagemEmPreview}
        previewUrl={imagemEmPreview?.previewUrl ?? imagemEmPreview?.url ?? null}
        onClose={handleClosePreview}
        onDownload={handleDownloadPreviewImage}
        canEdit={false}
        allImages={imagens.map(img => ({
          id: img.id,
          nomeOriginal: img.nomeOriginal,
          previewUrl: img.previewUrl,
          url: img.url,
          tamanhoBytes: img.tamanhoBytes,
          createdAt: img.dataUpload,
        }))}
      />

      <EnhancedConfirmDialog
        isOpen={canManageArquivos && deleteArquivoItem !== null}
        onClose={() => setDeleteArquivoItem(null)}
        onConfirm={handleConfirmDeleteArquivo}
        title="Excluir anexo"
        description={`Tem certeza que deseja excluir o anexo "${deleteArquivoItem?.nome}"?`}
        variant="danger"
        confirmationType="checkbox"
        checkboxLabel="Sim, desejo excluir este anexo permanentemente"
        warningList={[
          'Esta ação não pode ser desfeita',
          'O arquivo será removido permanentemente',
          'Não será possível recuperar este anexo'
        ]}
      />
    </div>
  );
};

export default PrateleiraDetailPage;
