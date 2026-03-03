import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Response, Request as ExpressRequest } from "express";

import { EstatisticasController } from "./estatisticas.controller";
import { EstatisticasService } from "./estatisticas.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

describe("EstatisticasController", () => {
  let controller: EstatisticasController;

  const mockEstatisticasService = {
    getCardData: jest.fn(),
    getRequisicoesPorMes: jest.fn(),
    getStatusDistribuicao: jest.fn(),
    generateRelatorioPdf: jest.fn(),
    generateRelatorioMensalPdf: jest.fn(),
  };

  const createMockResponse = (): Response =>
    ({
      setHeader: jest.fn(),
      send: jest.fn(),
    }) as unknown as Response;

  const createMockRequest = (roleName = "admin"): ExpressRequest =>
    ({
      user: {
        id: 10,
        role: { name: roleName },
      },
    }) as unknown as ExpressRequest;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [EstatisticasController],
      providers: [
        {
          provide: EstatisticasService,
          useValue: mockEstatisticasService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<EstatisticasController>(EstatisticasController);
    jest.clearAllMocks();
  });

  it("deve rejeitar mês inválido no endpoint de PDF mensal", async () => {
    const response = createMockResponse();
    const request = createMockRequest();

    await expect(
      controller.exportPdfMensal(2026, 13, {}, response, request),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      mockEstatisticasService.generateRelatorioMensalPdf,
    ).not.toHaveBeenCalled();
  });

  it("deve rejeitar ano inválido no endpoint de PDF mensal", async () => {
    const response = createMockResponse();
    const request = createMockRequest();

    await expect(
      controller.exportPdfMensal(1999, 2, {}, response, request),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      mockEstatisticasService.generateRelatorioMensalPdf,
    ).not.toHaveBeenCalled();
  });

  it("deve encaminhar exportação mensal válida ao serviço", async () => {
    const response = createMockResponse();
    const request = createMockRequest("usuario");
    const pdfBuffer = Buffer.from("pdf");
    mockEstatisticasService.generateRelatorioMensalPdf.mockResolvedValue(
      pdfBuffer,
    );

    await controller.exportPdfMensal(
      2026,
      2,
      { pagina: undefined, limite: undefined },
      response,
      request,
    );

    expect(
      mockEstatisticasService.generateRelatorioMensalPdf,
    ).toHaveBeenCalledWith(
      2026,
      2,
      { pagina: undefined, limite: undefined },
      10,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="relatorio-mensal-2026-02.pdf"',
    );
    expect(response.send).toHaveBeenCalledWith(pdfBuffer);
  });
});
