import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Search,
  Filter,
  Trash2,
  Eye,
  RefreshCw,
  Printer,
  CheckSquare,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { api } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

type Vestigio = {
  id: string;
  codigoScv: string;
  classePrincipal: string;
  grupoCodigo: string;
  subdivisaoCodigo: string;
  facetas: string[];
  facetasDescricoes: Record<string, string>;
  numeroVestigio: string;
  numeroCaso: string;
  categoria: string;
  delegacia: string;
  mesReferencia: string;
  etiquetaCompleta: string;
  status: string;
  observacoes: string;
  criadoPor: {
    id: string;
    nome: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

const BancoVestigios: React.FC = () => {
  const [vestigios, setVestigios] = useState<Vestigio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [selectedVestigio, setSelectedVestigio] = useState<Vestigio | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(
    new Set(),
  );
  const [printLayout, setPrintLayout] = useState<"one-per-page" | "multiple">(
    "multiple",
  );

  const fetchVestigios = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (categoriaFilter !== "all") {
        params.categoria = categoriaFilter;
      }

      const response = await api.get("/vestigios", { params });

      // A API retorna { success, data, ... } então pegamos response.data.data
      const vestígiosData = response.data.data || response.data;

      // Garantir que sempre temos um array
      const data = Array.isArray(vestígiosData) ? vestígiosData : [];
      setVestigios(data);
    } catch (error) {
      console.error("Erro ao carregar vestígios:", error);
      toast.error("Erro", "Não foi possível carregar os vestígios");
      setVestigios([]); // Define array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoriaFilter]);

  useEffect(() => {
    fetchVestigios();
  }, [fetchVestigios]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este vestígio?")) {
      return;
    }

    try {
      await api.delete(`/vestigios/${id}`);
      toast.success("Sucesso", "Vestígio removido com sucesso");
      fetchVestigios();
    } catch (error) {
      console.error("Erro ao remover vestígio:", error);
      toast.error("Erro", "Não foi possível remover o vestígio");
    }
  };

  const handleViewDetails = (vestigio: Vestigio) => {
    setSelectedVestigio(vestigio);
    setDialogOpen(true);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedForPrint((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedForPrint.size === filteredVestigios.length) {
      setSelectedForPrint(new Set());
    } else {
      setSelectedForPrint(new Set(filteredVestigios.map((v) => v.id)));
    }
  };

  const handlePrintSelected = () => {
    if (selectedForPrint.size === 0) {
      toast.error("Erro", "Selecione pelo menos um vestígio para imprimir");
      return;
    }

    const selectedVestigios = vestigios.filter((v) =>
      selectedForPrint.has(v.id),
    );

    const QR_CODE_DATA_URL =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA/ElEQVRYhd2Y0Q6FMAhD4cv9c7jSdpqZ+G4vLotynpqxjhnxGkcj8F6R52Civk2QazwkNYn0JaMTSlvk1Fr2ZOYahX9CZlCnO1ElziB51qgXkVNgZ0nn7iFe5Ir5yi1jSQ7qXGaeTbllTOB7M7MIl52bEi4a5jlmCyh10hoSmASML5ZHhJzCkqhrkDtIKjuhDxOC0O7p27RNScTlCMqNJ7ASLQm9beaUYdMQXAlbA3Q8Okt5CnmSFSzHvHeXKTkoLaSQHY/82pJIJ9avpHTrr91IsxtdYq9aNCen1tQPhNru26ZEhah1Mybyie5O/d2xJiy86LsUcaVzJa/xAxr8HJc3ZfzyAAAAAElFTkSuQmCC";

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      toast.error("Erro", "Não foi possível abrir janela de impressão");
      return;
    }

    const isOnePerPage = printLayout === "one-per-page";

    const etiquetasHtml = selectedVestigios
      .map((vestigio, index) => {
        const needsPageBreak =
          isOnePerPage && index < selectedVestigios.length - 1;

        return `
        <div class="etiqueta-container ${needsPageBreak ? "page-break" : ""}">
          <div class="etiqueta">
            <pre>${vestigio.etiquetaCompleta}</pre>
            <img src="${QR_CODE_DATA_URL}" alt="QR code" />
          </div>
        </div>
      `;
      })
      .join("");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão de Etiquetas - ${selectedForPrint.size} Vestígios</title>
          <style>
            @page { 
              margin: ${isOnePerPage ? "20mm" : "10mm"}; 
              size: A4;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              padding: ${isOnePerPage ? "0" : "20px"};
              color: #111827;
              background: white;
            }
            .etiqueta-container {
              display: flex;
              justify-content: center;
              align-items: center;
              ${isOnePerPage ? "min-height: 100vh;" : "margin-bottom: 30px;"}
            }
            .etiqueta {
              display: inline-grid;
              gap: 16px;
              grid-template-columns: auto auto;
              align-items: center;
              padding: 20px 40px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: #fff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            pre {
              white-space: pre-wrap;
              font-family: 'Courier New', Courier, monospace;
              font-size: 14px;
              line-height: 1.6;
              margin: 0;
              text-align: center;
              font-weight: 500;
            }
            img {
              width: 120px;
              height: 120px;
              object-fit: contain;
            }
            .page-break {
              page-break-after: always;
            }
            @media print {
              body {
                padding: 0;
              }
              .etiqueta {
                box-shadow: none;
                border-color: #000;
              }
            }
          </style>
        </head>
        <body>
          ${etiquetasHtml}
          <script>
            window.addEventListener('load', function () {
              setTimeout(() => window.print(), 250);
            });
            window.addEventListener('afterprint', function () {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredVestigios = useMemo(() => {
    // Garantir que vestigios é sempre um array
    if (!Array.isArray(vestigios)) {
      console.error("vestigios não é um array:", vestigios);
      return [];
    }

    return vestigios.filter((vestigio) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        vestigio.codigoScv?.toLowerCase().includes(searchLower) ||
        vestigio.numeroVestigio?.toLowerCase().includes(searchLower) ||
        vestigio.numeroCaso?.toLowerCase().includes(searchLower) ||
        vestigio.categoria?.toLowerCase().includes(searchLower) ||
        vestigio.delegacia?.toLowerCase().includes(searchLower)
      );
    });
  }, [vestigios, searchTerm]);

  const categorias = useMemo(() => {
    if (!Array.isArray(vestigios)) return [];
    return Array.from(
      new Set(vestigios.map((v) => v.categoria).filter(Boolean)),
    );
  }, [vestigios]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Banco de Vestígios</CardTitle>
          <CardDescription>
            Gerencie todos os vestígios balísticos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por código SCV, vestígio, caso, categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:w-48">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:w-48">
              <Label htmlFor="categoria-filter">Categoria</Label>
              <Select
                value={categoriaFilter}
                onValueChange={setCategoriaFilter}
              >
                <SelectTrigger id="categoria-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchVestigios}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Controles de impressão em massa */}
          {selectedForPrint.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {selectedForPrint.size} vestígio(s) selecionado(s)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Escolha o layout de impressão e clique em imprimir
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={printLayout}
                  onValueChange={(value: "one-per-page" | "multiple") =>
                    setPrintLayout(value)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple">
                      Múltiplas por página
                    </SelectItem>
                    <SelectItem value="one-per-page">Uma por página</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handlePrintSelected} size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Selecionados
                </Button>

                <Button
                  onClick={() => setSelectedForPrint(new Set())}
                  variant="outline"
                  size="sm"
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedForPrint.size === filteredVestigios.length &&
                        filteredVestigios.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Código SCV</TableHead>
                  <TableHead>Vestígio</TableHead>
                  <TableHead>Caso</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Delegacia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredVestigios.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum vestígio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVestigios.map((vestigio) => (
                    <TableRow key={vestigio.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedForPrint.has(vestigio.id)}
                          onCheckedChange={() =>
                            handleToggleSelection(vestigio.id)
                          }
                          aria-label={`Selecionar ${vestigio.codigoScv}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {vestigio.codigoScv}
                      </TableCell>
                      <TableCell>{vestigio.numeroVestigio || "-"}</TableCell>
                      <TableCell>{vestigio.numeroCaso || "-"}</TableCell>
                      <TableCell>{vestigio.categoria || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {vestigio.delegacia || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vestigio.status === "ativo"
                              ? "default"
                              : vestigio.status === "arquivado"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {vestigio.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(vestigio.createdAt).toLocaleDateString(
                          "pt-BR",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(vestigio)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(vestigio.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: {filteredVestigios.length} vestígio(s)
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Vestígio</DialogTitle>
            <DialogDescription>
              Informações completas do vestígio cadastrado
            </DialogDescription>
          </DialogHeader>
          {selectedVestigio && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Código SCV</Label>
                  <p className="font-mono">{selectedVestigio.codigoScv}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge>{selectedVestigio.status}</Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Número Vestígio
                  </Label>
                  <p>{selectedVestigio.numeroVestigio || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Número Caso</Label>
                  <p>{selectedVestigio.numeroCaso || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Categoria</Label>
                  <p>{selectedVestigio.categoria || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Mês Referência
                  </Label>
                  <p>{selectedVestigio.mesReferencia || "-"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Delegacia</Label>
                  <p>{selectedVestigio.delegacia || "-"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">
                    Etiqueta Completa
                  </Label>
                  <pre className="mt-2 rounded-md border bg-muted p-3 font-mono text-sm">
                    {selectedVestigio.etiquetaCompleta}
                  </pre>
                </div>
                {selectedVestigio.observacoes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="mt-1">{selectedVestigio.observacoes}</p>
                  </div>
                )}
                <div className="col-span-2 border-t pt-4">
                  <Label className="text-muted-foreground">
                    Cadastrado por
                  </Label>
                  <p>
                    {selectedVestigio.criadoPor?.nome || "Sistema"} em{" "}
                    {new Date(selectedVestigio.createdAt).toLocaleString(
                      "pt-BR",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BancoVestigios;
