import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "../payment/payment-logger"

type AlertLevel = "info" | "warning" | "critical"

type AdminAlert = {
  title: string
  message: string
  data?: any
  level: AlertLevel
}

export async function sendAdminAlert(alert: AdminAlert): Promise<boolean> {
  const logger = createPaymentLogger("admin-alerts")
  const supabase = createClient()

  try {
    // Log alert to database
    const { error } = await supabase.from("admin_alerts").insert({
      title: alert.title,
      message: alert.message,
      data: alert.data,
      level: alert.level,
      created_at: new Date().toISOString(),
      read: false,
    })

    if (error) {
      logger.error("Failed to save admin alert", error)
      return false
    }

    // For critical alerts, try to notify admin via other channels if configured
    if (alert.level === "critical") {
      // Get admin notification settings
      const { data: settings } = await supabase
        .from("site_config")
        .select("config")
        .eq("type", "admin_notifications")
        .single()

      if (settings?.config) {
        // Send email notification if configured
        if (settings.config.email_notifications && settings.config.admin_email) {
          // Implementation would depend on your email service
          logger.info("Would send email to admin", {
            email: settings.config.admin_email,
            subject: `[CRITICAL] ${alert.title}`,
          })
        }

        // Send SMS notification if configured
        if (settings.config.sms_notifications && settings.config.admin_phone) {
          // Implementation would depend on your SMS service
          logger.info("Would send SMS to admin", {
            phone: settings.config.admin_phone,
            message: `CRITICAL: ${alert.title}`,
          })
        }
      }
    }

    logger.info("Admin alert sent", {
      title: alert.title,
      level: alert.level,
    })

    return true
  } catch (error) {
    logger.error("Failed to send admin alert", error)
    return false
  }
}
