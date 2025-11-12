import { Injectable, Inject } from "@nestjs/common";
import {
  DesarquivamentoDomain,
  DesarquivamentoId,
  IDesarquivamentoRepository,
} from "../../../domain";
import { DESARQUIVAMENTO_REPOSITORY_TOKEN } from "../../../domain/nugecid.constants";

export interface GenerateTermoEntregaRequest {
  id: number;
  userId: number;
  userRoles: string[];
  templateOptions?: {
    incluirObservacoes?: boolean;
    incluirLocalizacao?: boolean;
    logoPath?: string;
    assinatura?: {
      nome: string;
      cargo: string;
      data?: Date;
    };
  };
}

export interface GenerateTermoEntregaResponse {
  pdfBuffer: Buffer;
  fileName: string;
  contentType: string;
  generatedAt: Date;
}

export interface TermoEntregaData {
  desarquivamento: {
    id: number;
    numeroNicLaudoAuto: string;
    numeroProcesso: string;
    tipoDesarquivamento: string;
    nomeCompleto: string;
    tipoDocumento: string;
    dataSolicitacao: Date;
    finalidadeDesarquivamento: string;
    setorDemandante: string;
    servidorResponsavel: string;
    urgente: boolean;
  };
  entrega: {
    dataEntrega: Date;
    responsavel: {
      nome: string;
      cargo: string;
    };
    recebedor: {
      nome: string;
      documento?: string;
      assinatura?: string;
    };
  };
  instituicao: {
    nome: string;
    endereco: string;
    telefone?: string;
    email?: string;
    logo?: string;
  };
}

@Injectable()
export class GenerateTermoEntregaUseCase {
  constructor(
    @Inject(DESARQUIVAMENTO_REPOSITORY_TOKEN)
    private readonly desarquivamentoRepository: IDesarquivamentoRepository,
  ) {}

  async execute(
    request: GenerateTermoEntregaRequest,
  ): Promise<GenerateTermoEntregaResponse> {
    // Validar entrada
    this.validateRequest(request);

    // Buscar desarquivamento
    const desarquivamentoId = DesarquivamentoId.create(request.id);
    const desarquivamento =
      await this.desarquivamentoRepository.findById(desarquivamentoId);

    if (!desarquivamento) {
      throw new Error(`Desarquivamento com ID ${request.id} não encontrado`);
    }

    // Verificar permissões
    if (!desarquivamento.canBeAccessedBy(request.userId, request.userRoles)) {
      throw new Error(
        "Acesso negado: você não tem permissão para gerar termo deste desarquivamento",
      );
    }

    // Verificar se o desarquivamento pode gerar termo
    this.validateDesarquivamentoForTermo(desarquivamento);

    // Preparar dados para o termo
    const termoData = await this.prepareTermoData(desarquivamento, request);

    // Gerar PDF
    const pdfBuffer = await this.generatePDF(
      termoData,
      request.templateOptions,
    );

    // Preparar resposta
    const fileName = this.generateFileName(desarquivamento);

    return {
      pdfBuffer,
      fileName,
      contentType: "application/pdf",
      generatedAt: new Date(),
    };
  }

  private validateRequest(request: GenerateTermoEntregaRequest): void {
    // Validar ID
    if (!request.id || request.id <= 0 || !Number.isInteger(request.id)) {
      throw new Error("ID deve ser um número inteiro positivo");
    }

    // Validar usuário
    if (!request.userId || request.userId <= 0) {
      throw new Error("ID do usuário é obrigatório");
    }

    if (!request.userRoles || !Array.isArray(request.userRoles)) {
      throw new Error("Roles do usuário são obrigatórias");
    }

    // Validar opções de template
    if (request.templateOptions?.assinatura) {
      const { nome, cargo } = request.templateOptions.assinatura;
      if (!nome || nome.trim().length === 0) {
        throw new Error("Nome do responsável pela assinatura é obrigatório");
      }
      if (!cargo || cargo.trim().length === 0) {
        throw new Error("Cargo do responsável pela assinatura é obrigatório");
      }
    }
  }

  private validateDesarquivamentoForTermo(
    desarquivamento: DesarquivamentoDomain,
  ): void {
    // Verificar se está em status apropriado
    if (desarquivamento.status.isPending()) {
      throw new Error(
        "Não é possível gerar termo para desarquivamento pendente",
      );
    }

    // Check if status is appropriate for generating termo
    if (desarquivamento.status.value === "NAO_LOCALIZADO") {
      throw new Error(
        "Não é possível gerar termo para desarquivamento não localizado",
      );
    }

    if (desarquivamento.isDeleted()) {
      throw new Error(
        "Não é possível gerar termo para desarquivamento excluído",
      );
    }
  }

