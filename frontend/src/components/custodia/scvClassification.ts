export type CduFacet = {
  code: string;
  label: string;
  appliesTo?: string[];
  requiresDescription?: boolean;
};

export type CduSubdivision = {
  code: string;
  label: string;
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
  {
    code: "1",
    label: "Biológico",
    groups: [
      {
        code: "101",
        label: "Fluidos Corporais",
        subdivisions: [
          { code: "101.11", label: "Sangue - Líquido" },
          { code: "1.1.1.2", label: "Sangue - Seco" },
          { code: "1.1.1.3", label: "Sangue - Disperso" },
          { code: "1.1.2.1", label: "Sêmen - Líquido" },
          { code: "1.1.2.3", label: "Sêmen - Semissólido" },
          { code: "1.1.2.4", label: "Sêmen - Seco" },
          { code: "1.1.3.1", label: "Saliva - Seca" },
          { code: "1.1.3.2", label: "Saliva - Líquida" },
          { code: "1.1.4.1", label: "Urina e Fezes - Manchas secas" },
          { code: "1.1.5.1", label: "Fluídos corporais - Suor" },
          { code: "1.1.5.2", label: "Fluídos corporais - Muco" },
          { code: "1.1.5.3", label: "Fluídos corporais - Vômito" },
          { code: "1.1.5.4", label: "Fluídos corporais - Leite Materno" },
          { code: "1.1.5.5", label: "Fluídos corporais - Material gástrico" },
          { code: "1.1.6", label: "Tecido Umbilical e Placenta" },
        ],
      },
      {
        code: "1.2",
        label: "Tecidos Sólidos e Estruturas Celulares",
        subdivisions: [
          { code: "1.2.1.1", label: "Cabelos e Pelos - Com Bulbo" },
          { code: "1.2.1.2", label: "Cabelos e Pelos - Sem Bulbo" },
          {
            code: "1.2.2.1",
            label: "Pele (Células Epiteliais) - Células de Esfoliação",
          },
          {
            code: "1.2.2.2",
            label: "Pele (Células Epiteliais) - Fragmentos de Pele/Tecido",
          },
          { code: "1.2.3.1", label: "Ossos e Dentes - Esqueletizados" },
          { code: "1.2.3.2", label: "Ossos e Dentes - Carbonizados" },
          { code: "1.2.3.3", label: "Ossos e Dentes - Avulsionados" },
          { code: "1.2.4", label: "Tecidos de Órgãos Internos" },
        ],
      },
      {
        code: "1.3",
        label: "Materiais Biológicos Diversos (Animais e Vegetal)",
        subdivisions: [
          { code: "1.3.1", label: "Pólens e Esporos" },
          { code: "1.3.2", label: "Material Vegetal" },
          { code: "1.3.4", label: "Insetos e Larvas" },
        ],
      },
    ],
  },
  {
    code: "2",
    label: "Papiloscópico",
    groups: [
      {
        code: "2.1",
        label: "Papiloscopia",
        subdivisions: [
          { code: "2.1.1", label: "Dactiloscopia" },
          { code: "2.1.2", label: "Quiroscopia" },
          { code: "2.1.3", label: "Podoscopia" },
        ],
      },
    ],
  },
  {
    code: "3",
    label: "Químico-Toxicológico/Drogas",
    groups: [
      {
        code: "3.1",
        label: "Tóxicos",
        subdivisions: [
          { code: "3.1.1", label: "Venenos" },
          { code: "3.1.2.1", label: "Pesticidas - Organofosforados" },
          { code: "3.1.2.2", label: "Pesticidas - Carbamatos" },
          { code: "3.1.2.3", label: "Pesticidas - Piretróides" },
          { code: "3.1.2.4", label: "Pesticidas - Organoclorados" },
          { code: "3.1.3.1", label: "Metais pesados - Arsênio" },
          { code: "3.1.3.2", label: "Metais pesados - Chumbo" },
          { code: "3.1.3.3", label: "Metais pesados - Mercúrio" },
          { code: "3.1.3.4", label: "Metais pesados - Tálio" },
          {
            code: "3.1.4.1",
            label: "Solventes e Produtos Químicos - Cianoacrilatos",
          },
          {
            code: "3.1.4.2",
            label: "Solventes e Produtos Químicos - Solventes orgânicos",
          },
          {
            code: "3.1.4.3",
            label: "Solventes e Produtos Químicos - Clorofórmio",
          },
          {
            code: "3.1.4.4",
            label: "Solventes e Produtos Químicos - Alvejantes",
          },
          {
            code: "3.1.4.5",
            label: "Solventes e Produtos Químicos - Ácidos/bases fortes",
          },
        ],
      },
      {
        code: "3.2",
        label: "Farmacêuticos",
        subdivisions: [
          { code: "3.2.1.1", label: "Opioides/Opiáceos - Heroína" },
          { code: "3.2.1.2", label: "Opioides/Opiáceos - Morfina" },
          { code: "3.2.1.3", label: "Opioides/Opiáceos - Fentanil" },
          { code: "3.2.1.4", label: "Opioides/Opiáceos - Analgésicos" },
          {
            code: "3.2.1.5",
            label: "Opioides/Opiáceos - Opióides prescritos",
          },
        ],
      },
      {
        code: "3.3",
        label: "Estimulantes",
        subdivisions: [
          { code: "3.3.1.1", label: "Psicoativo - Cocaína" },
          { code: "3.3.1.2", label: "Psicoativo - Metanfetamina" },
          { code: "3.3.1.3", label: "Psicoativo - Anfetamina" },
        ],
      },
      {
        code: "3.4",
        label: "Alucinógenos",
        subdivisions: [
          { code: "3.3.1.4", label: "MDMA (Êxtase/Molly)" },
          { code: "3.4.3.1", label: "LSD" },
          { code: "3.4.3.2", label: "Cogumelos Psilocibinos" },
          { code: "3.4.3.3", label: "PCP" },
          { code: "3.3.3.4", label: "Cetamina" },
          { code: "3.3.4.1", label: "Benzodiazepínicos - Diazepam" },
          { code: "3.3.4.2", label: "Benzodiazepínicos - Alprazolam" },
          { code: "3.3.4.3", label: "Benzodiazepínicos - Clonazepam" },
        ],
      },
      {
        code: "3.5",
        label: "Canabinoides",
        subdivisions: [
          { code: "3.5.5.1", label: "Canabinoides - Maconha (Cannabis)" },
          { code: "3.5.6.1", label: "Sintéticos (K2/Spice)" },
        ],
      },
      {
        code: "3.6",
        label: "Outras Drogas de Abuso e Acessórios",
        subdivisions: [
          { code: "3.6.7.1", label: "Inalantes" },
          { code: "3.6.7.2", label: "Esteróides Anabolizantes" },
          { code: "3.6.7.3", label: "Drogas Sintéticas Emergentes" },
          { code: "3.6.7.4", label: "Paraphernalia (Acessórios)" },
        ],
      },
    ],
  },
  {
    code: "4",
    label: "Genética Forense",
    groups: [
      {
        code: "4.1",
        label: "Vestígios de Alto Teor de DNA",
        subdivisions: [
          { code: "4.1.1", label: "Sangue Líquido ou mancha fresca" },
          { code: "4.1.2", label: "Sêmen" },
          { code: "4.1.3", label: "Tecidos Frescos" },
          { code: "4.1.4", label: "Fios de Cabelo com Folículo" },
        ],
      },
      {
        code: "4.2",
        label: "Vestígios de Médio Teor de DNA",
        subdivisions: [
          { code: "4.2.1", label: "Saliva" },
          { code: "4.2.2", label: "Mancha de sangue seca ou antiga" },
          { code: "4.2.3", label: "Urina e Fezes" },
        ],
      },
      {
        code: "4.3",
        label: "Vestígios de Baixo Teor de DNA ou Degradado",
        subdivisions: [
          { code: "4.3.1", label: "Células de Contato (Touch DNA)" },
          { code: "4.3.2", label: "Fios de Cabelo sem Folículo" },
          { code: "4.3.3", label: "Ossos e Dentes Degradados" },
          { code: "4.3.4", label: "Tecidos Degenerados" },
        ],
      },
    ],
  },
  {
    code: "5",
    label: "Antropologia Forense",
    groups: [
      {
        code: "5.1",
        label: "Restos Humanos em Estado Fresco",
        subdivisions: [
          { code: "5.1.1", label: "Corpo inalterado" },
          { code: "5.1.2", label: "Corpo em decomposição" },
        ],
      },
      {
        code: "5.2",
        label: "Restos Humanos em Estado de Decomposição Avançada",
        subdivisions: [
          {
            code: "5.2.1",
            label: "Corpos esqueletizados ou semi-esqueletizados",
          },
          { code: "5.2.2", label: "Corpos carbonizados" },
          { code: "5.2.3", label: "Restos fragmentados ou dispersos" },
        ],
      },
    ],
  },
  {
    code: "6",
    label: "Arqueologia Forense",
    groups: [
      {
        code: "6.1",
        label: "Vestígios Materiais",
        subdivisions: [
          { code: "6.1.1", label: "Objetos pessoais" },
          { code: "6.1.2", label: "Roupas e acessórios" },
          { code: "6.1.3", label: "Armas e Instrumentos do crime" },
          { code: "6.1.4", label: "Materiais de Embalagem/Contenção" },
          { code: "6.1.5", label: "Evidência de Transferência" },
        ],
      },
      {
        code: "6.2",
        label: "Vestígios Contextuais e Ambientais",
        subdivisions: [
          { code: "6.2.1", label: "Sedimentos e Solo" },
          { code: "6.2.2", label: "Flora" },
          { code: "6.2.3", label: "Fauna" },
          { code: "6.2.4", label: "Geologia e Hidrologia" },
          { code: "6.2.5", label: "Alterações no Ambiente" },
        ],
      },
    ],
  },
  {
    code: "7",
    label: "Odontologia Legal",
    groups: [
      {
        code: "7.1",
        label: "Vestígios para Identificação Humana Comparativa",
        subdivisions: [
          { code: "7.1.1", label: "Dentes e Arcadas Dentárias" },
          { code: "7.1.2", label: "Registros Odontológicos" },
          { code: "7.1.3", label: "Marcas de Mordida" },
          { code: "7.1.4", label: "Estimativa de Idade e Sexo" },
          { code: "7.1.5", label: "Análises Complementares e Auxiliares" },
        ],
      },
    ],
  },
  {
    code: "8",
    label: "Medicina Legal",
    groups: [
      {
        code: "8.1",
        label: "Vestígios no Corpo Humano",
        subdivisions: [
          { code: "8.1.1.1", label: "Lesões - Traumáticas" },
          { code: "8.1.1.2", label: "Lesões - Químicas" },
          { code: "8.1.1.3", label: "Lesões - Térmicas" },
          { code: "8.1.1.4", label: "Lesões - Biológicas" },
          { code: "8.1.2.1", label: "Fluidos Corporais - Sangue" },
          { code: "8.1.2.2", label: "Fluidos Corporais - Sêmen" },
          { code: "8.1.2.3", label: "Fluidos Corporais - Saliva" },
          {
            code: "8.1.2.4",
            label: "Fluidos Corporais - Urina, Fezes e Vômito",
          },
          { code: "8.1.3.1", label: "Fios de cabelo ou pelos corporais" },
          { code: "8.1.4.1", label: "Fragmentos de pele, unhas e tecidos" },
          { code: "8.1.5.1", label: "Tatuagens" },
          { code: "8.1.5.2", label: "Cicatrizes" },
          { code: "8.1.5.3", label: "Sinais de nascença" },
          { code: "8.1.5.4", label: "Deformidades físicas" },
          { code: "8.1.5.5", label: "Implantes cirúrgicos" },
          { code: "8.1.5.6", label: "Piercings" },
          { code: "8.1.6.1", label: "Sinais de infarto" },
          { code: "8.1.6.2", label: "AVC" },
          { code: "8.1.6.3", label: "Tumores" },
          { code: "8.1.6.4", label: "Doenças pulmonares" },
          { code: "8.1.6.5", label: "Doenças hepáticas" },
          { code: "8.1.6.6", label: "Diabetes" },
          { code: "8.1.7.1", label: "Rigidez cadavérica" },
          { code: "8.1.7.2", label: "Livores cadavéricos" },
          { code: "8.1.7.3", label: "Resfriamento do corpo" },
          { code: "8.1.7.4", label: "Putrefação" },
          { code: "8.1.7.5", label: "Mumificação" },
          { code: "8.1.7.6", label: "Adipocera" },
          { code: "8.1.7.7", label: "Ação de insetos" },
        ],
      },
      {
        code: "8.2",
        label: "Vestígios no Ambiente e em Objetos",
        subdivisions: [
          { code: "8.2.1.1", label: "Rasgos em roupas indicando luta" },
          {
            code: "8.2.1.2",
            label: "Orifícios compatíveis com projétil de arma de fogo",
          },
          { code: "8.2.1.3", label: "Vestígios de solo" },
          { code: "8.2.1.4", label: "Fibras ou fluidos de terceiros" },
          { code: "8.2.2.1", label: "Projéteis alojados em tecidos" },
          { code: "8.2.2.2", label: "Fragmentos de vidro" },
          { code: "8.2.2.3", label: "Fibras têxteis" },
          { code: "8.2.2.4", label: "Lama" },
          { code: "8.2.2.5", label: "Areia" },
          { code: "8.2.2.6", label: "Produtos químicos em roupas ou na pele" },
          { code: "8.2.3.1", label: "Amostras de solo" },
          { code: "8.2.3.2", label: "Água" },
          { code: "8.2.3.3", label: "Plantas" },
          { code: "8.2.3.4", label: "Insetos" },
          { code: "8.2.3.5", label: "Localização geográfica" },
          { code: "8.2.3.6", label: "Circunstâncias" },
        ],
      },
    ],
  },
  {
    code: "800",
    label: "Documental",
    groups: [
      {
        code: "801",
        label: "Documentos de Identificação",
        subdivisions: [
          { code: "801.1", label: "Carteira de Identidade (RG)" },
          { code: "9.1.2", label: "Cadastro de Pessoa Física (CPF)" },
          { code: "9.1.3", label: "Carteira Nacional de Habilitação" },
          { code: "9.1.4", label: "Certidão de Nascimento" },
          { code: "9.1.5", label: "Título de Eleitor" },
          { code: "9.1.6", label: "Carteira de Trabalho e Previdência Social" },
          { code: "9.1.7", label: "Alistamento Militar ou Dispensa" },
          { code: "9.1.8", label: "Passaporte" },
        ],
      },
      {
        code: "9.2",
        label: "Títulos Oficiais",
        subdivisions: [
          { code: "9.2.1.1", label: "Diploma de Graduação" },
          { code: "9.2.1.2", label: "Certificado de Pós-Graduação" },
          { code: "9.2.1.3", label: "Título de Mestre" },
          { code: "9.2.1.4", label: "Título de Doutor" },
          { code: "9.2.1.5", label: "Livre-Docente" },
          { code: "9.2.1.6", label: "Cidadão Honorário" },
          { code: "9.2.1.7", label: "Doutor Honoris Causa" },
          { code: "9.2.3.1", label: "Campeão Brasileiro" },
          { code: "9.2.3.2", label: "Campeão da Copa do Brasil" },
          { code: "9.2.3.3", label: "Campeão da Copa Libertadores" },
          { code: "9.2.3.4", label: "Campeão Mundial de Clubes" },
        ],
      },
      {
        code: "9.3",
        label: "Cédulas e Moedas",
        subdivisions: [
          { code: "9.3.1.1", label: "Cédulas autênticas" },
          { code: "9.3.1.2", label: "Cédulas falsas" },
          { code: "9.3.2.1", label: "Moedas autênticas" },
          { code: "9.3.2.2", label: "Moedas falsas" },
        ],
      },
      {
        code: "9.4",
        label: "Documentos Manuscritos",
        subdivisions: [
          { code: "9.4.1.1", label: "Assinaturas - Contratos" },
          { code: "9.4.1.2", label: "Assinaturas - Cheques" },
          { code: "9.4.1.3", label: "Assinaturas - Procurações" },
          { code: "9.4.1.4", label: "Assinaturas - Testamentos" },
          { code: "9.4.1.5", label: "Assinaturas - Recibos" },
          { code: "9.4.2.1", label: "Textos escritos à mão - Bilhetes" },
          { code: "9.4.2.2", label: "Textos escritos à mão - Cartas/diários" },
          { code: "9.4.2.3", label: "Textos escritos à mão - Anotações" },
          { code: "9.4.2.4", label: "Textos escritos à mão - Confissões" },
          { code: "9.4.3", label: "Rubricas" },
          { code: "9.4.4", label: "Grafites e desenhos" },
        ],
      },
      {
        code: "9.5",
        label: "Documentos Datilografados e Impressos",
        subdivisions: [
          { code: "9.5.1", label: "Textos de máquinas de escrever" },
          { code: "9.5.2", label: "Documentos impressos por impressoras" },
          { code: "9.5.3", label: "Documentos fotocopiados" },
          { code: "9.5.4", label: "Formulários padronizados preenchidos" },
        ],
      },
      {
        code: "9.6",
        label: "Documentos Eletrônicos e Digitais",
        subdivisions: [
          { code: "9.6.1", label: "Arquivos de texto" },
          { code: "9.6.2", label: "E-mails e mensagens" },
          { code: "9.6.3", label: "Imagens e vídeos digitais" },
          { code: "9.6.4", label: "Registros de chamadas e mensagens" },
          { code: "9.6.5", label: "Dados de navegação e histórico" },
          { code: "9.6.6", label: "Registros de sistemas" },
          { code: "9.6.7", label: "Dados de dispositivos de armazenamento" },
        ],
      },
      {
        code: "9.7",
        label: "Documentos Contábeis e Financeiros",
        subdivisions: [
          { code: "9.7.1", label: "Extratos bancários" },
          { code: "9.7.2", label: "Notas fiscais e recibos" },
          { code: "9.7.3", label: "Livros contábeis" },
          { code: "9.7.4", label: "Contratos financeiros e de empréstimos" },
          { code: "9.7.5", label: "Comprovantes de pagamento" },
          { code: "9.7.6", label: "Declarações de imposto de renda" },
        ],
      },
      {
        code: "9.8",
        label: "Documentos Audiovisuais",
        subdivisions: [
          { code: "9.8.1", label: "Filmes" },
          { code: "9.8.2", label: "Fitas" },
          { code: "9.8.3", label: "Gravações de áudio" },
          { code: "9.8.4", label: "Gravação de vídeo" },
          { code: "9.8.5", label: "Gravação de áudio/vídeo" },
          { code: "9.8.6", label: "Microfilmes" },
        ],
      },
      {
        code: "9.9",
        label: "Registros Documentais em Outras Superfícies",
        subdivisions: [
          { code: "9.9.1", label: "Escritos em parede" },
          { code: "9.9.2", label: "Escritos em espelhos" },
          { code: "9.9.3", label: "Escritos em metal" },
          { code: "9.9.4", label: "Escritos em couro" },
          { code: "9.9.5", label: "Escritos em pele humana" },
        ],
      },
    ],
  },
  {
    code: "10",
    label: "Perícia Merceológica",
    groups: [
      {
        code: "10.1",
        label: "Vestígios Materiais",
        subdivisions: [
          { code: "10.1.1.1", label: "Produtos acabados - Roupas" },
          { code: "10.1.1.2", label: "Produtos acabados - Eletrônicos" },
          { code: "10.1.1.3", label: "Produtos acabados - Medicamentos" },
          { code: "10.1.1.4", label: "Produtos acabados - Brinquedos" },
          { code: "10.1.1.5", label: "Produtos acabados - Peças de veículos" },
          { code: "10.1.2.1", label: "Matérias-primas e insumos" },
          { code: "10.1.3.1", label: "Artigos de luxo - Joias" },
          { code: "10.1.3.2", label: "Artigos de luxo - Relógios" },
          { code: "10.1.3.3", label: "Artigos de luxo - Bolsas de Grife" },
          { code: "10.1.3.4", label: "Artigos de luxo - Obras de Arte" },
          { code: "10.1.4.1", label: "Produtos agrícolas - Grãos" },
          { code: "10.1.4.2", label: "Produtos agrícolas - Frutas" },
          { code: "10.1.4.3", label: "Produtos agrícolas - Vegetais" },
          { code: "10.1.5.1", label: "Minerais - Gema" },
          { code: "10.1.5.2", label: "Minerais - Metais preciosos" },
          { code: "10.1.5.3", label: "Minerais - Minérios" },
          { code: "10.1.6.1", label: "Substâncias químicas" },
        ],
      },
      {
        code: "10.2",
        label: "Vestígios Documentais Relacionados aos Bens",
        subdivisions: [
          { code: "10.2.1", label: "Notas fiscais e faturas" },
          { code: "10.2.2", label: "Protocolo de transporte e manifestos" },
          { code: "10.2.3", label: "Certificados de origem e qualidade" },
          { code: "10.2.4", label: "Manuais de instruções e catálogos" },
          { code: "10.2.5", label: "Registros de patentes e marcas" },
          { code: "10.2.6", label: "Documentos de importação/exportação" },
        ],
      },
      {
        code: "10.3",
        label: "Vestígios Indiretos",
        subdivisions: [
          { code: "10.3.1.1", label: "Embalagens - Marcas" },
          { code: "10.3.1.2", label: "Embalagens - Códigos de barras" },
          { code: "10.3.1.3", label: "Embalagens - Selos de segurança" },
          { code: "10.3.2.1", label: "Etiquetas e selos - Data de fabricação" },
          { code: "10.3.2.2", label: "Etiquetas e selos - Lote" },
          { code: "10.3.2", label: "Ferramentas e equipamentos" },
          { code: "10.3.3", label: "Dados de mercado" },
        ],
      },
    ],
  },
  {
    code: "11",
    label: "Perícia em Eletro-eletrônico (Informática)",
    groups: [
      {
        code: "11.1",
        label: "Quanto ao Suporte Físico",
        subdivisions: [
          { code: "11.1.1.1", label: "Computadores - Discos rígidos" },
          { code: "11.1.1.2", label: "Computadores - SSDs" },
          { code: "11.1.1.3", label: "Computadores - Memória RAM" },
          { code: "11.1.1.4", label: "Computadores - CPU" },
          { code: "11.1.1.5", label: "Computadores - Periféricos" },
          { code: "11.1.2.1", label: "Dispositivos móveis - Smartphones" },
          { code: "11.1.2.2", label: "Dispositivos móveis - Tablets" },
          { code: "11.1.2.3", label: "Dispositivos móveis - Smartwatches" },
          { code: "11.1.3.1", label: "Mídias removíveis - Pendrives" },
          { code: "11.1.3.2", label: "Mídias removíveis - Cartões de memória" },
          { code: "11.1.3.3", label: "Mídias removíveis - CDs" },
          { code: "11.1.3.4", label: "Mídias removíveis - DVDs" },
          { code: "11.1.3.5", label: "Mídias removíveis - Discos externos" },
          { code: "11.1.4.1", label: "Servidores e rede - Roteadores" },
          { code: "11.1.4.2", label: "Servidores e rede - Switches" },
          { code: "11.1.5.1", label: "Sistemas embarcados - GPS veicular" },
          {
            code: "11.1.5.2",
            label: "Sistemas embarcados - Centrais multimídia",
          },
          { code: "11.1.5.3", label: "Sistemas embarcados - Drones" },
          { code: "11.1.5.4", label: "Sistemas de segurança" },
          { code: "11.1.6.1", label: "IoT - Geladeiras inteligentes" },
          { code: "11.1.6.2", label: "IoT - Assistentes virtuais" },
          { code: "11.1.6.3", label: "IoT - Câmeras de segurança" },
        ],
      },
      {
        code: "11.2",
        label: "Quanto à Natureza do Dado",
        subdivisions: [
          { code: "11.2.1.1", label: "Arquivos de Documentos - Textos" },
          { code: "11.2.1.2", label: "Arquivos de Documentos - Planilhas" },
          { code: "11.2.1.3", label: "Arquivos de Documentos - Apresentações" },
          { code: "11.2.2.1", label: "Arquivos Multimídia - Imagens" },
          { code: "11.2.2.2", label: "Arquivos Multimídia - Vídeos" },
          { code: "11.2.2.3", label: "Arquivos Multimídia - Áudios" },
          { code: "11.2.3.1", label: "Comunicações - E-mails" },
          {
            code: "11.2.3.2",
            label: "Comunicações - Mensagens de aplicativos",
          },
          { code: "11.2.3.3", label: "Comunicações - SMS" },
          { code: "11.2.3.4", label: "Comunicações - Registros de chamadas" },
          { code: "11.2.3.5", label: "Comunicações - Redes sociais" },
          { code: "11.2.4.1", label: "Logs - Atividades do sistema" },
          { code: "11.2.4.2", label: "Logs - Acessos a sites" },
          { code: "11.2.4.3", label: "Logs - Tentativas de login" },
          { code: "11.2.4.4", label: "Logs - Instalações de software" },
          { code: "11.2.5", label: "Metadados" },
          { code: "11.2.6.1", label: "Dados de navegação - Histórico" },
          { code: "11.2.6.2", label: "Dados de navegação - Cookies" },
          { code: "11.2.6.3", label: "Dados de navegação - Caches" },
          { code: "11.2.6.4", label: "Dados de navegação - Favoritos" },
          { code: "11.2.7.1", label: "Geolocalização - Histórico" },
          { code: "11.2.7.2", label: "Geolocalização - GPS" },
          { code: "11.2.7.3", label: "Geolocalização - Torres de celular" },
          { code: "11.2.8.1", label: "Malware - Vírus" },
          { code: "11.2.8.2", label: "Malware - Ransomwares" },
          { code: "11.2.8.3", label: "Malware - Spywares" },
        ],
      },
      {
        code: "11.3",
        label: "Quanto ao Estado de Existência/Acessibilidade",
        subdivisions: [
          { code: "11.3.1", label: "Dados ativos/visíveis" },
          { code: "11.3.2", label: "Dados deletados/latentes" },
          { code: "11.3.3", label: "Dados ocultos/criptografados" },
          { code: "11.3.3-fragmentados", label: "Dados fragmentados" },
        ],
      },
      {
        code: "11.4",
        label: "Quanto à Volatilidade",
        subdivisions: [
          { code: "11.4.1", label: "Voláteis" },
          { code: "11.4.2", label: "Não Voláteis (Persistentes)" },
        ],
      },
    ],
  },
  {
    code: "900",
    label: "Balística",
    groups: [
      {
        code: "901",
        label: "Quanto à Origem (Elementos Essenciais do Disparo)",
        subdivisions: [
          { code: "901.1", label: "Arma de Fogo" },
          { code: "901.2", label: "Munições não deflagradas" },
          {
            code: "901.211",
            label: "Elementos da Munição Deflagrada - Estojos",
          },
          {
            code: "901.212",
            label: "Elementos da Munição Deflagrada - Projéteis",
          },
          {
            code: "901.213",
            label: "Elementos da Munição Deflagrada - Fragmentos de projéteis",
          },
          {
            code: "901.214",
            label: "Elementos da Munição Deflagrada - Fragmentos de estojos",
          },
        ],
      },
      {
        code: "12.2",
        label: "Quanto aos Resíduos do Disparo",
        subdivisions: [
          {
            code: "12.2.1",
            label: "Resíduos de Pólvora Incombusta/Parcialmente Combusta",
          },
          { code: "12.2.2", label: "Resíduos de Disparo de Arma de Fogo" },
          { code: "12.2.3", label: "Fuligem/Hollagem" },
        ],
      },
      {
        code: "12.3",
        label: "Quanto aos Efeitos do Disparo no Alvo",
        subdivisions: [
          { code: "12.3.1", label: "Perfurações" },
          { code: "12.3.2", label: "Danos e Deformações" },
          { code: "12.3.3", label: "Marcas de ricochete" },
        ],
      },
      {
        code: "12.4",
        label: "Vestígios Associados",
        subdivisions: [
          { code: "12.4.1", label: "Impressões digitais" },
          { code: "12.4.2", label: "Material genético (DNA)" },
          { code: "12.4.3", label: "Fibras e pelos" },
          { code: "12.4.4", label: "Micro vestígios" },
        ],
      },
    ],
  },
  {
    code: "13",
    label: "Geral",
    groups: [
      {
        code: "13",
        label: "Geral",
        facets: [
          {
            code: "[Descrição]",
            label:
              "Vestígios ainda não enquadrados em classificação específica.",
            requiresDescription: true,
          },
        ],
      },
    ],
  },
];
