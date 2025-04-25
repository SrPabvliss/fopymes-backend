import {
  Report,
  ReportFormat,
  ReportType,
} from "../../domain/entities/report.entity";
import { ReportRepository } from "../../domain/repositories/report.repository";
import { DatabaseConnection } from "@/db";
import { v4 as uuidv4 } from "uuid";

export class PgReportRepository implements ReportRepository {
  private static instance: PgReportRepository;
  private db = DatabaseConnection.getInstance();

  private constructor() {}

  public static getInstance(): PgReportRepository {
    if (!PgReportRepository.instance) {
      PgReportRepository.instance = new PgReportRepository();
    }
    return PgReportRepository.instance;
  }

  async save(report: Report): Promise<Report> {
    const query = `
      INSERT INTO reports (id, type, format, filters, data, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      report.id || uuidv4(),
      report.type,
      report.format,
      JSON.stringify(report.filters),
      JSON.stringify(report.data),
      report.createdAt,
      report.expiresAt,
    ];

    const result = await this.db.getPool().query(query, values);
    return this.mapToReport(result.rows[0]);
  }

  async findById(id: string): Promise<Report | null> {
    const query = "SELECT * FROM reports WHERE id = $1";
    const result = await this.db.getPool().query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToReport(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = "DELETE FROM reports WHERE id = $1";
    await this.db.getPool().query(query, [id]);
  }

  async deleteExpired(): Promise<void> {
    const query = "DELETE FROM reports WHERE expires_at < NOW()";
    await this.db.getPool().query(query);
  }

  private mapToReport(row: any): Report {
    return {
      id: row.id,
      type: row.type as ReportType,
      format: row.format as ReportFormat,
      filters: JSON.parse(row.filters),
      data: JSON.parse(row.data),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }
}
