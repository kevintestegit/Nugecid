import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bullmq";
import * as fs from "fs";
import * as path from "path";

import { QUEUE_NAMES, DOCUMENT_JOBS } from "../queue.constants";
import {
  GeneratePdfJobData,
  GenerateDocxJobData,
  ExportXlsxJobData,
  GenerateReportPdfJobData,
  GenerateBatchPdfJobData,
} from "../dto/queue-job.dto";
import { NugecidPdfService } from "../../nugecid/nugecid-pdf.service";
import { NugecidDocxService } from "../../nugecid/nugecid-docx.service";
import { NugecidExportService } from "../../nugecid/nugecid-export.service";
import { EstatisticasService } from "../../estatisticas/estatisticas.service";
import { DesarquivamentoTypeOrmEntity } from "../../nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { User } from "../../users/entities/user.entity";
import { QueryDesarquivamentoDto } from "../../nugecid/dto/query-desarquivamento.dto";

type DocumentJobData =
  | GeneratePdfJobData
  | GenerateDocxJobData
  | ExportXlsxJobData
  | GenerateReportPdfJobData
  | GenerateBatchPdfJobData;

@Processor(QUEUE_NAMES.DOCUMENT_GENERATION)
export class DocumentGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentGenerationProcessor.name);
  private readonly outputDir: string;

  constructor(
    private readonly pdfService: NugecidPdfService,
    private readonly docxService: NugecidDocxService,
    private readonly exportService: NugecidExportService,
    private readonly estatisticasService: EstatisticasService,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
    this.outputDir = path.resolve(process.cwd(), "uploads", "generated");
  }

  async process(job: Job<DocumentJobData>): Promise<unknown> {
    this.logger.log(
      `Processing ${job.name} job ${job.id} for userId=${job.data.userId}`,
    );

    try {
      await this.ensureOutputDir();
      await job.updateProgress(10);

      switch (job.name) {
        case DOCUMENT_JOBS.GENERATE_PDF:
          return await this.handleGeneratePdf(job as Job<GeneratePdfJobData>);
        case DOCUMENT_JOBS.GENERATE_DOCX:
          return await this.handleGenerateDocx(job as Job<GenerateDocxJobData>);
        case DOCUMENT_JOBS.EXPORT_XLSX:
          return await this.handleExportXlsx(job as Job<ExportXlsxJobData>);
        case DOCUMENT_JOBS.GENERATE_REPORT_PDF:
          return await this.handleGenerateReportPdf(
            job as Job<GenerateReportPdfJobData>,
          );
        case DOCUMENT_JOBS.GENERATE_BATCH_PDF:
          return await this.handleGenerateBatchPdf(
            job as Job<GenerateBatchPdfJobData>,
          );
        default:
          throw new Error(`Unknown document job type: ${job.name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Document generation job ${job.id} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // ── Handlers ─────────────────────────────────────────────────

  private async handleGeneratePdf(
    job: Job<GeneratePdfJobData>,
  ): Promise<{ filePath: string }> {
    const { desarquivamentoId } = job.data;
    const desarquivamento = await this.loadDesarquivamento(desarquivamentoId);

    await job.updateProgress(30);

    const buffer = await this.pdfService.generatePdf(desarquivamento);

    await job.updateProgress(80);

    const filePath = await this.saveFile(
      buffer,
      `termo_${desarquivamentoId}_${Date.now()}.pdf`,
    );

    await job.updateProgress(100);
    this.logger.log(`PDF generated: ${filePath}`);
    return { filePath };
  }

  private async handleGenerateDocx(
    job: Job<GenerateDocxJobData>,
  ): Promise<{ filePath: string }> {
    const { desarquivamentoId } = job.data;
    const desarquivamento = await this.loadDesarquivamento(desarquivamentoId);

    await job.updateProgress(30);

    const buffer = await this.docxService.generateTermoDocx(desarquivamento);

    await job.updateProgress(80);

    const filePath = await this.saveFile(
      buffer,
      `termo_${desarquivamentoId}_${Date.now()}.docx`,
    );

    await job.updateProgress(100);
    this.logger.log(`DOCX generated: ${filePath}`);
    return { filePath };
  }

  private async handleExportXlsx(
    job: Job<ExportXlsxJobData>,
  ): Promise<{ filePath: string }> {
    const { filters, userId } = job.data;
    const user = await this.loadUser(userId);

    await job.updateProgress(30);

    const queryDto = Object.assign(new QueryDesarquivamentoDto(), filters);
    const buffer = await this.exportService.exportToExcel(queryDto, user);

    await job.updateProgress(80);

    const filePath = await this.saveFile(buffer, `export_${Date.now()}.xlsx`);

    await job.updateProgress(100);
    this.logger.log(`XLSX exported: ${filePath}`);
    return { filePath };
  }

  private async handleGenerateReportPdf(
    job: Job<GenerateReportPdfJobData>,
  ): Promise<{ filePath: string; reportType: string }> {
    const { reportType } = job.data;

    await job.updateProgress(30);

    // Use EstatisticasService to generate report data, then create a simple PDF
    const cardData = await this.estatisticasService.getCardData();

    await job.updateProgress(60);

    // Build a JSON report file (placeholder for a proper PDF rendering pipeline)
    const reportContent = JSON.stringify(
      { reportType, generatedAt: new Date().toISOString(), data: cardData },
      null,
      2,
    );
    const filePath = await this.saveFile(
      Buffer.from(reportContent, "utf-8"),
      `report_${reportType}_${Date.now()}.json`,
    );

    await job.updateProgress(100);
    this.logger.log(`Report generated: ${filePath}`);
    return { filePath, reportType };
  }

  private async handleGenerateBatchPdf(
    job: Job<GenerateBatchPdfJobData>,
  ): Promise<{ filePaths: string[] }> {
    const { desarquivamentoIds } = job.data;
    const filePaths: string[] = [];
    const total = desarquivamentoIds.length;

    for (let i = 0; i < total; i++) {
      const id = desarquivamentoIds[i];
      const desarquivamento = await this.loadDesarquivamento(id);
      const buffer = await this.pdfService.generatePdf(desarquivamento);
      const filePath = await this.saveFile(
        buffer,
        `termo_${id}_${Date.now()}.pdf`,
      );
      filePaths.push(filePath);

      const progress = Math.round(((i + 1) / total) * 100);
      await job.updateProgress(progress);
    }

    this.logger.log(`Batch PDF generated: ${filePaths.length} files`);
    return { filePaths };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private async loadDesarquivamento(
    id: number,
  ): Promise<DesarquivamentoTypeOrmEntity> {
    const entity = await this.desarquivamentoRepository.findOne({
      where: { id },
    });
    if (!entity) {
      throw new Error(`Desarquivamento ${id} not found`);
    }
    return entity;
  }

  private async loadUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["role"],
    });
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    return user;
  }

  private async ensureOutputDir(): Promise<void> {
    if (!fs.existsSync(this.outputDir)) {
      await fs.promises.mkdir(this.outputDir, { recursive: true });
    }
  }

  private async saveFile(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.outputDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }
}
