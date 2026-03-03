import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import * as multer from "multer";
import {
  DEFAULT_DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
  FileValidator,
} from "../../common/utils/file-validator";

// Controller
import { NugecidController } from "./nugecid.controller";
import {
  AnexosController,
  AnexosProcessoController,
  AnexosProcessoQueryController,
} from "./controllers/anexos.controller";

// Modules
import { AuthModule } from "../auth/auth.module";
import { NotificacoesModule } from "../notificacoes/notificacoes.module";
import { SecurityModule } from "../security/security.module";
import { OcrModule } from "../ocr/ocr.module";

// Use Cases
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
import { DesarquivamentoEffectsPublisher } from "./application/services/desarquivamento-effects.publisher";

// Infrastructure
import { DesarquivamentoRepositoryModule } from "./infrastructure/desarquivamento-repository.module";
import { DesarquivamentoTypeOrmEntity } from "./infrastructure/entities/desarquivamento.typeorm-entity";
import { DesarquivamentoCommentTypeOrmEntity } from "./infrastructure/entities/desarquivamento-comment.typeorm-entity";
import { DesarquivamentoAnexoTypeOrmEntity } from "./infrastructure/entities/desarquivamento-anexo.typeorm-entity";

// Legacy entities (for compatibility) - using proper infrastructure entities
// import { Desarquivamento } from './entities/desarquivamento.entity'; // REMOVED - legacy entity
import { User } from "../users/entities/user.entity";
import { Auditoria } from "../audit/entities/auditoria.entity";

// New Services
import { NugecidImportService } from "./nugecid-import.service";
import { NugecidStatsService } from "./nugecid-stats.service";
import { NugecidPdfService } from "./nugecid-pdf.service";
import { NugecidExportService } from "./nugecid-export.service";
import { NugecidAuditService } from "./nugecid-audit.service";
import { NugecidDocxService } from "./nugecid-docx.service";
import { NugecidAnexosService } from "./nugecid-anexos.service";

// Legacy service (for gradual migration)
import { NugecidService } from "./nugecid.service";

@Module({
  imports: [
    DesarquivamentoRepositoryModule,
    TypeOrmModule.forFeature([
      DesarquivamentoTypeOrmEntity,
      DesarquivamentoCommentTypeOrmEntity,
      DesarquivamentoAnexoTypeOrmEntity,
      User,
      Auditoria,
    ]),
    AuthModule,
    SecurityModule,
    OcrModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (FileValidator.isAllowedImageOrDocumentMimeType(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Apenas imagens, PDFs, documentos Word/Excel e arquivos de texto são permitidos.",
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: DEFAULT_DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
      },
    }),
    NotificacoesModule,
  ],
  controllers: [
    NugecidController,
    AnexosController,
    AnexosProcessoQueryController,
    AnexosProcessoController,
  ],
  providers: [
    // Use Cases
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
    DesarquivamentoEffectsPublisher,

    // New Services
    NugecidImportService,
    NugecidStatsService,
    NugecidPdfService,
    NugecidExportService,
    NugecidAuditService,
    NugecidDocxService,
    NugecidAnexosService,

    // Legacy service
    NugecidService,
  ],
  exports: [
    // Use Cases
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

    // New Services
    NugecidImportService,
    NugecidStatsService,
    NugecidPdfService,
    NugecidAuditService,
    NugecidExportService,
    NugecidDocxService,
    NugecidAnexosService,

    // Repository module
    DesarquivamentoRepositoryModule,

    // TypeORM module
    TypeOrmModule,

    // Legacy service
    NugecidService,
  ],
})
export class NugecidModule {}
