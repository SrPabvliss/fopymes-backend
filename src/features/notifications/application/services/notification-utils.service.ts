import { INotification, NotificationType } from "../../domain/entities/INotification";
import { INotificationRepository } from "../../domain/ports/notification-repository.port";

export class NotificationUtilsService {
  private static instance: NotificationUtilsService;

  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  public static getInstance(
    notificationRepository: INotificationRepository
  ): NotificationUtilsService {
    if (!NotificationUtilsService.instance) {
      NotificationUtilsService.instance = new NotificationUtilsService(
        notificationRepository
      );
    }
    return NotificationUtilsService.instance;
  }

  async createNotification(
    userId: number,
    title: string,
    subtitle: string | null,
    message: string,
    type: NotificationType,
    expiresAt?: Date | null
  ): Promise<INotification> {
    return await this.notificationRepository.create({
      userId,
      title,
      subtitle,
      message,
      read: false,
      type,
      expiresAt,
    });
  }

  async createGoalNotification(
    userId: number,
    goalName: string,
    progress: number,
    message: string
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `Meta: ${goalName}`,
      `Progreso: ${progress}%`,
      message,
      NotificationType.GOAL,
      this.getExpirationDate(30) // Expira en 30 días
    );
  }

  async createDebtNotification(
    userId: number,
    debtDescription: string,
    dueDate: Date,
    message: string
  ): Promise<INotification> {
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    
    return await this.createNotification(
      userId,
      `Deuda: ${debtDescription}`,
      `Vence en ${daysUntilDue} días`,
      message,
      NotificationType.DEBT,
      this.getExpirationDate(Math.max(daysUntilDue + 1, 7)) // Expira un día después del vencimiento o en 7 días
    );
  }

  async createSuggestionNotification(
    userId: number,
    title: string,
    message: string
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `Sugerencia: ${title}`,
      null,
      message,
      NotificationType.SUGGESTION,
      this.getExpirationDate(15) // Expira en 15 días
    );
  }

  async createWarningNotification(
    userId: number,
    title: string,
    subtitle: string | null,
    message: string
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `Advertencia: ${title}`,
      subtitle,
      message,
      NotificationType.WARNING,
      this.getExpirationDate(7) // Expira en 7 días
    );
  }

  async createCongratulationNotification(
    userId: number,
    achievement: string,
    message: string
  ): Promise<INotification> {
    return await this.createNotification(
      userId,
      `¡Felicitaciones!`,
      achievement,
      message,
      NotificationType.CONGRATULATION,
      this.getExpirationDate(30) // Expira en 30 días
    );
  }

  async deleteExpiredNotifications(): Promise<number> {
    return await this.notificationRepository.deleteExpired();
  }

  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
