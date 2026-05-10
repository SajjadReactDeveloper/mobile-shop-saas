import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private config: ConfigService) {}

  async sendWhatsApp(to: string, message: string): Promise<void> {
    const token = this.config.get<string>('WHATSAPP_TOKEN')
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID')

    if (!token || !phoneNumberId) {
      this.logger.warn(`WhatsApp not configured. Would send to ${to}: ${message}`)
      return
    }

    const phone = to.replace(/^\+/, '').replace(/\s/g, '')

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        },
      )

      if (!response.ok) {
        const err = await response.json()
        this.logger.error(`WhatsApp send failed: ${JSON.stringify(err)}`)
      }
    } catch (err) {
      this.logger.error(`WhatsApp send error: ${err}`)
    }
  }
}
