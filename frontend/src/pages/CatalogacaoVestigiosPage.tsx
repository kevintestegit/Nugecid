import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Save, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EnhancedConfirmDialog } from "@/components/ui/EnhancedConfirmDialog";
import { api } from "@/services/api";
import { toast } from "@/lib/toast";
import {
  type CatalogacaoCategoria,
  type CatalogacaoField,
  type CatalogacaoSchema,
  CATEGORIA_LABELS,
  buildMetadataFromCategories,
  findCatalogacaoSchema,
  getCatalogacaoOptionLabel,
  splitMetadataByCategories,
} from "@/components/custodia/catalogacaoSchemas";
import { extractVestigiosFromResponse } from "@/components/custodia/vestigiosResponse";

type Vestigio = {
  id: string;
  codigoScv: string;
  numeroVestigio?: string | null;
  numeroCaso?: string | null;
  categoria?: string | null;
  delegacia?: string | null;
  etiquetaCompleta: string;
  status: string;
  classeCatalogacao?: string | null;
  subclasseCatalogacao?: string | null;
  tipoCatalogacao?: string | null;
  schemaVersao?: string | null;
  metadadosGerais?: Record<string, string>;
  metadadosEspecificos?: Record<string, string>;
  createdAt: string;
};

const CATEGORIA_ORDEM: CatalogacaoCategoria[] = [
  "identificacao",
  "tecnicas",
  "periciais",
  "controle",
];

const extractLabelLine = (etiquetaCompleta: string, prefix: string) => {
  return (
    etiquetaCompleta
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith(prefix)) ?? ""
  );
};