  private async prepareTermoData(
    desarquivamento: DesarquivamentoDomain,
    request: GenerateTermoEntregaRequest,
  ): Promise<TermoEntregaData> {
    const plainObject = desarquivamento.toPlainObject();

    // Dados da instituição (normalmente viriam de configuração)
    const instituicao = {
      nome: "Instituto Técnico-Científico de Perícia - ITEP",
      endereco: "Rua Exemplo, 123 - Centro - Natal/RN",
      telefone: "(84) 3232-3232",
      email: "contato@itep.rn.gov.br",
      logo: request.templateOptions?.logoPath,
    };

    // Dados do responsável (normalmente viria do banco de usuários)
    const responsavel = {
      nome: request.templateOptions?.assinatura?.nome || "Responsável NUGECID",
      cargo: request.templateOptions?.assinatura?.cargo || "Servidor Público",
    };

    return {
      desarquivamento: {
        id: plainObject.id,
        numeroNicLaudoAuto: plainObject.numeroNicLaudoAuto,
        numeroProcesso: plainObject.numeroProcesso,
        tipoDesarquivamento: plainObject.tipoDesarquivamento,
        nomeCompleto: plainObject.nomeCompleto,
        tipoDocumento: plainObject.tipoDocumento,
        dataSolicitacao: plainObject.dataSolicitacao,
        finalidadeDesarquivamento: plainObject.finalidadeDesarquivamento,
        setorDemandante: plainObject.setorDemandante,
        servidorResponsavel: plainObject.servidorResponsavel,
        urgente: plainObject.urgente,
      },
      entrega: {
        dataEntrega: request.templateOptions?.assinatura?.data || new Date(),
        responsavel,
        recebedor: {
          nome: plainObject.nomeCompleto,
          documento: "", // Seria preenchido manualmente
          assinatura: "", // Seria preenchido manualmente
        },
      },
      instituicao,
    };
  }

  private async generatePDF(
    termoData: TermoEntregaData,
    templateOptions?: GenerateTermoEntregaRequest["templateOptions"],
  ): Promise<Buffer> {
    // Aqui seria implementada a geração do PDF usando uma biblioteca como puppeteer, jsPDF, ou PDFKit
    // Por simplicidade, vou retornar um buffer simulado

    const htmlContent = this.generateHTMLTemplate(termoData, templateOptions);

    // Simulação da geração do PDF
    // Em uma implementação real, você usaria:
    // - puppeteer para converter HTML em PDF
    // - PDFKit para criar PDF programaticamente
    // - jsPDF para geração client-side

    const mockPdfContent = `
      TERMO DE ENTREGA DE DOCUMENTO
      
      Número NIC/Laudo/Auto: ${termoData.desarquivamento.numeroNicLaudoAuto}
      Número do Processo: ${termoData.desarquivamento.numeroProcesso}
      Tipo: ${termoData.desarquivamento.tipoDesarquivamento}
      Nome Completo: ${termoData.desarquivamento.nomeCompleto}
      Data de Entrega: ${termoData.entrega.dataEntrega.toLocaleDateString("pt-BR")}
      
      Responsável: ${termoData.entrega.responsavel.nome}
      Cargo: ${termoData.entrega.responsavel.cargo}
      
      Instituição: ${termoData.instituicao.nome}
      ${termoData.instituicao.endereco}
    `;

    // Converter string para Buffer (simulação)
    return Buffer.from(mockPdfContent, "utf-8");
  }

  private generateHTMLTemplate(
    termoData: TermoEntregaData,
    templateOptions?: GenerateTermoEntregaRequest["templateOptions"],
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Termo de Entrega</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 150px; }
          .title { font-size: 18px; font-weight: bold; margin: 20px 0; }
          .content { line-height: 1.6; }
          .field { margin: 10px 0; }
          .signature-area { margin-top: 50px; }
          .signature-line { border-bottom: 1px solid #000; width: 300px; margin: 30px 0 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          ${templateOptions?.logoPath ? `<img src="${templateOptions.logoPath}" class="logo" alt="Logo">` : ""}
          <h1>${termoData.instituicao.nome}</h1>
          <p>${termoData.instituicao.endereco}</p>
          ${termoData.instituicao.telefone ? `<p>Tel: ${termoData.instituicao.telefone}</p>` : ""}
        </div>
        
        <div class="title">TERMO DE ENTREGA DE DOCUMENTO</div>
        
        <div class="content">
          <div class="field"><strong>Número NIC/Laudo/Auto:</strong> ${termoData.desarquivamento.numeroNicLaudoAuto}</div>
          <div class="field"><strong>Número do Processo:</strong> ${termoData.desarquivamento.numeroProcesso}</div>
          <div class="field"><strong>Tipo de Desarquivamento:</strong> ${termoData.desarquivamento.tipoDesarquivamento}</div>
          <div class="field"><strong>Nome Completo:</strong> ${termoData.desarquivamento.nomeCompleto}</div>
          <div class="field"><strong>Tipo de Documento:</strong> ${termoData.desarquivamento.tipoDocumento}</div>
          <div class="field"><strong>Setor Demandante:</strong> ${termoData.desarquivamento.setorDemandante}</div>
          <div class="field"><strong>Servidor Responsável:</strong> ${termoData.desarquivamento.servidorResponsavel}</div>
          ${termoData.desarquivamento.finalidadeDesarquivamento ? `<div class="field"><strong>Finalidade:</strong> ${termoData.desarquivamento.finalidadeDesarquivamento}</div>` : ""}
          <div class="field"><strong>Data de Entrega:</strong> ${termoData.entrega.dataEntrega.toLocaleDateString("pt-BR")}</div>
          ${termoData.desarquivamento.urgente ? '<div class="field"><strong>URGENTE</strong></div>' : ""}
        </div>
        
        <div class="signature-area">
          <div>
            <div class="signature-line"></div>
            <p><strong>${termoData.entrega.responsavel.nome}</strong><br>
            ${termoData.entrega.responsavel.cargo}<br>
            Responsável pela Entrega</p>
          </div>
          
          <div style="margin-top: 40px;">
            <div class="signature-line"></div>
            <p><strong>${termoData.entrega.recebedor.nome}</strong><br>
            Documento: ___________________<br>
            Recebedor</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateFileName(desarquivamento: DesarquivamentoDomain): string {
    const plainObject = desarquivamento.toPlainObject();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const sanitizedNumber = plainObject.numeroNicLaudoAuto.replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );
    return `termo_entrega_${sanitizedNumber}_${timestamp}.pdf`;
  }
}
