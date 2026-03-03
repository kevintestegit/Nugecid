import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { QueueService } from "./queue.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("api/queues")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class QueuesController {
  constructor(private readonly queueService: QueueService) {}

  @Get("stats")
  @HttpCode(HttpStatus.OK)
  async getStats() {
    const stats = await this.queueService.getQueueStats();
    return { success: true, data: stats };
  }

  @Get(":queueName/jobs/:jobId")
  @HttpCode(HttpStatus.OK)
  async getJobStatus(
    @Param("queueName") queueName: string,
    @Param("jobId") jobId: string,
  ) {
    const status = await this.queueService.getJobStatus(queueName, jobId);
    return { success: true, data: status };
  }
}
