import { createRouter } from "@/core/infrastructure/lib/create-app";
import { ReportFormat, ReportType } from "../../domain/entities/report.entity";
import { z } from "zod";
import { Context } from "hono";
import { PgReportRepository } from "../adapters/report.repository";
import { AppBindings } from "@/core/infrastructure/types/app-types";
import { ReportServiceImpl } from "../../application/services/report.service";
import { PgGoalRepository } from "@/goals/infrastucture/adapters/goal.repository";
import { PgGoalContributionRepository } from "@/goals/infrastucture/adapters/goal-contribution.repository";
import { PgBudgetRepository } from "@/budgets/infrastructure/adapters/budget.repository";
import { PgTransactionRepository } from "@/transactions/infrastructure/adapters/transaction.repository";
import { createHandler } from "@/core/infrastructure/lib/handler.wrapper,";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { Data } from "hono/dist/types/context";
import { ExcelService } from "../services/excel.service";
import { CSVService } from "../services/csv.service";
import { CleanupReportsCron } from "../cron/cleanup-reports.cron";

const reportRepository = PgReportRepository.getInstance();
const goalRepository = PgGoalRepository.getInstance();
const goalContributionRepository = PgGoalContributionRepository.getInstance();
const budgetRepository = PgBudgetRepository.getInstance();
const transactionRepository = PgTransactionRepository.getInstance();
const excelService = new ExcelService();
const csvService = new CSVService();

const reportService = ReportServiceImpl.getInstance(
  reportRepository,
  goalRepository,
  goalContributionRepository,
  budgetRepository,
  transactionRepository,
  excelService,
  csvService
);

const reportFiltersSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    categoryId: z.string().optional(),
    userId: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
  }));

const generateReportSchema = z.object({
  type: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat),
  filters: reportFiltersSchema,
});

const generateReportHandler = createHandler(async (c: Context<AppBindings>) => {
  try {
    const { type, format, filters } = await c.req.json();

    const report = await reportService.generateReport(type, format, filters);
    return c.json(
      {
        success: true,
        data: {
          id: report.id?.toString() || "",
          type: report.type,
          format: report.format,
          createdAt: report.createdAt?.toISOString(),
          expiresAt: report.expiresAt?.toISOString(),
        },
        message: "Report generated successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to generate report",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const getReportHandler = createHandler(async (c: Context<AppBindings>) => {
  try {
    const { id } = c.req.param();
    const report = await reportService.getReport(id);

    if (report.format === ReportFormat.PDF) {
      return c.body(report.data as Data, 200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${id}.pdf"`,
      });
    }

    return c.json(
      {
        success: true,
        data: {
          id: report.id,
          type: report.type,
          format: report.format,
          data: report.data,
          createdAt: report.createdAt?.toISOString(),
          expiresAt: report.expiresAt?.toISOString(),
        },
        message: "Report retrieved successfully",
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to get report",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const deleteReportHandler = createHandler(async (c: Context<AppBindings>) => {
  try {
    const { id } = c.req.param();
    await reportService.deleteReport(id);
    return c.body(null, HttpStatusCodes.NO_CONTENT);
  } catch (error) {
    return c.json(
      {
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Failed to delete report",
      },
      HttpStatusCodes.BAD_REQUEST
    );
  }
});

const router = createRouter()
  .openapi(
    {
      path: "/reports",
      method: "post",
      request: {
        body: {
          content: {
            "application/json": {
              schema: generateReportSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Report generated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      format: { type: "string" },
                      createdAt: { type: "string" },
                      expiresAt: { type: "string" },
                    },
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    generateReportHandler
  )
  .openapi(
    {
      path: "/reports/{id}",
      method: "get",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Report retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      format: { type: "string" },
                      data: { type: "object" },
                      createdAt: { type: "string" },
                      expiresAt: { type: "string" },
                    },
                  },
                  message: { type: "string" },
                },
              },
            },
            "application/pdf": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
        400: {
          description: "Report not found",
        },
      },
    },
    getReportHandler
  )
  .openapi(
    {
      path: "/reports/{id}",
      method: "delete",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: {
        204: {
          description: "Report deleted successfully",
        },
      },
    },
    deleteReportHandler
  );

export default router;

// Start cleanup reports cron
const cleanupReportsCron = CleanupReportsCron.getInstance(reportService);
cleanupReportsCron.start();
