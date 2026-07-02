// Gerado a partir do documento "1. Classificação - OFICIAL.docx".
// Hierarquia: instituto → disciplina → subdivisões oficiais disponíveis.
// Classe 1 = 3 institutos: 000 IDENTIFICAÇÃO, 100 CRIMINALÍSTICA, 200 MEDICINA LEGAL.

export type CduFacet = {
  code: string;
  label: string;
  appliesTo?: string[];
  requiresDescription?: boolean;
};

export type CduSubdivision = {
  code: string;
  label: string;
  subdivisions?: CduSubdivision[];
};

export type CduGroup = {
  code: string;
  label: string;
  subdivisions?: CduSubdivision[];
  facets?: CduFacet[];
};

export type CduClass = {
  code: string;
  label: string;
  groups: CduGroup[];
};

export const scvClasses: CduClass[] = [
  // ──── INSTITUTO 000 — IDENTIFICAÇÃO ───────────────────────────────────
  {
    code: "000",
    label: "Identificação",
    groups: [
      {
        code: "001",
        label: "Identificação Humana",
        subdivisions: [
          {
            code: "001.1",
            label: "Impressões Papilares",
            subdivisions: [
              { code: "001.11", label: "Impressão Visível" },
              { code: "001.12", label: "Impressão Latente" },
            ],
          },
          { code: "001.2", label: "Impressões Palmares" },
          { code: "001.3", label: "Impressões Plantares" },
          { code: "001.4", label: "Fotografia Facial" },
          { code: "001.5", label: "Reconhecimento Facial" },
          { code: "001.6", label: "Material Biométrico" },
        ],
      },
    ],
  },

  // ──── INSTITUTO 100 — CRIMINALÍSTICA ──────────────────────────────────
  {
    code: "100",
    label: "Criminalística",
    groups: [
      // 101 — BIOLOGIA
      {
        code: "101",
        label: "Biologia",
        subdivisions: [
          {
            code: "101.1",
            label: "Humana",
            subdivisions: [{ code: "101.11", label: "Vestígio Hematológico" }],
          },
          { code: "101.2", label: "Animal" },
          { code: "101.3", label: "Vegetal" },
          { code: "101.4", label: "Microbiana" },
          { code: "101.5", label: "Mista" },
          {
            code: "101.6",
            label: "Vestígio Genético",
            subdivisions: [
              { code: "101.61", label: "DNA Humano" },
              { code: "101.62", label: "DNA Animal" },
              { code: "101.63", label: "DNA Vegetal" },
              { code: "101.66", label: "Perfil Genético Misto" },
            ],
          },
        ],
      },

      // 102 — QUÍMICA
      {
        code: "102",
        label: "Química",
        subdivisions: [
          {
            code: "102.1",
            label: "Substâncias Químicas",
            subdivisions: [
              { code: "102.11", label: "Produtos Químicos Industriais" },
              { code: "102.12", label: "Reagentes Químicos" },
              { code: "102.13", label: "Solventes" },
              { code: "102.14", label: "Ácidos" },
              { code: "102.15", label: "Bases" },
              { code: "102.16", label: "Oxidantes" },
              { code: "102.17", label: "Redutores" },
            ],
          },
          {
            code: "102.2",
            label: "Combustíveis e Acelerantes",
            subdivisions: [
              { code: "102.21", label: "Gasolina" },
              { code: "102.22", label: "Etanol" },
              { code: "102.23", label: "Diesel" },
              { code: "102.24", label: "Querosene" },
              { code: "102.25", label: "Óleos Combustíveis" },
              { code: "102.26", label: "Misturas Inflamáveis" },
            ],
          },
          {
            code: "102.3",
            label: "Tintas, Vernizes e Revestimentos",
            subdivisions: [
              { code: "102.31", label: "Tintas Automotivas" },
              { code: "102.32", label: "Tintas Imobiliárias" },
              { code: "102.33", label: "Vernizes" },
              { code: "102.34", label: "Revestimentos Poliméricos" },
              { code: "102.35", label: "Pigmentos" },
            ],
          },
          {
            code: "102.4",
            label: "Polímeros e Materiais Sintéticos",
            subdivisions: [
              { code: "102.41", label: "Plásticos" },
              { code: "102.42", label: "Borrachas" },
              { code: "102.43", label: "Resinas" },
              { code: "102.44", label: "Espumas" },
              { code: "102.45", label: "Adesivos" },
              { code: "102.46", label: "Silicone" },
            ],
          },
          {
            code: "102.5",
            label: "Fibras e Corantes",
            subdivisions: [
              { code: "102.51", label: "Fibras Têxteis" },
              { code: "102.52", label: "Corantes Sintéticos" },
              { code: "102.53", label: "Corantes Naturais" },
              { code: "102.54", label: "Pigmentos" },
            ],
          },
          {
            code: "102.6",
            label: "Bebidas e Alimentos",
            subdivisions: [
              { code: "102.61", label: "Bebidas Alcoólicas" },
              { code: "102.62", label: "Alimentos Adulterados" },
              { code: "102.63", label: "Produtos Contaminados" },
              { code: "102.64", label: "Aditivos Químicos" },
            ],
          },
          {
            code: "102.7",
            label: "Substâncias Tóxicas",
            subdivisions: [
              { code: "102.71", label: "Agrotóxicos" },
              { code: "102.72", label: "Metais Pesados" },
              { code: "102.73", label: "Venenos" },
              { code: "102.74", label: "Produtos Tóxicos Industriais" },
              { code: "102.75", label: "Contaminantes Ambientais" },
            ],
          },
          {
            code: "102.8",
            label: "Resíduos Químicos Ambientais",
            subdivisions: [
              { code: "102.81", label: "Efluentes" },
              { code: "102.82", label: "Chorume" },
              { code: "102.83", label: "Derramamentos Químicos" },
              { code: "102.84", label: "Contaminantes do Solo" },
              { code: "102.85", label: "Contaminantes da Água" },
            ],
          },
          {
            code: "102.9",
            label: "Pesticidas",
            subdivisions: [
              { code: "102.91", label: "Organofosforados" },
              { code: "102.92", label: "Carbamatos (Aldicarb / Chumbinho)" },
              { code: "102.93", label: "Piretróides" },
              { code: "102.94", label: "Organoclorados" },
              { code: "102.95", label: "DDT" },
            ],
          },
          {
            code: "102.10",
            label: "Metais Pesados",
            subdivisions: [
              { code: "102.101", label: "Arsênio" },
              { code: "102.102", label: "Chumbo" },
              { code: "102.103", label: "Mercúrio" },
              { code: "102.104", label: "Tálio" },
            ],
          },
        ],
      },

      // 103 — TOXICOLOGIA
      {
        code: "103",
        label: "Toxicologia",
        subdivisions: [
          {
            code: "103.1",
            label: "Entorpecentes e Substâncias Psicoativas",
            subdivisions: [
              {
                code: "103.11",
                label: "Farmacêuticos",
                subdivisions: [{ code: "103.111", label: "Opioides/Opiáceos" }],
              },
              {
                code: "103.12",
                label: "Estimulantes",
                subdivisions: [
                  {
                    code: "103.121",
                    label:
                      "Psicoativo (Cocaína, Metanfetamina, Anfetamina, MDMA)",
                  },
                ],
              },
              {
                code: "103.13",
                label: "Alucinógenos (LSD, Cogumelos, PCP, Cetamina)",
              },
              {
                code: "103.14",
                label: "Canabinoides",
                subdivisions: [{ code: "103.141", label: "Benzodiazepínicos" }],
              },
              {
                code: "103.15",
                label: "Droga de Abuso ou Acessório",
                subdivisions: [
                  { code: "103.151", label: "Inalante" },
                  { code: "103.152", label: "Esteróide Anabolizante" },
                  { code: "103.153", label: "Droga Sintética Emergente" },
                  {
                    code: "103.154",
                    label:
                      "Acessórios (Cigarros Eletrônicos, E-cigarette, E-cig, Vape, Pod)",
                  },
                ],
              },
            ],
          },
        ],
      },

      // 104 — MEIO AMBIENTE
      {
        code: "104",
        label: "Meio Ambiente",
        subdivisions: [
          {
            code: "104.1",
            label: "Solo e Sedimentos",
            subdivisions: [
              { code: "104.11", label: "Terra" },
              { code: "104.12", label: "Sedimentos" },
              { code: "104.13", label: "Areia" },
              { code: "104.14", label: "Argila" },
              { code: "104.15", label: "Cascalho" },
              { code: "104.16", label: "Lama" },
              { code: "104.17", label: "Material Dragado" },
            ],
          },
          {
            code: "104.2",
            label: "Recursos Hídricos",
            subdivisions: [
              { code: "104.21", label: "Água Superficial" },
              { code: "104.22", label: "Água Subterrânea" },
              { code: "104.23", label: "Água Potável" },
              { code: "104.24", label: "Água Residual" },
              { code: "104.25", label: "Efluentes" },
              { code: "104.26", label: "Chorume" },
              { code: "104.27", label: "Sedimentos Aquáticos" },
            ],
          },
          {
            code: "104.3",
            label: "Atmosfera e Emissões",
            subdivisions: [
              { code: "104.31", label: "Material Particulado" },
              { code: "104.32", label: "Poeira" },
              { code: "104.33", label: "Fuligem" },
              { code: "104.34", label: "Cinzas" },
              { code: "104.35", label: "Emissões Atmosféricas" },
              { code: "104.36", label: "Gases Poluentes" },
              { code: "104.37", label: "Aerossóis" },
            ],
          },
          {
            code: "104.4",
            label: "Poluentes e Contaminantes Ambientais",
            subdivisions: [
              { code: "104.41", label: "Hidrocarbonetos" },
              { code: "104.42", label: "Metais Pesados" },
              { code: "104.43", label: "Agrotóxicos" },
              { code: "104.44", label: "Fertilizantes" },
              { code: "104.45", label: "Solventes" },
              { code: "104.46", label: "Contaminantes Industriais" },
              { code: "104.47", label: "Contaminantes Domésticos" },
            ],
          },
          {
            code: "104.5",
            label: "Flora e Recursos Florestais",
            subdivisions: [
              { code: "104.51", label: "Madeira" },
              { code: "104.52", label: "Carvão Vegetal" },
              { code: "104.53", label: "Troncos" },
              { code: "104.54", label: "Galhos" },
              { code: "104.55", label: "Folhas" },
              { code: "104.56", label: "Produtos Florestais" },
              { code: "104.57", label: "Resíduos de Desmatamento" },
            ],
          },
          {
            code: "104.6",
            label: "Fauna Silvestre",
            subdivisions: [
              { code: "104.61", label: "Animais Silvestres" },
              { code: "104.62", label: "Partes Anatômicas de Animais" },
              { code: "104.63", label: "Couros" },
              { code: "104.64", label: "Peles" },
              { code: "104.65", label: "Ovos" },
              { code: "104.66", label: "Ninhos" },
              { code: "104.67", label: "Produtos de Fauna" },
            ],
          },
          {
            code: "104.7",
            label: "Resíduos e Rejeitos",
            subdivisions: [
              { code: "104.71", label: "Resíduos Sólidos Urbanos" },
              { code: "104.72", label: "Resíduos Industriais" },
              { code: "104.73", label: "Resíduos Hospitalares" },
              { code: "104.74", label: "Resíduos Eletrônicos" },
              { code: "104.75", label: "Entulhos" },
              { code: "104.76", label: "Rejeitos de Mineração" },
            ],
          },
          {
            code: "104.8",
            label: "Vestígios de Queimadas e Incêndios Florestais",
            subdivisions: [
              { code: "104.81", label: "Material Vegetal Carbonizado" },
              { code: "104.82", label: "Cinzas" },
              { code: "104.83", label: "Carvão" },
              { code: "104.84", label: "Solo Queimado" },
              { code: "104.85", label: "Resíduos de Combustão" },
            ],
          },
          {
            code: "104.9",
            label: "Recursos Minerais e Geológicos",
            subdivisions: [
              { code: "104.91", label: "Rochas" },
              { code: "104.92", label: "Minerais" },
              { code: "104.93", label: "Minério Extraído" },
              { code: "104.94", label: "Rejeitos Minerais" },
              { code: "104.95", label: "Material de Garimpo" },
              { code: "104.96", label: "Fragmentos Geológicos" },
            ],
          },
          {
            code: "104.10",
            label: "Áreas Protegidas e Biodiversidade",
            subdivisions: [
              { code: "104.101", label: "Espécies Protegidas" },
              { code: "104.102", label: "Material Biológico Protegido" },
              { code: "104.103", label: "Evidências de Supressão Vegetal" },
              { code: "104.104", label: "Evidências de Ocupação Irregular" },
              { code: "104.105", label: "Evidências de Exploração Ilegal" },
            ],
          },
        ],
      },

      // 105 — ENGENHARIA E MATERIAIS
      {
        code: "105",
        label: "Engenharia e Materiais",
        subdivisions: [
          {
            code: "105.1",
            label: "Materiais Metálicos",
            subdivisions: [
              { code: "105.11", label: "Aço Estrutural" },
              { code: "105.12", label: "Ferro Fundido" },
              { code: "105.13", label: "Alumínio" },
              { code: "105.14", label: "Ligas Metálicas" },
              { code: "105.15", label: "Soldas" },
              { code: "105.16", label: "Corrosão Metálica" },
              { code: "105.17", label: "Fragmentos Metálicos" },
            ],
          },
          {
            code: "105.2",
            label: "Materiais Poliméricos e Compósitos",
            subdivisions: [
              { code: "105.21", label: "Plásticos Estruturais" },
              { code: "105.22", label: "Polímeros Industriais" },
              { code: "105.23", label: "Fibra de Vidro" },
              { code: "105.24", label: "Fibra de Carbono" },
              { code: "105.25", label: "Resinas Epóxi" },
              { code: "105.26", label: "Borrachas Técnicas" },
            ],
          },
          {
            code: "105.3",
            label: "Materiais Cerâmicos e Vítreos",
            subdivisions: [
              { code: "105.31", label: "Concreto Cerâmico" },
              { code: "105.32", label: "Tijolos" },
              { code: "105.33", label: "Telhas" },
              { code: "105.34", label: "Vidros Temperados" },
              { code: "105.35", label: "Vidros Laminados" },
              { code: "105.36", label: "Fragmentos Vítreos" },
            ],
          },
          {
            code: "105.4",
            label: "Estruturas Civis",
            subdivisions: [
              { code: "105.41", label: "Edificações" },
              { code: "105.42", label: "Pontes" },
              { code: "105.43", label: "Viadutos" },
              { code: "105.44", label: "Barragens" },
              { code: "105.45", label: "Muros de Contenção" },
              { code: "105.46", label: "Estruturas Metálicas" },
              { code: "105.47", label: "Estruturas de Concreto Armado" },
            ],
          },
          {
            code: "105.5",
            label: "Componentes Mecânicos",
            subdivisions: [
              { code: "105.51", label: "Engrenagens" },
              { code: "105.52", label: "Eixos" },
              { code: "105.53", label: "Rolamentos" },
              { code: "105.54", label: "Motores" },
              { code: "105.55", label: "Sistemas Hidráulicos" },
              { code: "105.56", label: "Sistemas Pneumáticos" },
              { code: "105.57", label: "Peças Fraturadas" },
            ],
          },
          {
            code: "105.6",
            label: "Sistemas Elétricos",
            subdivisions: [
              { code: "105.61", label: "Cabos Elétricos" },
              { code: "105.62", label: "Fiações" },
              { code: "105.63", label: "Disjuntores" },
              { code: "105.64", label: "Transformadores" },
              { code: "105.65", label: "Curto-Circuito" },
              { code: "105.66", label: "Painéis Elétricos" },
              { code: "105.67", label: "Componentes Queimados" },
            ],
          },
          {
            code: "105.7",
            label: "Elementos de Falha e Fratura",
            subdivisions: [
              { code: "105.71", label: "Fraturas Dúcteis" },
              { code: "105.72", label: "Fraturas Frágeis" },
              { code: "105.73", label: "Trincas" },
              { code: "105.74", label: "Deformações Plásticas" },
              { code: "105.75", label: "Ruptura Estrutural" },
              { code: "105.76", label: "Colapso Mecânico" },
            ],
          },
          {
            code: "105.8",
            label: "Materiais de Construção",
            subdivisions: [
              { code: "105.81", label: "Concreto" },
              { code: "105.82", label: "Argamassa" },
              { code: "105.83", label: "Asfalto" },
              { code: "105.84", label: "Madeira Estrutural" },
              { code: "105.85", label: "Aço de Reforço (Vergalhões)" },
              { code: "105.86", label: "Revestimentos" },
            ],
          },
          {
            code: "105.9",
            label: "Vestígios de Incêndio em Estruturas",
            subdivisions: [
              { code: "105.91", label: "Carbonização de Materiais" },
              { code: "105.92", label: "Deformação Térmica" },
              { code: "105.93", label: "Colapso por Calor" },
              { code: "105.94", label: "Materiais Queimados" },
              { code: "105.95", label: "Isolantes Elétricos Degradados" },
            ],
          },
          {
            code: "105.10",
            label: "Resíduos Industriais e de Engenharia",
            subdivisions: [
              { code: "105.101", label: "Resíduos de Fabricação" },
              { code: "105.102", label: "Sucatas Industriais" },
              { code: "105.103", label: "Restos de Maquinário" },
              { code: "105.104", label: "Fragmentos de Equipamentos" },
              { code: "105.105", label: "Componentes Desmontados" },
            ],
          },
        ],
      },

      // 106 — DOCUMENTOSCOPIA
      {
        code: "106",
        label: "Documentoscopia",
        subdivisions: [
          {
            code: "106.1",
            label: "Documentos de Identificação",
            subdivisions: [
              { code: "106.11", label: "Carteira de Identidade (RG)" },
              { code: "106.12", label: "Carteira Nacional de Habilitação" },
              { code: "106.13", label: "Passaporte" },
              { code: "106.14", label: "Carteiras Funcionais" },
              { code: "106.15", label: "Documentos Migratórios" },
            ],
          },
          {
            code: "106.2",
            label: "Documentos Financeiros",
            subdivisions: [
              { code: "106.21", label: "Cheques" },
              { code: "106.22", label: "Notas Promissórias" },
              { code: "106.23", label: "Duplicatas" },
              { code: "106.24", label: "Recibos" },
              { code: "106.25", label: "Comprovantes Bancários" },
            ],
          },
          {
            code: "106.3",
            label: "Documentos Contratuais",
            subdivisions: [
              { code: "106.31", label: "Contratos" },
              { code: "106.32", label: "Procurações" },
              { code: "106.33", label: "Declarações" },
              { code: "106.34", label: "Escrituras" },
              { code: "106.35", label: "Termos de Compromisso" },
            ],
          },
          {
            code: "106.4",
            label: "Documentos Manuscritos",
            subdivisions: [
              { code: "106.41", label: "Cartas" },
              { code: "106.42", label: "Bilhetes" },
              { code: "106.43", label: "Assinaturas" },
              { code: "106.44", label: "Anotações Manuscritas" },
              { code: "106.45", label: "Testamentos" },
            ],
          },
          {
            code: "106.5",
            label: "Documentos Impressos",
            subdivisions: [
              { code: "106.51", label: "Impressões a Jato de Tinta" },
              { code: "106.52", label: "Impressões a Laser" },
              { code: "106.53", label: "Impressões Matriciais" },
              { code: "106.54", label: "Formulários" },
              { code: "106.55", label: "Certificados" },
            ],
          },
          {
            code: "106.6",
            label: "Documentos Digitais",
            subdivisions: [
              { code: "106.61", label: "Arquivos PDF" },
              { code: "106.62", label: "Documentos Eletrônicos" },
              { code: "106.63", label: "Certificados Digitais" },
              { code: "106.64", label: "Assinaturas Eletrônicas" },
              { code: "106.65", label: "Registros Digitais" },
            ],
          },
          {
            code: "106.7",
            label: "Moedas e Valores",
            subdivisions: [
              { code: "106.71", label: "Cédulas" },
              { code: "106.72", label: "Moedas" },
              { code: "106.73", label: "Selos" },
              { code: "106.74", label: "Títulos de Crédito" },
              { code: "106.75", label: "Valores Mobiliários" },
            ],
          },
          {
            code: "106.8",
            label: "Elementos de Segurança Documental",
            subdivisions: [
              { code: "106.81", label: "Marcas-d'Água" },
              { code: "106.82", label: "Hologramas" },
              { code: "106.83", label: "Fibras de Segurança" },
              { code: "106.84", label: "Microimpressões" },
              { code: "106.85", label: "Tintas Especiais" },
              { code: "106.86", label: "Dispositivos Ópticos Variáveis" },
            ],
          },
          {
            code: "106.9",
            label: "Fragmentos Documentais",
            subdivisions: [
              { code: "106.91", label: "Fragmentos de Papel" },
              { code: "106.92", label: "Documentos Rasgados" },
              { code: "106.93", label: "Documentos Queimados" },
              { code: "106.94", label: "Documentos Apagados" },
              { code: "106.95", label: "Documentos Reconstruídos" },
            ],
          },
        ],
      },

      // 107 — TECNOLOGIA
      {
        code: "107",
        label: "Tecnologia",
        subdivisions: [
          {
            code: "107.1",
            label: "Computador",
            subdivisions: [
              { code: "107.11", label: "Computadores" },
              { code: "107.12", label: "Notebooks" },
              { code: "107.13", label: "Servidores" },
              { code: "107.14", label: "Estações de Trabalho" },
              { code: "107.15", label: "Sistemas Operacionais" },
              { code: "107.16", label: "Arquivos Digitais" },
            ],
          },
          {
            code: "107.2",
            label: "Dispositivo Móvel",
            subdivisions: [
              { code: "107.21", label: "Smartphones" },
              { code: "107.22", label: "Tablets" },
              { code: "107.23", label: "Smartwatches" },
              { code: "107.24", label: "Aparelhos GPS" },
              { code: "107.25", label: "Dispositivos Vestíveis" },
            ],
          },
          {
            code: "107.3",
            label: "Armazenamento Digital",
            subdivisions: [
              { code: "107.31", label: "HD" },
              { code: "107.32", label: "SSD" },
              { code: "107.33", label: "Pen Drive" },
              { code: "107.34", label: "Cartão de Memória" },
              { code: "107.35", label: "Mídia Óptica" },
              { code: "107.36", label: "Dispositivos de Backup" },
            ],
          },
          {
            code: "107.4",
            label: "Redes e Telecomunicações",
            subdivisions: [
              { code: "107.41", label: "Registros de Conexão" },
              { code: "107.42", label: "Logs de Rede" },
              { code: "107.43", label: "Roteadores" },
              { code: "107.44", label: "Modems" },
              { code: "107.45", label: "Equipamentos de Telecomunicação" },
              { code: "107.46", label: "Tráfego de Dados" },
            ],
          },
          {
            code: "107.5",
            label: "Sistemas e Aplicações",
            subdivisions: [
              { code: "107.51", label: "Bancos de Dados" },
              { code: "107.52", label: "Sistemas Corporativos" },
              { code: "107.53", label: "Aplicativos Móveis" },
              { code: "107.54", label: "Sistemas Embarcados" },
              { code: "107.55", label: "Sistemas em Nuvem" },
            ],
          },
          {
            code: "107.6",
            label: "Comunicação Digital",
            subdivisions: [
              { code: "107.61", label: "E-mails" },
              { code: "107.62", label: "Mensagens Instantâneas" },
              { code: "107.63", label: "Chamadas VoIP" },
              { code: "107.64", label: "Registros de Comunicação" },
              { code: "107.65", label: "Conversas em Plataformas Digitais" },
            ],
          },
          {
            code: "107.7",
            label: "Vestígios Multimídia",
            subdivisions: [
              { code: "107.71", label: "Fotografias Digitais" },
              { code: "107.72", label: "Vídeos" },
              { code: "107.73", label: "Áudios" },
              { code: "107.74", label: "Gravações Eletrônicas" },
              { code: "107.75", label: "Imagens de Monitoramento" },
            ],
          },
          {
            code: "107.8",
            label: "Vestígios de Segurança da Informação",
            subdivisions: [
              { code: "107.81", label: "Malware" },
              { code: "107.82", label: "Ransomware" },
              { code: "107.83", label: "Spyware" },
              { code: "107.84", label: "Ferramentas de Invasão" },
              { code: "107.85", label: "Artefatos de Autenticação" },
            ],
          },
          {
            code: "107.9",
            label: "Vestígios de Internet e Redes Sociais",
            subdivisions: [
              { code: "107.91", label: "Perfis Digitais" },
              { code: "107.92", label: "Publicações" },
              { code: "107.93", label: "Metadados de Acesso" },
              { code: "107.94", label: "Conteúdo Web" },
              { code: "107.95", label: "Histórico de Navegação" },
            ],
          },
          {
            code: "107.10",
            label: "Vestígios de IoT e Automação",
            subdivisions: [
              { code: "107.101", label: "Câmeras Inteligentes" },
              { code: "107.102", label: "Sensores" },
              { code: "107.103", label: "Assistentes Virtuais" },
              {
                code: "107.104",
                label: "Dispositivos Domésticos Inteligentes",
              },
              { code: "107.105", label: "Sistemas de Automação" },
            ],
          },
        ],
      },

      // 108 — MERCEOLOGIA
      {
        code: "108",
        label: "Merceologia",
        subdivisions: [
          {
            code: "108.1",
            label: "Produtos Alimentícios",
            subdivisions: [
              { code: "108.11", label: "Carnes e Derivados" },
              { code: "108.12", label: "Leite e Derivados" },
              { code: "108.13", label: "Cereais e Grãos" },
              { code: "108.14", label: "Farinhas e Amidos" },
              { code: "108.15", label: "Alimentos Processados" },
              { code: "108.16", label: "Alimentos Congelados" },
              { code: "108.17", label: "Conservas" },
              { code: "108.18", label: "Óleos e Gorduras Alimentares" },
            ],
          },
          {
            code: "108.2",
            label: "Bebidas",
            subdivisions: [
              { code: "108.21", label: "Água Mineral" },
              { code: "108.22", label: "Refrigerantes" },
              { code: "108.23", label: "Sucos" },
              { code: "108.24", label: "Bebidas Alcoólicas" },
              { code: "108.25", label: "Bebidas Energéticas" },
              { code: "108.26", label: "Bebidas Isotônicas" },
              { code: "108.27", label: "Bebidas Fermentadas" },
            ],
          },
          {
            code: "108.3",
            label: "Produtos Farmacêuticos e Correlatos",
            subdivisions: [
              { code: "108.31", label: "Medicamentos Industrializados" },
              { code: "108.32", label: "Medicamentos Manipulados" },
              { code: "108.33", label: "Genéricos e Similares" },
              { code: "108.34", label: "Fitoterápicos" },
              { code: "108.35", label: "Suplementos Alimentares" },
              { code: "108.36", label: "Insumos Farmacêuticos" },
              { code: "108.37", label: "Produtos Hospitalares" },
            ],
          },
          {
            code: "108.4",
            label: "Cosméticos e Produtos de Higiene",
            subdivisions: [
              { code: "108.41", label: "Perfumes" },
              { code: "108.42", label: "Cremes e Loções" },
              { code: "108.43", label: "Maquiagens" },
              { code: "108.44", label: "Produtos Capilares" },
              { code: "108.45", label: "Sabonetes e Detergentes Corporais" },
              { code: "108.46", label: "Desodorantes" },
              { code: "108.47", label: "Higiene Oral" },
            ],
          },
          {
            code: "108.5",
            label: "Produtos Químicos",
            subdivisions: [
              { code: "108.51", label: "Solventes" },
              { code: "108.52", label: "Ácidos e Bases" },
              { code: "108.53", label: "Reagentes" },
              { code: "108.54", label: "Tintas e Vernizes" },
              { code: "108.55", label: "Produtos Corrosivos" },
              { code: "108.56", label: "Produtos Inflamáveis" },
              { code: "108.57", label: "Produtos Oxidantes" },
            ],
          },
          {
            code: "108.6",
            label: "Combustíveis e Lubrificantes",
            subdivisions: [
              { code: "108.61", label: "Gasolina" },
              { code: "108.62", label: "Etanol" },
              { code: "108.63", label: "Diesel" },
              { code: "108.64", label: "GLP" },
              { code: "108.65", label: "Óleos Lubrificantes" },
              { code: "108.66", label: "Biodiesel" },
              { code: "108.67", label: "Misturas Combustíveis" },
            ],
          },
          {
            code: "108.7",
            label: "Produtos Agropecuários e Agrícolas",
            subdivisions: [
              { code: "108.71", label: "Fertilizantes" },
              { code: "108.72", label: "Agrotóxicos" },
              { code: "108.73", label: "Sementes" },
              { code: "108.74", label: "Rações" },
              { code: "108.75", label: "Insumos Veterinários" },
              { code: "108.76", label: "Produtos Agrícolas Processados" },
            ],
          },
          {
            code: "108.8",
            label: "Produtos Industriais e Tecnológicos",
            subdivisions: [
              { code: "108.81", label: "Eletroeletrônicos" },
              { code: "108.82", label: "Peças Automotivas" },
              { code: "108.83", label: "Ferramentas" },
              { code: "108.84", label: "Equipamentos Industriais" },
              { code: "108.85", label: "Têxteis" },
              { code: "108.86", label: "Calçados" },
              { code: "108.87", label: "Materiais de Construção" },
              { code: "108.88", label: "Componentes Mecânicos" },
            ],
          },
          {
            code: "108.9",
            label: "Mercadorias Financeiras e Documentais",
            subdivisions: [
              { code: "108.91", label: "Cédulas" },
              { code: "108.92", label: "Moedas" },
              { code: "108.93", label: "Cheques" },
              { code: "108.94", label: "Títulos de Crédito" },
              { code: "108.95", label: "Notas Fiscais" },
              { code: "108.96", label: "Selos Fiscais" },
              { code: "108.97", label: "Selos Postais" },
              { code: "108.98", label: "Documentos Comerciais" },
            ],
          },
          {
            code: "108.10",
            label: "Mercadorias Irregulares e Fraudulentas",
            subdivisions: [
              { code: "108.101", label: "Produtos Falsificados" },
              { code: "108.102", label: "Produtos Adulterados" },
              { code: "108.103", label: "Produtos Contrafeitos" },
              { code: "108.104", label: "Produtos Contrabandeados" },
              { code: "108.105", label: "Produtos Descaminhados" },
              { code: "108.106", label: "Produtos Reembalados" },
              { code: "108.107", label: "Produtos sem Origem Comprovada" },
            ],
          },
          {
            code: "108.11",
            label: "Resíduos e Subprodutos Comerciais",
            subdivisions: [
              { code: "108.111", label: "Produtos Vencidos" },
              {
                code: "108.112",
                label: "Resíduos Industriais Comercializados",
              },
              { code: "108.113", label: "Subprodutos Reaproveitados" },
              { code: "108.114", label: "Misturas Irregulares" },
              {
                code: "108.115",
                label: "Produtos Descartados Reintroduzidos no Mercado",
              },
            ],
          },
          {
            code: "108.12",
            label: "Mercadorias Diversas",
            subdivisions: [
              { code: "108.121", label: "Produtos Não Identificados" },
              { code: "108.122", label: "Amostras Comparativas" },
              { code: "108.123", label: "Produtos sem Classificação Definida" },
              { code: "108.124", label: "Itens em Análise Preliminar" },
            ],
          },
        ],
      },

      // 109 — ARMAMENTOS E ARTEFATOS
      {
        code: "109",
        label: "Armamentos e Artefatos",
        subdivisions: [
          {
            code: "109.1",
            label: "Armas",
            subdivisions: [
              { code: "109.11", label: "Arma Curta" },
              { code: "109.12", label: "Arma Longa" },
            ],
          },
          {
            code: "109.2",
            label: "Projéteis",
            subdivisions: [
              { code: "109.21", label: "Encamisado" },
              { code: "109.22", label: "Expansivo" },
              { code: "109.23", label: "Semiencamisado" },
              { code: "109.24", label: "Ogival" },
              { code: "109.25", label: "Ponta Plana" },
              { code: "109.26", label: "Ponta Macia" },
              { code: "109.27", label: "Perfurante" },
              { code: "109.28", label: "Incendiário" },
            ],
          },
          {
            code: "109.3",
            label: "Cartucho",
            subdivisions: [
              { code: "109.31", label: "Completo" },
              { code: "109.32", label: "De Festim" },
              { code: "109.33", label: "De Exercício" },
              { code: "109.34", label: "De Manejo" },
            ],
          },
          {
            code: "109.4",
            label: "Munições - Estojos",
            subdivisions: [
              { code: "109.41", label: "Não Deflagrado" },
              { code: "109.42", label: "Deflagrado" },
              { code: "109.43", label: "Parcialmente Deflagrado" },
              { code: "109.44", label: "Indeterminado" },
            ],
          },
          {
            code: "109.5",
            label: "Artefatos Explosivos",
            subdivisions: [
              { code: "109.51", label: "Carga Explosiva" },
              { code: "109.52", label: "Sistema de Iniciação" },
              { code: "109.53", label: "Sistema de Acionamento" },
              { code: "109.54", label: "Fonte de Energia" },
              { code: "109.55", label: "Invólucro ou Recipiente" },
              { code: "109.56", label: "Elemento de Fragmentação" },
              { code: "109.57", label: "Componente Eletrônico" },
              { code: "109.58", label: "Componente Estrutural" },
            ],
          },
          {
            code: "109.6",
            label: "Instrumentos Contundentes",
            subdivisions: [
              { code: "109.61", label: "Ferramenta" },
              { code: "109.62", label: "Utensílio Doméstico" },
              { code: "109.63", label: "Equipamento Esportivo" },
              { code: "109.64", label: "Peça Automotiva" },
              { code: "109.65", label: "Material de Construção" },
              { code: "109.66", label: "Objeto Mobiliário" },
              { code: "109.67", label: "Objeto Improvisado" },
              { code: "109.68", label: "Objeto Natural" },
            ],
          },
        ],
      },
    ],
  },

  // ──── INSTITUTO 200 — MEDICINA LEGAL ──────────────────────────────────
  {
    code: "200",
    label: "Medicina Legal",
    groups: [
      // 201 — PSIQUIATRIA FORENSE
      {
        code: "201",
        label: "Psiquiatria Forense",
        subdivisions: [
          { code: "201.1", label: "Prontuários Psiquiátricos" },
          { code: "201.2", label: "Registros de Internação" },
          { code: "201.3", label: "Prescrições Psiquiátricas" },
          { code: "201.4", label: "Relatórios Médicos" },
          { code: "201.5", label: "Escalas Psiquiátricas" },
          { code: "201.6", label: "Avaliações Periciais Psiquiátricas" },
          { code: "201.7", label: "Registros de Comportamento" },
          { code: "201.8", label: "Histórico Clínico Psiquiátrico" },
          {
            code: "201.9",
            label: "Cartas, Bilhetes e Manifestações de Intenção",
          },
          { code: "201.10", label: "Registros Audiovisuais Comportamentais" },
        ],
      },

      // 202 — PSICOLOGIA FORENSE
      {
        code: "202",
        label: "Psicologia Forense",
        subdivisions: [
          { code: "202.1", label: "Entrevistas Psicológicas" },
          { code: "202.2", label: "Testes Psicológicos" },
          { code: "202.3", label: "Relatórios Psicológicos" },
          { code: "202.4", label: "Avaliações Psicossociais" },
          { code: "202.5", label: "Pareceres Psicológicos" },
          { code: "202.6", label: "Registros Comportamentais" },
          { code: "202.7", label: "Desenhos e Produções Gráficas" },
          { code: "202.8", label: "Diários Pessoais" },
          {
            code: "202.9",
            label: "Mensagens e Comunicações de Interesse Psicológico",
          },
          {
            code: "202.10",
            label: "Registros Audiovisuais para Análise Psicológica",
          },
        ],
      },

      // 203 — ANTROPOLOGIA E ARQUEOLOGIA FORENSE
      {
        code: "203",
        label: "Antropologia e Arqueologia Forense",
        subdivisions: [
          {
            code: "203.1",
            label: "Ossadas",
            subdivisions: [
              { code: "203.11", label: "Ossada Humana" },
              { code: "203.12", label: "Ossada Animal" },
            ],
          },
          { code: "203.2", label: "Ossos Isolados" },
          { code: "203.3", label: "Fragmentos Ósseos" },
          { code: "203.4", label: "Dentes Isolados" },
          { code: "203.5", label: "Sepultamentos" },
          { code: "203.6", label: "Restos Esqueletizados" },
          { code: "203.7", label: "Artefatos Associados ao Sepultamento" },
          { code: "203.8", label: "Vestimentas Associadas" },
          { code: "203.9", label: "Objetos Pessoais Associados" },
          {
            code: "203.10",
            label: "Amostras Arqueológicas de Contexto Funerário",
          },
        ],
      },

      // 204 — TANATOLOGIA FORENSE
      {
        code: "204",
        label: "Tanatologia Forense",
        subdivisions: [
          { code: "204.1", label: "Cadáver Íntegro" },
          { code: "204.2", label: "Restos Mortais" },
          { code: "204.3", label: "Segmentos Corporais" },
          { code: "204.4", label: "Livores Cadavéricos" },
          { code: "204.5", label: "Rigidez Cadavérica" },
          { code: "204.6", label: "Espasmo Cadavérico" },
          { code: "204.7", label: "Putrefação" },
          { code: "204.8", label: "Mumificação" },
          { code: "204.9", label: "Saponificação" },
          { code: "204.10", label: "Carbonização" },
        ],
      },

      // 205 — SEXOLOGIA FORENSE
      {
        code: "205",
        label: "Sexologia Forense",
        subdivisions: [
          { code: "205.1", label: "Lesões Genitais" },
          { code: "205.2", label: "Lesões Paragenitais" },
          { code: "205.3", label: "Secreções Vaginais" },
          { code: "205.4", label: "Secreções Seminais" },
          { code: "205.5", label: "Material Contraceptivo" },
          { code: "205.6", label: "Vestimentas Relacionadas ao Evento Sexual" },
          { code: "205.7", label: "Objetos Associados ao Ato Sexual" },
          { code: "205.8", label: "Registros Clínicos Sexológicos" },
          { code: "205.9", label: "Vestígios de Violência Sexual" },
          {
            code: "205.10",
            label: "Amostras Biológicas de Interesse Sexológico",
          },
        ],
      },

      // 206 — TRAUMATOLOGIA FORENSE
      {
        code: "206",
        label: "Traumatologia Forense",
        subdivisions: [
          { code: "206.1", label: "Escoriações" },
          { code: "206.2", label: "Equimoses" },
          { code: "206.3", label: "Hematomas" },
          { code: "206.4", label: "Feridas Contusas" },
          { code: "206.5", label: "Feridas Cortantes" },
          { code: "206.6", label: "Feridas Perfurantes" },
          { code: "206.7", label: "Feridas Perfurocortantes" },
          { code: "206.8", label: "Feridas Corto-Contusas" },
          { code: "206.9", label: "Fraturas" },
          { code: "206.10", label: "Luxações e Amputações Traumáticas" },
        ],
      },

      // 207 — ODONTOLOGIA LEGAL
      {
        code: "207",
        label: "Odontologia Legal",
        subdivisions: [
          { code: "207.1", label: "Dentes Isolados" },
          { code: "207.2", label: "Arcadas Dentárias" },
          { code: "207.3", label: "Próteses Dentárias" },
          { code: "207.4", label: "Implantes Dentários" },
          { code: "207.5", label: "Moldes Odontológicos" },
          { code: "207.6", label: "Radiografias Odontológicas" },
          { code: "207.7", label: "Fotografias Odontológicas" },
          { code: "207.8", label: "Marcas de Mordida" },
          { code: "207.9", label: "Registros Odontológicos" },
          { code: "207.10", label: "Modelos Digitais Odontológicos" },
        ],
      },
    ],
  },
];
