import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Copy, Printer, Database, CheckCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { api } from "@/services/api";

const QR_CODE_TARGET_URL = "http://10.9.233.136:3001/custodia";

const QR_CODE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA/ElEQVRYhd2Y0Q6FMAhD4cv9c7jSdpqZ+G4vLotynpqxjhnxGkcj8F6R52Civk2QazwkNYn0JaMTSlvk1Fr2ZOYahX9CZlCnO1ElziB51qgXkVNgZ0nn7iFe5Ir5yi1jSQ7qXGaeTbllTOB7M7MIl52bEi4a5jlmCyh10hoSmASML5ZHhJzCkqhrkDtIKjuhDxOC0O7p27RNScTlCMqNJ7ASLQm9beaUYdMQXAlbA3Q8Okt5CnmSFSzHvHeXKTkoLaSQHY/82pJIJ9avpHTrr91IsxtdYq9aNCen1tQPhNru26ZEhah1Mybyie5O/d2xJiy86LsUcaVzJa/xAxr8HJc3ZfzyAAAAAElFTkSuQmCC";

type CduFacet = {
  code: string;
  label: string;
  appliesTo?: string[];
  requiresDescription?: boolean;
};

type CduSubdivision = {
  code: string;
  label: string;
};

type CduGroup = {
  code: string;
  label: string;
  subdivisions?: CduSubdivision[];
  facets?: CduFacet[];
};

type CduClass = {
  code: string;
  label: string;
  groups: CduGroup[];
};

