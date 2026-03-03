import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import { Response } from "express";

import { NugecidController } from "./nugecid.controller";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  CreateDesarquivamentoUseCase,
  FindAllDesarquivamentosUseCase,
  FindDesarquivamentoByIdUseCase,
  UpdateDesarquivamentoUseCase,
  DeleteDesarquivamentoUseCase,
  RestoreDesarquivamentoUseCase,
  GenerateTermoEntregaUseCase,
  GetDashboardStatsUseCase,
  ImportDesarquivamentoUseCase,
  ImportRegistrosUseCase,
} from "./application/use-cases";
import { NugecidImportService } from "./nugecid-import.service";
import { NugecidStatsService } from "./nugecid-stats.service";
import { NugecidPdfService } from "./nugecid-pdf.service";
import { NugecidExportService } from "./nugecid-export.service";
import { NugecidDocxService } from "./nugecid-docx.service";
import { NugecidService } from "./nugecid.service";
import { NugecidAuditService } from "./nugecid-audit.service";
import { TipoDesarquivamentoEnum } from "./domain/enums/tipo-desarquivamento.enum";
import { AntivirusService } from "../security/antivirus.service";
import { ConfigService } from "@nestjs/config";

describe("NugecidController", () => {
  let controller: NugecidController;
  const mockCreateUseCase = { execute: jest.fn() };
  const mockFindAllUseCase = { execute: jest.fn() };
  const mockFindByIdUseCase = { execute: jest.fn() };
  const mockUpdateUseCase = { execute: jest.fn() };
  const mockDeleteUseCase = { execute: jest.fn() };
  const mockNugecidImportService = { importFromXLSX: jest.fn() };
  const mockNugecidPdfService = { generatePreviewHtml: jest.fn() };
  const mockAuditService = {
    saveDesarquivamentoAudit: jest.fn().mockResolvedValue(undefined),
  };

  const currentUser = {
    id: 2,
    usuario: "editor",
    role: { name: "admin" },
  } as any;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [NugecidController],
      providers: [
        { provide: CreateDesarquivamentoUseCase, useValue: mockCreateUseCase },
        {
          provide: FindAllDesarquivamentosUseCase,
          useValue: mockFindAllUseCase,
        },
        {
          provide: FindDesarquivamentoByIdUseCase,
          useValue: mockFindByIdUseCase,
        },
        { provide: UpdateDesarquivamentoUseCase, useValue: mockUpdateUseCase },
        { provide: DeleteDesarquivamentoUseCase, useValue: mockDeleteUseCase },
        {
          provide: RestoreDesarquivamentoUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GenerateTermoEntregaUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: GetDashboardStatsUseCase, useValue: { execute: jest.fn() } },
        {
          provide: ImportDesarquivamentoUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: ImportRegistrosUseCase, useValue: { execute: jest.fn() } },
        { provide: NugecidImportService, useValue: mockNugecidImportService },
        { provide: NugecidStatsService, useValue: {} },
        { provide: NugecidPdfService, useValue: mockNugecidPdfService },
        { provide: NugecidExportService, useValue: {} },
        { provide: NugecidDocxService, useValue: {} },
        { provide: NugecidService, useValue: {} },
        { provide: NugecidAuditService, useValue: mockAuditService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("http://localhost:3001") },
        },
        {
          provide: AntivirusService,
          useValue: { scanUploadedFile: jest.fn(), scanBuffer: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await moduleBuilder.compile();
    controller = module.get<NugecidController>(NugecidController);
    jest.clearAllMocks();
  });

  it("create deve retornar 201 com payload de sucesso", async () => {
    const dto = {
      desarquivamentoFisicoDigital: TipoDesarquivamentoEnum.FISICO,
      nomeCompleto: "João Silva",
      numeroNicLaudoAuto: "NIC-12345",
      numeroProcesso: "PROC-1",
      tipoDocumento: "Laudo",
      dataSolicitacao: new Date().toISOString(),
      setorDemandante: "Delegacia",
      servidorResponsavel: "Servidor",
      solicitacaoProrrogacao: false,
    };
    const created = { id: 1, ...dto };
    mockCreateUseCase.execute.mockResolvedValue(created);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    await controller.create(
      dto as any,
      currentUser,
      {
        headers: {},
        ip: "127.0.0.1",
        get: jest.fn().mockReturnValue("jest"),
      } as any,
      res,
    );

    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ criadoPorId: currentUser.id }),
    );
    expect(mockAuditService.saveDesarquivamentoAudit).toHaveBeenCalledWith(
      currentUser.id,
      "CREATE",
      created,
      null,
      "127.0.0.1",
      "jest",
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Desarquivamento criado com sucesso",
      data: created,
    });
  });

  it("findAll deve retornar lista paginada", async () => {
    const useCaseResult = {
      data: [{ id: 1 }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    mockFindAllUseCase.execute.mockResolvedValue(useCaseResult);

    const result = await controller.findAll(
      { page: 1, limit: 10 } as any,
      currentUser,
    );

    expect(mockFindAllUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        userId: currentUser.id,
        userRoles: [currentUser.role.name],
        filters: expect.any(Object),
      }),
    );
    expect(result).toEqual({
      success: true,
      data: useCaseResult.data,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it("findOne deve registrar auditoria e retornar sucesso", async () => {
    const entity = { id: 1 };
    mockFindByIdUseCase.execute.mockResolvedValue(entity);
    const req = { ip: "127.0.0.1", get: jest.fn().mockReturnValue("jest") };

    const result = await controller.findOne(1, currentUser, req as any);

    expect(mockFindByIdUseCase.execute).toHaveBeenCalled();
    expect(mockAuditService.saveDesarquivamentoAudit).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: entity });
  });

  it("update e remove devem encaminhar para os use cases", async () => {
    mockFindByIdUseCase.execute.mockResolvedValue({
      id: 1,
      status: "SOLICITADO",
      dataDesarquivamentoSAG: null,
      dataDevolucaoSetor: null,
    });
    mockUpdateUseCase.execute.mockResolvedValue({
      id: 1,
      status: "FINALIZADO",
      dataDesarquivamentoSAG: "2026-02-04T00:00:00.000Z",
      dataDevolucaoSetor: "2026-02-05T00:00:00.000Z",
    });
    mockDeleteUseCase.execute.mockResolvedValue(undefined);

    const req = { ip: "127.0.0.1", get: jest.fn().mockReturnValue("jest") };

    const updateResult = await controller.update(
      1,
      { status: "FINALIZADO" } as any,
      currentUser,
      req as any,
    );
    const removeResult = await controller.remove("1", currentUser);

    expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        status: "FINALIZADO",
        dataDesarquivamentoSAG: expect.any(Date),
        dataDevolucaoSetor: expect.any(Date),
        userId: currentUser.id,
        userRoles: [currentUser.role.name],
      }),
    );
    expect(mockAuditService.saveDesarquivamentoAudit).toHaveBeenCalledWith(
      currentUser.id,
      "UPDATE",
      expect.objectContaining({ id: 1, status: "FINALIZADO" }),
      expect.objectContaining({
        status: { from: "SOLICITADO", to: "FINALIZADO" },
      }),
      "127.0.0.1",
      "jest",
    );
    expect(updateResult).toEqual(
      expect.objectContaining({
        success: true,
        message: "Desarquivamento atualizado com sucesso",
      }),
    );
    expect(mockDeleteUseCase.execute).toHaveBeenCalled();
    expect(removeResult).toEqual(
      expect.objectContaining({
        success: true,
        message: "Desarquivamento removido com sucesso",
      }),
    );
  });

  it("getTermoDeEntregaPreview deve redirecionar para a SPA", async () => {
    const res = {
      redirect: jest.fn(),
    } as any as Response;

    await controller.getTermoDeEntregaPreview(96, res);

    expect(res.redirect).toHaveBeenCalledWith(
      "http://localhost:3001/desarquivamentos/96/termo/visualizar",
    );
  });

  it("importDesarquivamentos deve responder sucesso", async () => {
    const file = {
      buffer: Buffer.from("ok"),
      originalname: "a.xlsx",
      size: 10,
    } as Express.Multer.File;
    const importResult = {
      totalRows: 1,
      successCount: 1,
      errorCount: 0,
      errors: [],
    };
    mockNugecidImportService.importFromXLSX.mockResolvedValue(importResult);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any as Response;

    await controller.importDesarquivamentos(file, currentUser, res);

    expect(mockNugecidImportService.importFromXLSX).toHaveBeenCalledWith(
      file,
      currentUser,
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Importação concluída com sucesso: 1 registros importados.",
      data: importResult,
    });
  });
});
