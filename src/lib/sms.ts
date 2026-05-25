// src/lib/sms.ts
// BaiteConnect — Africa's Talking SMS Gateway

interface SmsResult {
  success:    boolean
  messageId?: string
  cost?:      string
  error?:     string
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendSms(to: string, message: string): Promise<SmsResult> {
  const username = process.env.AFRICAS_TALKING_USERNAME
  const apiKey   = process.env.AFRICAS_TALKING_API_KEY
  const senderId = process.env.AFRICAS_TALKING_SMS_SENDER_ID ?? 'BAITECONN'

  if (!username || !apiKey) {
    console.warn('[SMS] Africa\'s Talking credentials not configured — skipping SMS')
    return { success: true, messageId: 'DEV-SKIP' }
  }

  const body = new URLSearchParams({
    username,
    to,
    message,
    from: senderId,
  })

  try {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method:  'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey':        apiKey,
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `AT API ${res.status}: ${text}` }
    }

    const data = await res.json() as {
      SMSMessageData: { Recipients: Array<{ messageId: string; cost: string; status: string }> }
    }

    const recipient = data.SMSMessageData?.Recipients?.[0]
    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId, cost: recipient.cost }
    }

    return { success: false, error: `Delivery failed: ${recipient?.status}` }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

export async function sendOtpSms(phoneNumber: string, fullName: string): Promise<{ otp: string; result: SmsResult }> {
  const otp     = generateOtp()
  const message =
    `BaiteConnect - Meru County\n` +
    `Habari ${fullName.split(' ')[0]},\n` +
    `Your verification code is: ${otp}\n` +
    `Valid for 10 minutes. Do not share this code.\n` +
    `baiteconnect.meru.go.ke`

  const result = await sendSms(phoneNumber, message)
  return { otp, result }
}

export async function sendSubmissionConfirmation(
  phoneNumber: string,
  firstName:   string,
  referenceCode: string,
  wardName:    string,
  sector:      string
): Promise<SmsResult> {
  const message =
    `BaiteConnect - Meru County\n` +
    `Confirmed, ${firstName}! Your budget memo for ${wardName} Ward (${sector} sector) has been received.\n` +
    `Reference: ${referenceCode}\n` +
    `You will be notified when reviewed by the County Finance team.\n` +
    `baiteconnect.meru.go.ke`

  return sendSms(phoneNumber, message)
}

export async function sendProjectUpdateSms(
  phoneNumber: string,
  firstName:   string,
  projectTitle: string,
  newStage:    string
): Promise<SmsResult> {
  const message =
    `BaiteConnect - Meru County\n` +
    `Update for ${firstName}: "${projectTitle}" has moved to stage: ${newStage}.\n` +
    `Track progress: baiteconnect.meru.go.ke/projects`

  return sendSms(phoneNumber, message)
}

export async function sendWhistleblowerAck(
  phoneNumber: string,
  firstName:   string,
  projectTitle: string
): Promise<SmsResult> {
  const message =
    `BaiteConnect - Meru County\n` +
    `Report received, ${firstName}. Your delivery concern for "${projectTitle}" has been escalated to the County Project Delivery Unit.\n` +
    `Ref: WB-${Date.now().toString(36).toUpperCase()}\n` +
    `baiteconnect.meru.go.ke`

  return sendSms(phoneNumber, message)
}
