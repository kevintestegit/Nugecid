import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createHash } from "crypto";

import { Auditoria } from "./entities/auditoria.entity";

export const AUDIT_GENESIS_HASH = "genesis";

@Injectable()
export class AuditHashService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  /**
   * Computes a new audit record's hash and links it to the previous audit row.
   * Call this BEFORE saving the record to maintain an append-only tamper-evident chain.
   *
   * The chain links every row to the hash of the previous row. Altering any row
   * (other than the last) breaks the chain on the next verification because the
   * subsequent row's previousHash would no longer match.
   */
  async prepareHash(audit: Partial<Auditoria>): Promise<Partial<Auditoria>> {
    const previousHash = await this.getPreviousHash();

    const auditWithLink = this.auditoriaRepository.create({
      ...audit,
      previousHash,
    });

    const hash = this.computeHash(auditWithLink);

    return {
      ...auditWithLink,
      hash,
    };
  }

  /**
   * Verifies the integrity of the last N records in the chain.
   * Returns the first record that fails verification, or null if all match.
   *
   * Verification checks that:
   * 1. record.hash === computeHash(record) (record was not tampered)
   * 2. record.previousHash === previousRecord.hash (chain link is intact)
   */
  async verifyChain(limit = 100): Promise<{
    valid: boolean;
    firstInvalidRecord: Pick<Auditoria, "id" | "hash"> | null;
    totalChecked: number;
  }> {
    const records = await this.auditoriaRepository.find({
      order: { id: "ASC" },
      take: limit,
      select: [
        "id",
        "previousHash",
        "hash",
        "userId",
        "action",
        "entityName",
        "entityId",
        "details",
        "ipAddress",
        "userAgent",
        "success",
        "error",
        "timestamp",
      ],
    });

    if (records.length === 0) {
      return { valid: true, firstInvalidRecord: null, totalChecked: 0 };
    }

    let previousHash = AUDIT_GENESIS_HASH;
    for (const record of records) {
      if (record.previousHash !== previousHash) {
        return {
          valid: false,
          firstInvalidRecord: { id: record.id, hash: record.hash },
          totalChecked: records.length,
        };
      }

      const expectedHash = this.computeHash(record);
      if (record.hash !== expectedHash) {
        return {
          valid: false,
          firstInvalidRecord: { id: record.id, hash: record.hash },
          totalChecked: records.length,
        };
      }

      previousHash = record.hash;
    }

    return {
      valid: true,
      firstInvalidRecord: null,
      totalChecked: records.length,
    };
  }

  private async getPreviousHash(): Promise<string> {
    const lastRecord = await this.auditoriaRepository.findOne({
      where: {},
      order: { id: "DESC" },
      select: ["hash"],
    });

    return lastRecord?.hash ?? AUDIT_GENESIS_HASH;
  }

  private computeHash(audit: Partial<Auditoria>): string {
    const payload = {
      previousHash: audit.previousHash ?? AUDIT_GENESIS_HASH,
      userId: audit.userId,
      action: audit.action,
      entityName: audit.entityName,
      entityId: audit.entityId,
      details: audit.details,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      success: audit.success,
      error: audit.error,
      timestamp:
        audit.timestamp instanceof Date
          ? audit.timestamp.toISOString()
          : audit.timestamp,
    };

    const sortKeys = (obj: unknown): unknown => {
      if (obj === null || obj === undefined || typeof obj !== "object")
        return obj;
      if (Array.isArray(obj)) return obj.map(sortKeys);
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(obj).sort()) {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
      }
      return sorted;
    };
    const canonical = JSON.stringify(sortKeys(payload));
    return createHash("sha256").update(canonical).digest("hex");
  }
}