const cduClasses: CduClass[] = [
  {
    code: "100",
    label: "Biológico",
    groups: [
      {
        code: "100.1",
        label: "Sangue",
        subdivisions: [
          { code: "100.1.11", label: "Sangue líquido" },
          { code: "100.1.12", label: "Sangue seco" },
          { code: "100.1.13", label: "Sangue disperso" },
        ],
        facets: [
          {
            code: "(A)",
            label: "Amostra para exame de DNA",
            appliesTo: ["100.1.11", "100.1.12", "100.1.13"],
          },
          {
            code: "(B)",
            label: "Exame toxicológico",
            appliesTo: ["100.1.11", "100.1.12", "100.1.13"],
          },
        ],
      },
    ],
  },
  {
    code: "200",
    label: "Documentoscopia",
    groups: [
      {
        code: "200.1",
        label: "Documento de papel",
        subdivisions: [
          { code: "200.1.1", label: "Documento original" },
          { code: "200.1.2", label: "Documento falso" },
        ],
        facets: [
          {
            code: "(X)",
            label: "Documento com indícios de falsificação",
            appliesTo: ["200.1.2"],
          },
        ],
      },
    ],
  },
  {
    code: "300",
    label: "Drogas",
    groups: [
      {
        code: "300.1",
        label: "Entorpecente",
        subdivisions: [
          { code: "300.1.1", label: "Maconha" },
          { code: "300.1.2", label: "Cocaína" },
          { code: "300.1.3", label: "Outros entorpecentes" },
        ],
        facets: [
          {
            code: "(D)",
            label: "Droga para exame toxicológico",
            appliesTo: ["300.1.1", "300.1.2", "300.1.3"],
          },
        ],
      },
    ],
  },

  // =========================
  // 900 – Vestígios Balísticos
  // =========================
  {
    code: "900",
    label: "Vestígios Balísticos (Custódia PCIRN)",
    groups: [
      // NÍVEL 1
      {
        code: "900",
        label: "VESTÍGIOS BALÍSTICOS",
        facets: [
          {
            code: "[Descrição]",
            label:
              "Conjunto de materiais, armas, munições, projéteis e resíduos provenientes de disparos de armas de fogo, coletados em locais de crime ou exames laboratoriais.",
            requiresDescription: true,
          },
        ],
      },

      // NÍVEL 2 — 901
      {
        code: "901",
        label: "Armas de fogo e partes correlatas",
        subdivisions: [
          // NÍVEL 3
          { code: "901.1", label: "Armas de fogo completas" },

          // NÍVEL 4 — 901.11 (curta) + (1)(2)
          { code: "901.11", label: "Arma de fogo curta" },

          // NÍVEL 4 — 901.12 (longa) + (3)…(8)
          { code: "901.12", label: "Arma de fogo longa" },

          // 901.2 / 901.21 / 901.22
          {
            code: "901.2",
            label: "Armas artesanais, adulteradas ou modificadas",
          },
          { code: "901.21", label: "Caseira" },
          { code: "901.22", label: "Com alteração significativa" },

          // 901.3 (partes) e seus itens
          { code: "901.3", label: "Partes e componentes" },
          { code: "901.31", label: "Cano" },
          { code: "901.32", label: "Tambor" },
          { code: "901.33", label: "Ferrolho" },
          { code: "901.34", label: "Gatilho" },

          // 901.4
          { code: "901.4", label: "Fragmentos ou peças isoladas de arma" },
        ],
        facets: [
          // Descrição do grupo
          {
            code: "[Descrição]",
            label: "Vestígios de maior volume e peso.",
            requiresDescription: true,
          },

          // NÍVEL 4 — 901.11
          { code: "(1)", label: "Pistola", appliesTo: ["901.11"] },
          { code: "(2)", label: "Revólver", appliesTo: ["901.11"] },

          // NÍVEL 4 — 901.12
          { code: "(3)", label: "Espingarda", appliesTo: ["901.12"] },
          { code: "(4)", label: "Fuzil", appliesTo: ["901.12"] },
          { code: "(5)", label: "Rifle", appliesTo: ["901.12"] },
          { code: "(6)", label: "Carabina", appliesTo: ["901.12"] },
          { code: "(7)", label: "Metralhadora", appliesTo: ["901.12"] },
          { code: "(8)", label: "Submetralhadora", appliesTo: ["901.12"] },
        ],
      },

      // NÍVEL 2 — 902
      {
        code: "902",
        label: "Cartuchos e estojos",
        facets: [
          {
            code: "[Descrição]",
            label:
              "Vestígios médios, armazenados individualmente em cápsulas ou envelopes.",
            requiresDescription: true,
          },
        ],
        subdivisions: [
          { code: "902.1", label: "Cartuchos completos (não deflagrados)" },
          { code: "902.2", label: "Estojos deflagrados" },
          { code: "902.3", label: "Estojos deformados ou fragmentados" },
          { code: "902.4", label: "Conjuntos de estojos de um mesmo caso" },
        ],
      },

      // NÍVEL 2 — 903
      {
        code: "903",
        label: "Projéteis",
        facets: [
          {
            code: "[Descrição]",
            label:
              "Corpos metálicos e seus fragmentos, coletados em locais, vítimas ou alvos.",
            requiresDescription: true,
          },
        ],
        subdivisions: [
          { code: "903.1", label: "Projéteis íntegros" },
          { code: "903.11", label: "Ponta ojival" },
          { code: "903.12", label: "ponta plana" },
          { code: "903.13", label: "ponta oca" },
          { code: "903.14", label: "perfurante" },
          { code: "903.15", label: "traçante" },
          { code: "903.16", label: "fragmentável" },

          { code: "903.2", label: "Projéteis deformados" },
          { code: "903.21", label: "expandido" },
          { code: "903.22", label: "achatado" },
          { code: "903.23", label: "fragmentando" },
          { code: "903.24", label: "raspado" },
          { code: "903.25", label: "ricocheteado" },
          { code: "903.26", label: "fundido (ou derretido parcialmente)" },
          { code: "903.27", label: "encamisado deformado" },
          {
            code: "903.28",
            label: "projétil sem jaqueta (chumbo nu ou deformado)",
          },

          { code: "903.3", label: "Fragmentos de projéteis" },

          { code: "903.4", label: "Núcleos, camisas e jaquetas de projéteis" },
          { code: "903.41", label: "Núcleos" },
          { code: "903.42", label: "camisas" },
          { code: "903.43", label: "jaquetas de projéteis" },
        ],
      },

      // NÍVEL 2 — 904
      {
        code: "904",
        label: "Componentes de munição",
        facets: [
          {
            code: "[Descrição]",
            label: "Partes isoladas de munição, geralmente pequenas e leves.",
            requiresDescription: true,
          },
        ],
        subdivisions: [
          { code: "904.1", label: "Espoletas" },
          { code: "904.2", label: "Pólvora e resíduos propelentes" },
          { code: "904.3", label: "Fragmentos metálicos e núcleos de chumbo" },
          { code: "904.4", label: "Combinações de componentes" },
        ],
      },

      // NÍVEL 2 — 905
      {
        code: "905",
        label: "Vestígios de disparo e impacto",
        facets: [
          {
            code: "[Descrição]",
            label: "Materiais impactados ou contaminados por disparos.",
            requiresDescription: true,
          },
        ],
        subdivisions: [
          { code: "905.1", label: "Perfurações e marcas de impacto" },

          {
            code: "905.2",
            label:
              "Fragmentos de material atingido (vidro, metal, madeira etc.)",
          },
          { code: "905.21", label: "vidro" },
          { code: "905.22", label: "metal" },
          { code: "905.23", label: "alumínio" },
          { code: "905.24", label: "madeira" },
          { code: "905.25", label: "plástico" },
          { code: "905.26", label: "têxtil" },

          {
            code: "905.3",
            label: "Vestígios aderidos a superfícies ou veículos",
          },
          { code: "905.4", label: "Vestígios provenientes de ricochete" },
        ],
      },

      // NÍVEL 2 — 906
      {
        code: "906",
        label: "Vestígios laboratoriais e comparativos",
        facets: [
          {
            code: "[Descrição]",
            label: "Amostras e padrões usados em análises técnicas.",
            requiresDescription: true,
          },
        ],
        subdivisions: [
          { code: "906.1", label: "Projéteis e estojos padrão de teste" },
          { code: "906.2", label: "Matrizes e microimpressões comparativas" },
          { code: "906.3", label: "Vestígios simulados ou de calibração" },
        ],
      },

      // NÍVEL 2 — 907
      {
        code: "907",
        label: "Resíduos e microvestígios",
        facets: [
          {
            code: "[Descrição]",
            label:
              "Os menores vestígios, geralmente coletados com swab, fita ou aspiração.",
            requiresDescription: true,
          },
        ],
        subdivisions: [
          {
            code: "907.1",
            label: "Resíduos de disparo (GSR – Gunshot Residue)",
          },
          {
            code: "907.2",
            label: "Micropartículas metálicas (chumbo, cobre, bário etc.)",
          },
          {
            code: "907.3",
            label: "Depósitos de pólvora em tecidos ou objetos",
          },
          {
            code: "907.4",
            label: "Vestígios combinados (mistos ou indeterminados)",
          },
        ],
      },
    ],
  },
];