const renderFieldInput = (
  field: CatalogacaoField,
  value: string,
  onChange: (value: string) => void,
) => {
  if (field.type === "textarea") {
    return (
      <Textarea
        id={field.name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
      />
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={field.name}>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={field.name}
      type={field.type}
      inputMode={field.type === "number" ? "numeric" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

const normalizeMetadataValues = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  );

const CatalogacaoVestigiosPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vestigios, setVestigios] = useState<Vestigio[]>([]);
  const [selectedVestigioId, setSelectedVestigioId] = useState<string | null>(
    null,
  );
  const [pendingVestigioId, setPendingVestigioId] = useState<string | null>(
    null,
  );
  const [categoryValues, setCategoryValues] = useState<
    Record<CatalogacaoCategoria, Record<string, string>>
  >({
    identificacao: {},
    tecnicas: {},
    periciais: {},
    controle: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const vestigioIdFromUrl = searchParams.get("vestigioId");
    if (vestigioIdFromUrl) {
      setPendingVestigioId(vestigioIdFromUrl);
    }
  }, [searchParams]);

  const fetchVestigios = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/vestigios", {
        params: { status: "catalogacao_pendente" },
      });
      const items = extractVestigiosFromResponse<Vestigio>(response.data);
      setVestigios(items);
      setSelectedVestigioId((current) => current ?? items[0]?.id ?? null);
    } catch (fetchError) {
      console.error("Erro ao carregar fila de catalogacao:", fetchError);
      setError("Não foi possível carregar os vestígios pendentes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVestigios();
  }, []);

  useEffect(() => {
    if (!pendingVestigioId || !vestigios.length) {
      return;
    }

    const target = vestigios.find((item) => item.id === pendingVestigioId);
    if (!target) {
      return;
    }

    setSelectedVestigioId(target.id);
    setPendingVestigioId(null);

    const params = new URLSearchParams(searchParams);
    params.delete("vestigioId");
    setSearchParams(params, { replace: true });
  }, [pendingVestigioId, searchParams, setSearchParams, vestigios]);

  const selectedVestigio = useMemo(
    () => vestigios.find((item) => item.id === selectedVestigioId) ?? null,
    [selectedVestigioId, vestigios],
  );

  const selectedSchema = useMemo(() => {
    if (!selectedVestigio) {
      return undefined;
    }

    return findCatalogacaoSchema({
      classeCatalogacao: selectedVestigio.classeCatalogacao,
      subclasseCatalogacao: selectedVestigio.subclasseCatalogacao,
      tipoCatalogacao: selectedVestigio.tipoCatalogacao,
    });
  }, [selectedVestigio]);

  useEffect(() => {
    if (!selectedVestigio || !selectedSchema) {
      setCategoryValues({
        identificacao: {},
        tecnicas: {},
        periciais: {},
        controle: {},
      });
      return;
    }

    const baseDefaults = splitMetadataByCategories(
      selectedSchema,
      selectedVestigio.metadadosGerais,
      selectedVestigio.metadadosEspecificos,
    );

    // Migra valores legados das etiquetas para os campos canônicos da planilha,
    // quando ainda não houver valor preenchido.
    const legacyDefaults: Record<
      CatalogacaoCategoria,
      Record<string, string>
    > = {
      identificacao: {
        codigoVestigio:
          baseDefaults.identificacao.codigoVestigio ??
          extractLabelLine(selectedVestigio.etiquetaCompleta, "VG-"),
        numeroCatalogacao:
          baseDefaults.identificacao.numeroCatalogacao ?? selectedVestigio.id,
        denominacaoVestigio:
          baseDefaults.identificacao.denominacaoVestigio ??
          (selectedVestigio.categoria ||
            selectedVestigio.tipoCatalogacao ||
            ""),
        localOrigem:
          baseDefaults.identificacao.localOrigem ??
          selectedVestigio.delegacia ??
          "",
      },
      tecnicas: {
        ...baseDefaults.tecnicas,
        tipoVestigio:
          baseDefaults.tecnicas.tipoVestigio ??
          selectedVestigio.tipoCatalogacao ??
          "",
      },
      periciais: { ...baseDefaults.periciais },
      controle: { ...baseDefaults.controle },
    };

    setCategoryValues(legacyDefaults);
  }, [selectedVestigioId, selectedVestigio, selectedSchema]);

  const handleFieldChange = (
    categoria: CatalogacaoCategoria,
    name: string,
    value: string,
  ) => {
    setCategoryValues((current) => ({
      ...current,
      [categoria]: { ...current[categoria], [name]: value },
    }));
  };

  const handleSave = async () => {
    if (!selectedVestigio || !selectedSchema) {
      return;
    }

    setSaving(true);

    try {
      const { metadadosGerais, metadadosEspecificos } =
        buildMetadataFromCategories(selectedSchema, categoryValues);

      await api.patch(`/vestigios/${selectedVestigio.id}`, {
        status: "catalogado",
        metadadosGerais: normalizeMetadataValues(metadadosGerais),
        metadadosEspecificos: normalizeMetadataValues(metadadosEspecificos),
      });

      toast.success(
        "Catalogação salva",
        "Vestígio encaminhado como catalogado.",
      );

      setVestigios((current) =>
        current.filter((item) => item.id !== selectedVestigio.id),
      );
      setSelectedVestigioId((current) => {
        if (current !== selectedVestigio.id) {
          return current;
        }

        const remaining = vestigios.filter(
          (item) => item.id !== selectedVestigio.id,
        );
        return remaining[0]?.id ?? null;
      });
      navigate(
        `/custodia/banco-vestigios?vestigioId=${encodeURIComponent(selectedVestigio.id)}`,
      );
    } catch (saveError) {
      console.error("Erro ao salvar catalogacao:", saveError);
      toast.error("Erro ao salvar", "Não foi possível concluir a catalogação.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCatalogacao = async () => {
    setClearing(true);

    try {
      await api.delete("/vestigios/catalogacao/pendentes");
      setVestigios([]);
      setSelectedVestigioId(null);
      setPendingVestigioId(null);
      setCategoryValues({
        identificacao: {},
        tecnicas: {},
        periciais: {},
        controle: {},
      });
      setClearDialogOpen(false);
      toast.success(
        "Fila esvaziada",
        "Os vestígios pendentes de catalogação foram removidos.",
      );
    } catch (clearError) {
      console.error("Erro ao esvaziar catalogacao:", clearError);
      toast.error("Erro ao esvaziar", "Não foi possível limpar a fila.");
    } finally {
      setClearing(false);
    }
  };

  const totalFields = selectedSchema
    ? CATEGORIA_ORDEM.reduce(
        (acc, cat) => acc + (selectedSchema.categories[cat]?.length ?? 0),
        0,
      )
    : 0;

  const filledFields = CATEGORIA_ORDEM.reduce(
    (acc, cat) =>
      acc +
      Object.values(categoryValues[cat] ?? {}).filter(
        (value) => value.trim() !== "",
      ).length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Catalogação de Vestígios
        </h1>
        <p className="text-muted-foreground">
          Organize e acompanhe a catalogação dos vestígios vinculados à
          custódia. A ficha segue a estrutura CCVC (4 categorias) definida na
          planilha de metadados de catalogação.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                  <ClipboardList className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <CardTitle>Fila pendente</CardTitle>
                  <CardDescription>
                    Vestígios aguardando preenchimento da ficha de catalogação.
                  </CardDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void fetchVestigios()}
                aria-label="Atualizar fila"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setClearDialogOpen(true)}
              disabled={loading || clearing || vestigios.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Esvaziar banco de catalogação
            </Button>

            {loading ? (
              <div className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                Carregando fila de catalogação...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : vestigios.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                Nenhum vestígio pendente de catalogação.
              </div>
            ) : (
              vestigios.map((vestigio) => {
                const isActive = vestigio.id === selectedVestigioId;
                const schema = findCatalogacaoSchema({
                  classeCatalogacao: vestigio.classeCatalogacao,
                  subclasseCatalogacao: vestigio.subclasseCatalogacao,
                  tipoCatalogacao: vestigio.tipoCatalogacao,
                });

                return (
                  <button
                    key={vestigio.id}
                    type="button"
                    onClick={() => setSelectedVestigioId(vestigio.id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {getCatalogacaoOptionLabel(schema) ||
                          vestigio.categoria ||
                          vestigio.codigoScv}
                      </p>
                      <Badge variant="secondary">Pendente</Badge>
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {extractLabelLine(vestigio.etiquetaCompleta, "VG-") ||
                        vestigio.codigoScv}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {vestigio.delegacia || "Sem local de origem"}
                    </p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Ficha de catalogação</CardTitle>
                <CardDescription>
                  {selectedSchema
                    ? getCatalogacaoOptionLabel(selectedSchema)
                    : "Selecione um vestígio pendente para preencher a ficha."}
                </CardDescription>
              </div>
              {selectedSchema ? (
                <Badge variant="outline" className="font-mono">
                  {filledFields}/{totalFields} campos
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedVestigio || !selectedSchema ? (
              <div className="rounded-lg border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                Nenhum vestígio selecionado no momento.
              </div>
            ) : (
              <div className="space-y-4">
                {CATEGORIA_ORDEM.map((categoria) => {
                  const fields = selectedSchema.categories[categoria] ?? [];
                  if (fields.length === 0) return null;

                  return (
                    <details
                      key={categoria}
                      open={categoria === "identificacao"}
                      className="group rounded-lg border border-border/80 bg-background"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/70">
                        <span>{CATEGORIA_LABELS[categoria]}</span>
                        <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                          {fields.length} campos
                          <span className="transition group-open:rotate-180">
                            ▾
                          </span>
                        </span>
                      </summary>
                      <div className="grid gap-4 p-4 md:grid-cols-2">
                        {fields.map((field) => (
                          <div
                            key={field.name}
                            className={
                              field.type === "textarea"
                                ? "space-y-1 md:col-span-2"
                                : "space-y-1"
                            }
                          >
                            <Label htmlFor={field.name}>
                              {field.label}
                              {field.required ? (
                                <span className="ml-1 text-destructive">*</span>
                              ) : null}
                            </Label>
                            {renderFieldInput(
                              field,
                              categoryValues[categoria]?.[field.name] ?? "",
                              (value) =>
                                handleFieldChange(categoria, field.name, value),
                            )}
                            {field.helpText ? (
                              <p className="text-xs text-muted-foreground">
                                {field.helpText}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar catalogação"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EnhancedConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearCatalogacao}
        title="Esvaziar banco de catalogação"
        description="Esta ação remove os vestígios que ainda estão pendentes na fila de catalogação."
        confirmText="Esvaziar fila"
        cancelText="Cancelar"
        variant="danger"
        isLoading={clearing}
        confirmationType="text"
        confirmationKeyword="LIMPAR"
        warningList={[
          "Remover todos os vestígios pendentes de catalogação.",
          "Preservar vestígios já catalogados e vestígios ativos fora da fila.",
          "Exigir nova criação de etiqueta para esses itens, se necessário.",
        ]}
      />
    </div>
  );
};

export default CatalogacaoVestigiosPage;
