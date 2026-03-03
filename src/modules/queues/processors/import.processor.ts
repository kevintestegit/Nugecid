import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bullmq";

import { QUEUE_NAMES, IMPORT_JOBS } from "../queue.constants";
import { ImportXlsxJobData } from "../dto/queue-job.dto";
import { NugecidImportService } from "../../nugecid/nugecid-import.service";
import { User } from "../../users/entities/user.entity";

@Processor(QUEUE_NAMES.IMPORT)
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private readonly nugecidImportService: NugecidImportService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async process(job: Job<ImportXlsxJobData>): Promise<unknown> {
    const { fileBase64, originalName, mimeType, fileSize, userId } = job.data;

    this.logger.log(
      `Processing ${job.name} job ${job.id}: file="${originalName}", userId=${userId}`,
    );

    try {
      // Step 1 — Decode the base64 file buffer
      const buffer = Buffer.from(fileBase64, "base64");
      await job.updateProgress(10);

      // Reconstruct a Multer-compatible File object
      const file: Express.Multer.File = {
        fieldname: "file",
        originalname: originalName,
        encoding: "7bit",
        mimetype: mimeType,
        size: fileSize,
        buffer,
        destination: "",
        filename: originalName,
        path: "",
        stream: null as never,
      };

      // Step 2 — Load the user from the database
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ["role"],
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      await job.updateProgress(50);

      // Step 3 — Delegate to the import service
      let result: unknown;
      switch (job.name) {
        case IMPORT_JOBS.IMPORT_XLSX:
          result = await this.nugecidImportService.importFromXLSX(file, user);
          break;
        case IMPORT_JOBS.IMPORT_REGISTROS:
          result = await this.nugecidImportService.importRegistrosFromXLSX(
            file,
            user,
          );
          break;
        default:
          throw new Error(`Unknown import job type: ${job.name}`);
      }

      await job.updateProgress(100);
      this.logger.log(`Import job ${job.id} completed successfully.`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Import job ${job.id} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