const delegacias = [
  "1ª DP (PLANTÃO - ZONA SUL)",
  "2ª DP (PLANTÃO - ZONA NORTE)",
  "3ª DP (PLANTÃO - PARNAMIRIM)",
  "1ª DP (NATAL)",
  "2ª DP (NATAL)",
  "3ª DP (NATAL)",
  "4ª DP (NATAL)",
  "5ª DP (NATAL)",
  "6ª DP (NATAL)",
  "7ª DP (NATAL)",
  "8ª DP (NATAL)",
  "9ª DP (NATAL)",
  "10ª DP (NATAL)",
  "11ª DP (NATAL)",
  "12ª DP (NATAL)",
  "13ª DP (NATAL)",
  "14ª DP (NATAL - RODOVIÁRIA)",
  "15ª DP (NATAL)",
  "16ª DP (NATAL)",
  "17ª DP (PARNAMIRIM)",
  "18ª DP (PARNAMIRIM)",
  "20ª DP (MACAÍBA)",
  "21ª DP (SÃO GONÇALO DO AMARANTE)",
  "22ª DP (CEARÁ-MIRIM)",
  "23ª DP (EXTREMOZ)",
  "24ª DP (SÃO JOSÉ DE MIPIBU)",
  "25ª DP (NÍSIA FLORESTA)",
  "27ª DP (MONTE ALEGRE)",
  "29ª DP (LELMO MARINHO)",
  "30ª DP (BOM JESUS)",
  "31ª DP (PUREZA)",
  "32ª DP (TAIPU)",
];

const getInitialMonthValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${year}-${month}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const CustodiaBalistica: React.FC = () => {
  const [mainClass, setMainClass] = useState<string>(cduClasses[0]?.code ?? "");
  const [groupCode, setGroupCode] = useState<string>("");
  const [subdivisionCode, setSubdivisionCode] = useState<string>("");
  const [selectedFacets, setSelectedFacets] = useState<string[]>([]);
  const [vestigioNumber, setVestigioNumber] = useState<string>("");
  const [casoNumber, setCasoNumber] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [delegacia, setDelegacia] = useState<string>("");
  const [facetDescriptions, setFacetDescriptions] = useState<
    Record<string, string>
  >({});
  const [referenceMonth, setReferenceMonth] =
    useState<string>(getInitialMonthValue);
  const [copied, setCopied] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const selectedClass = useMemo(
    () => cduClasses.find((cduClass) => cduClass.code === mainClass),
    [mainClass],
  );

  const selectedGroup = useMemo(
    () => selectedClass?.groups.find((group) => group.code === groupCode),
    [selectedClass, groupCode],
  );

  const availableSubdivisions = selectedGroup?.subdivisions ?? [];

  const availableFacets = useMemo(() => {
    if (!selectedGroup?.facets?.length) return [];

    if (!subdivisionCode) {
      return selectedGroup.facets.filter((facet) => !facet.appliesTo?.length);
    }

    return selectedGroup.facets.filter((facet) => {
      if (!facet.appliesTo?.length) return true;
      return facet.appliesTo.includes(subdivisionCode);
    });
  }, [selectedGroup, subdivisionCode]);

  useEffect(() => {
    setGroupCode("");
    setSubdivisionCode("");
    setSelectedFacets([]);
  }, [mainClass]);

  useEffect(() => {
    setSubdivisionCode("");
    setSelectedFacets([]);
  }, [groupCode]);

  useEffect(() => {
    if (!availableFacets.length) {
      setSelectedFacets([]);
    } else {
      setSelectedFacets((previous) =>
        previous.filter((code) =>
          availableFacets.some((facet) => facet.code === code),
        ),
      );
    }
  }, [availableFacets]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timeout);
  }, [saved]);

  const handleToggleFacet = useCallback((facet: CduFacet, checked: boolean) => {
    setSelectedFacets((prev) => {
      if (checked) {
        if (prev.includes(facet.code)) return prev;
        return [...prev, facet.code];
      }
      return prev.filter((code) => code !== facet.code);
    });

    if (!checked && facet.requiresDescription) {
      setFacetDescriptions((prev) => {
        const updated = { ...prev };
        delete updated[facet.code];
        return updated;
      });
    }
  }, []);

  const handleFacetDescriptionChange = useCallback(
    (facetCode: string, value: string) => {
      setFacetDescriptions((prev) => ({
        ...prev,
        [facetCode]: value,
      }));
    },
    [],
  );

  const monthSuffix = useMemo(() => {
    if (!referenceMonth) return "";
    const [year, month] = referenceMonth.split("-");
    if (!year || !month) return "";
    return `${month}${year.slice(-2)}`;
  }, [referenceMonth]);

  const classificationCode = useMemo(() => {
    const base =
      subdivisionCode || groupCode || mainClass || cduClasses[0]?.code || "";

    if (!base) return "";

    const effectiveFacets = selectedFacets.filter((code) => {
      const facetMeta = availableFacets.find((facet) => facet.code === code);
      return !facetMeta?.requiresDescription;
    });

    if (!effectiveFacets.length) {
      return base;
    }

    return `${base}${effectiveFacets.join("")}`;
  }, [subdivisionCode, groupCode, mainClass, selectedFacets, availableFacets]);

  const buildLineWithSuffix = useCallback(
    (code: string) => {
      if (!code) return "";
      const trimmed = code.trim();
      if (!trimmed) return "";
      if (!monthSuffix) return trimmed;

      const suffixPattern = new RegExp(`-${monthSuffix}$`);
      if (suffixPattern.test(trimmed)) {
        return trimmed;
      }

      return `${trimmed}-${monthSuffix}`;
    },
    [monthSuffix],
  );

  const descriptionLines = useMemo(() => {
    return selectedFacets
      .map((code) => {
        const facetMeta = availableFacets.find((facet) => facet.code === code);
        if (!facetMeta?.requiresDescription) return "";
        const value = facetDescriptions[code]?.trim();
        return value ? `Descrição: ${value}` : "";
      })
      .filter(Boolean);
  }, [selectedFacets, availableFacets, facetDescriptions]);

  const labelPreview = useMemo(() => {
    const categoryLine = categoria.trim();
    const delegaciaLine = delegacia.trim();
    const lines = [
      classificationCode,
      vestigioNumber ? buildLineWithSuffix(`VG-${vestigioNumber}`) : "",
      casoNumber ? buildLineWithSuffix(`CA-${casoNumber}`) : "",
      categoryLine,
      delegaciaLine,
      ...descriptionLines,
    ].filter(Boolean);

    return lines.join("\n");
  }, [
    classificationCode,
    vestigioNumber,
    casoNumber,
    categoria,
    delegacia,
    buildLineWithSuffix,
    descriptionLines,
  ]);

  const handleCopy = useCallback(async () => {
    if (!labelPreview) return;

    try {
      await navigator.clipboard.writeText(labelPreview);
      setCopied(true);
    } catch (error) {
      console.error("Erro ao copiar etiqueta:", error);
    }
  }, [labelPreview]);

  const handlePrint = useCallback(() => {
    if (!labelPreview) return;

    const printable = escapeHtml(labelPreview);
    const printWindow = window.open("", "_blank", "width=600,height=400");

    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta CDU</title>
          <style>
            @page { margin: 16mm; }
            body {
               font-family: 'Inter', system-ui, sans-serif;
              padding: 24px;
              color: #111827;
            }
            .preview {
              display: inline-grid;
              gap: 12px;
              grid-template-columns: auto auto;
              align-items: center;
              margin: 0 auto;
              padding: 16px 32px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              background: #fff;
            }
            pre {
              white-space: pre-wrap;
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              text-align: center;
            }
            img {
              width: 110px;
              height: 110px;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="preview">
            <pre>${printable}</pre>
            <img src="${QR_CODE_DATA_URL}" alt="QR code para custodia" />
          </div>
          <script>
            window.addEventListener('load', function () {
              window.print();
            });
            window.addEventListener('afterprint', function () {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [labelPreview]);

  const handleSaveToDatabase = useCallback(async () => {
    if (!labelPreview || !classificationCode) {
      toast.error("Erro", "Preencha os campos necessários antes de salvar");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        codigoScv: classificationCode,
        classePrincipal: mainClass,
        grupoCodigo: groupCode || null,
        subdivisaoCodigo: subdivisionCode || null,
        facetas: selectedFacets,
        facetasDescricoes: facetDescriptions,
        numeroVestigio: vestigioNumber || null,
        numeroCaso: casoNumber || null,
        categoria: categoria || null,
        delegacia: delegacia || null,
        mesReferencia: referenceMonth || null,
        etiquetaCompleta: labelPreview,
        status: "ativo",
      };

      await api.post("/vestigios", payload);

      setSaved(true);
      toast.success("Sucesso", "Vestígio salvo no banco de dados com sucesso!");

      // Limpar o formulário após 1.5 segundos para dar tempo de ver a mensagem de sucesso
      setTimeout(() => {
        // Resetar campos de número
        setVestigioNumber("");
        setCasoNumber("");

        // Resetar seleções
        setMainClass("");
        setGroupCode("");
        setSubdivisionCode("");
        setSelectedFacets([]);
        setFacetDescriptions({});

        // Resetar categoria e delegacia (manter referenceMonth para facilitar)
        setCategoria("");
        setDelegacia("");

        // Resetar estado de salvamento
        setSaved(false);
      }, 1500);
    } catch (error: unknown) {
      console.error("Erro ao salvar vestígio:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Não foi possível salvar o vestígio"
        : "Não foi possível salvar o vestígio";
      toast.error("Erro ao salvar", message);
    } finally {
      setSaving(false);
    }
  }, [
    labelPreview,
    classificationCode,
    mainClass,
    groupCode,
    subdivisionCode,
    selectedFacets,
    facetDescriptions,
    vestigioNumber,
    casoNumber,
    categoria,
    delegacia,
    referenceMonth,
  ]);

  const referenceSuffixPreview = monthSuffix ? `-${monthSuffix}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etiquetas SCV de Custódia Balística</CardTitle>
        <CardDescription>
          Configure a classificação e gere etiquetas padronizadas para os
          vestígios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertTitle>
            Classificação SCV (Sistema de Classificação de Vestígios)
          </AlertTitle>
          <AlertDescription>
            Selecione o número SCV conforme o tipo de material e informe os
            identificadores do vestígio e do caso. A etiqueta será montada
            automaticamente no formato:
            <br />
            <span className="font-mono text-sm">
              901.1(2)
              <br />
              VG-4102-1025
              <br />
              CA-4305-1025
              <br />
              BALIS
              <br />
              3º DP (NATAL)
            </span>
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <section className="space-y-4 rounded-lg border border-dashed border-border/80 p-4">
              <header>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Seleção SCV
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escolha a classe principal e os níveis adequados ao vestígio.
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cdu-classe">Classe principal</Label>
                  <Select
                    value={mainClass}
                    onValueChange={(value) => setMainClass(value)}
                  >
                    <SelectTrigger id="cdu-classe">
                      <SelectValue placeholder="Selecione a classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {cduClasses.map((cduClass) => (
                        <SelectItem key={cduClass.code} value={cduClass.code}>
                          {cduClass.code} - {cduClass.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cdu-grupo">Nível 1</Label>
                  <Select
                    disabled={!selectedClass}
                    value={groupCode}
                    onValueChange={(value) => setGroupCode(value)}
                  >
                    <SelectTrigger id="cdu-grupo">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedClass?.groups ?? []).map((group) => (
                        <SelectItem key={group.code} value={group.code}>
                          {group.code} - {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cdu-subdivisao">Nível 2</Label>
                  <Select
                    disabled={!availableSubdivisions.length}
                    value={subdivisionCode}
                    onValueChange={(value) => setSubdivisionCode(value)}
                  >
                    <SelectTrigger id="cdu-subdivisao">
                      <SelectValue placeholder="Selecione a subdivisao" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubdivisions.map((subdivision) => (
                        <SelectItem
                          key={subdivision.code}
                          value={subdivision.code}
                        >
                          {subdivision.code} - {subdivision.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!!availableFacets.length && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Complementos aplicaveis
                  </p>
                  <div className="space-y-2">
                    {availableFacets.map((facet) => (
                      <label
                        key={facet.code}
                        className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/30 p-3"
                      >
                        <Checkbox
                          checked={selectedFacets.includes(facet.code)}
                          onCheckedChange={(checked) =>
                            handleToggleFacet(facet, !!checked)
                          }
                        />
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {facet.code} - {facet.label}
                            </p>
                            {facet.appliesTo?.length ? (
                              <p className="text-xs text-muted-foreground">
                                Disponível para: {facet.appliesTo.join(", ")}
                              </p>
                            ) : null}
                          </div>
                          {facet.requiresDescription &&
                            selectedFacets.includes(facet.code) && (
                              <Textarea
                                value={facetDescriptions[facet.code] ?? ""}
                                onChange={(event) =>
                                  handleFacetDescriptionChange(
                                    facet.code,
                                    event.target.value,
                                  )
                                }
                                placeholder="Descreva o vestígio ou observações relevantes"
                                rows={2}
                              />
                            )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-lg border border-border/80 p-4">
              <header>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Identificadores
                </h3>
                <p className="text-sm text-muted-foreground">
                  Informe os códigos base. O sufixo do mês/ano será adicionado
                  automaticamente como
                  <code className="ml-1 font-mono text-xs">
                    {referenceSuffixPreview}
                  </code>
                  .
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="codigo-vestigio">
                    Código do vestígio{" "}
                    <span className="text-xs text-muted-foreground">
                      (prefixo VG aplicado automaticamente)
                    </span>
                  </Label>
                  <Input
                    id="codigo-vestigio"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 4102"
                    value={vestigioNumber}
                    onChange={(event) =>
                      setVestigioNumber(event.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo-caso">
                    Código do caso{" "}
                    <span className="text-xs text-muted-foreground">
                      (prefixo CA aplicado automaticamente)
                    </span>
                  </Label>
                  <Input
                    id="codigo-caso"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 4305"
                    value={casoNumber}
                    onChange={(event) =>
                      setCasoNumber(event.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    type="text"
                    placeholder="Ex: BALIS"
                    value={categoria}
                    onChange={(event) => setCategoria(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delegacia">Delegacia</Label>
                  <Select
                    value={delegacia}
                    onValueChange={(value) => setDelegacia(value)}
                  >
                    <SelectTrigger id="delegacia">
                      <SelectValue placeholder="Selecione a delegacia" />
                    </SelectTrigger>
                    <SelectContent>
                      {delegacias.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mes-referencia">Mes/ano da etiqueta</Label>
                  <Input
                    id="mes-referencia"
                    type="month"
                    value={referenceMonth}
                    onChange={(event) => setReferenceMonth(event.target.value)}
                  />
                  {monthSuffix && (
                    <p className="text-xs text-muted-foreground">
                      Prévia do sufixo aplicado:{" "}
                      <code className="font-mono">-{monthSuffix}</code>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Prévia do código SCV</Label>
                  <Input
                    readOnly
                    value={classificationCode || "Selecione a estrutura CDU"}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4 rounded-lg border border-border/80 bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pré-visualização da etiqueta
                </h3>
                <p className="text-sm text-muted-foreground">
                  O conteúdo abaixo pode ser copiado ou impresso em formato de
                  etiqueta.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!labelPreview}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Copiado!" : "Copiar etiqueta"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!labelPreview}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir etiqueta
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-border bg-background p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px] items-center">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-foreground">
                  {labelPreview ||
                    "Selecione as opcoes e preencha os campos para gerar a etiqueta."}
                </pre>
                {labelPreview ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={QR_CODE_DATA_URL}
                      alt="QR code para custodia"
                      className="h-32 w-32 rounded-md border border-border/60 bg-white p-2 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    QR code disponível após gerar a etiqueta.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={!labelPreview || saving || saved}
                className="w-full md:w-auto"
              >
                {saving ? (
                  <>
                    <Database className="mr-2 h-4 w-4 animate-pulse" />
                    Salvando...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Salvo com sucesso!
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Inserir no Banco de Vestígios
                  </>
                )}
              </Button>
            </div>

            <ul className="space-y-1 pl-4 text-xs text-muted-foreground">
              <li>
                A etiqueta combina a classificação SCV selecionada com os
                códigos informados para vestígio e caso.
              </li>
              <li>
                O sufixo referente ao mês/ano (formato MMyy) é adicionado
                automaticamente ao final dos códigos alfanuméricos separado por
                hífen.
              </li>
              <li>
                O QR code redireciona para{" "}
                <code className="font-mono">{QR_CODE_TARGET_URL}</code> durante
                os testes. (apenas dentro da rede PCI-servidores)
              </li>
              <li>
                Marque os complementos disponíveis para detalhar o tipo de arma
                (ex.: pistola).
              </li>
            </ul>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustodiaBalistica;
