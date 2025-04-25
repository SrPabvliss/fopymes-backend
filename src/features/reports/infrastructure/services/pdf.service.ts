import { Report, ReportType } from "../../domain/entities/report.entity";
import { PDFDocument } from "pdfkit";

export class PDFService {
  async generatePDF(report: Report): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));

    // Add title
    doc.fontSize(20).text("Report", { align: "center" });
    doc.moveDown();

    switch (report.type) {
      case ReportType.GOALS_BY_STATUS:
        await this.formatGoalsByStatus(doc, report.data);
        break;
      case ReportType.GOALS_BY_CATEGORY:
        await this.formatGoalsByCategory(doc, report.data);
        break;
      case ReportType.CONTRIBUTIONS_BY_GOAL:
        await this.formatContributionsByGoal(doc, report.data);
        break;
      case ReportType.SAVINGS_COMPARISON:
        await this.formatSavingsComparison(doc, report.data);
        break;
      case ReportType.SAVINGS_SUMMARY:
        await this.formatSavingsSummary(doc, report.data);
        break;
      default:
        throw new Error(
          `Unsupported report type for PDF export: ${report.type}`
        );
    }

    doc.end();

    return Buffer.concat(chunks as unknown as Uint8Array[]);
  }

  private async formatGoalsByStatus(doc: PDFDocument, data: any) {
    // Add goal data
    doc.fontSize(16).text("Goals by Status");
    doc.moveDown();

    data.goals.forEach((goal: any) => {
      doc.fontSize(12).text(`Goal: ${goal.name}`);
      doc.fontSize(10).text(`Status: ${goal.status}`);
      doc.text(`Target Amount: ${goal.targetAmount}`);
      doc.text(`Current Amount: ${goal.currentAmount}`);
      doc.text(`Progress: ${goal.progress}%`);
      doc.text(`Deadline: ${goal.deadline}`);
      doc.moveDown();
    });

    // Add summary
    doc.fontSize(14).text("Summary");
    doc.fontSize(10).text(`Total Goals: ${data.total}`);
    doc.text(`Completed Goals: ${data.completed}`);
    doc.text(`Expired Goals: ${data.expired}`);
    doc.text(`In Progress Goals: ${data.inProgress}`);
  }

  private async formatGoalsByCategory(doc: PDFDocument, data: any) {
    doc.fontSize(16).text("Goals by Category");
    doc.moveDown();

    data.categories.forEach((category: any) => {
      doc.fontSize(14).text(`Category: ${category.name}`);
      doc.fontSize(10).text(`Total Goals: ${category.totalGoals}`);
      doc.text(`Total Amount: ${category.totalAmount}`);
      doc.text(`Completed Amount: ${category.completedAmount}`);
      doc.text(`Progress: ${category.progress}%`);
      doc.moveDown();

      doc.fontSize(12).text("Goals in this category:");
      category.goals.forEach((goal: any) => {
        doc.fontSize(10).text(`- ${goal.name}`);
        doc.text(`  Target Amount: ${goal.targetAmount}`);
        doc.text(`  Current Amount: ${goal.currentAmount}`);
        doc.text(`  Progress: ${goal.progress}%`);
      });
      doc.moveDown();
    });
  }

  private async formatContributionsByGoal(doc: PDFDocument, data: any) {
    doc.fontSize(16).text("Contributions by Goal");
    doc.moveDown();

    doc.fontSize(14).text(`Goal: ${data.goalName}`);
    doc.moveDown();

    doc.fontSize(12).text("Contributions:");
    data.contributions.forEach((contribution: any) => {
      doc.fontSize(10).text(`Date: ${contribution.date}`);
      doc.text(`Amount: ${contribution.amount}`);
      doc.text(`Transaction ID: ${contribution.transactionId}`);
      doc.moveDown();
    });

    doc.fontSize(12).text("Summary:");
    doc.fontSize(10).text(`Total Contributions: ${data.totalContributions}`);
    doc.text(`Average Contribution: ${data.averageContribution}`);
    doc.text(`Last Contribution: ${data.lastContributionDate}`);
  }

  private async formatSavingsComparison(doc: PDFDocument, data: any) {
    doc.fontSize(16).text("Savings Comparison");
    doc.moveDown();

    doc.fontSize(14).text(`Goal: ${data.goalName}`);
    doc.moveDown();

    doc.fontSize(12).text("Deviations:");
    data.deviations.forEach((deviation: any) => {
      doc.fontSize(10).text(`Date: ${deviation.date}`);
      doc.text(`Planned Amount: ${deviation.plannedAmount}`);
      doc.text(`Actual Amount: ${deviation.actualAmount}`);
      doc.text(`Difference: ${deviation.difference}`);
      doc.moveDown();
    });
  }

  private async formatSavingsSummary(doc: PDFDocument, data: any) {
    doc.fontSize(16).text("Savings Summary");
    doc.moveDown();

    doc.fontSize(12).text("Overall Metrics:");
    doc.fontSize(10).text(`Total Goals: ${data.totalGoals}`);
    doc.text(`Total Target Amount: ${data.totalTargetAmount}`);
    doc.text(`Total Current Amount: ${data.totalCurrentAmount}`);
    doc.text(`Overall Progress: ${data.overallProgress}%`);
    doc.text(`Completed Goals: ${data.completedGoals}`);
    doc.text(`Expired Goals: ${data.expiredGoals}`);
    doc.text(`In Progress Goals: ${data.inProgressGoals}`);
    doc.text(`Average Contribution: ${data.averageContribution}`);
    doc.text(`Last Contribution Date: ${data.lastContributionDate}`);
    doc.moveDown();

    doc.fontSize(12).text("Category Breakdown:");
    data.categoryBreakdown.forEach((category: any) => {
      doc.fontSize(10).text(`Category: ${category.categoryName}`);
      doc.text(`Total Goals: ${category.totalGoals}`);
      doc.text(`Total Amount: ${category.totalAmount}`);
      doc.text(`Progress: ${category.progress}%`);
      doc.moveDown();
    });
  }
}
