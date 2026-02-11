import { Test, TestingModule } from "@nestjs/testing";
import { NugecidController } from "../nugecid.controller";
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
} from "../application/use-cases";
import { NugecidImportService } from "../nugecid-import.service";
import { NugecidStatsService } from "../nugecid-stats.service";
import { NugecidPdfService } from "../nugecid-pdf.service";
import { NugecidExportService } from "../nugecid-export.service";
import { NugecidAuditService } from "../nugecid-audit.service";
import { NugecidDocxService } from "../nugecid-docx.service";
import { NugecidService } from "../nugecid.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";

describe("NugecidController", () => {
  let controller: NugecidController;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [NugecidController],
      providers: [
        { provide: CreateDesarquivamentoUseCase, useValue: {} },
        { provide: FindAllDesarquivamentosUseCase, useValue: {} },
        { provide: FindDesarquivamentoByIdUseCase, useValue: {} },
        { provide: UpdateDesarquivamentoUseCase, useValue: {} },
        { provide: DeleteDesarquivamentoUseCase, useValue: {} },
        { provide: RestoreDesarquivamentoUseCase, useValue: {} },
        { provide: GenerateTermoEntregaUseCase, useValue: {} },
        { provide: GetDashboardStatsUseCase, useValue: {} },
        { provide: ImportDesarquivamentoUseCase, useValue: {} },
        { provide: ImportRegistrosUseCase, useValue: {} },
        { provide: NugecidImportService, useValue: {} },
        { provide: NugecidStatsService, useValue: {} },
        { provide: NugecidPdfService, useValue: {} },
        { provide: NugecidExportService, useValue: {} },
        { provide: NugecidAuditService, useValue: {} },
        { provide: NugecidDocxService, useValue: {} },
        { provide: NugecidService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<NugecidController>(NugecidController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
