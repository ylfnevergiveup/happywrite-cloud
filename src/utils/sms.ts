import { config } from '../config'

interface SmsResult {
  success: boolean
  error?: string
}

// Tencent Cloud SMS sender
async function sendTencentSMS(phone: string, code: string): Promise<SmsResult> {
  const { smsSecretId, smsSecretKey, smsAppId, smsSignName, smsTemplateId } = config

  if (!smsSecretId || !smsSecretKey || !smsAppId || !smsSignName || !smsTemplateId) {
    return { success: false, error: 'SMS not configured' }
  }

  try {
    // Tencent Cloud SMS API v2021-01-11
    const timestamp = Math.floor(Date.now() / 1000)
    const host = 'sms.tencentcloudapi.com'
    const service = 'sms'
    const action = 'SendSms'
    const version = '2021-01-11'

    const payload = JSON.stringify({
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: smsAppId,
      SignName: smsSignName,
      TemplateId: smsTemplateId,
      TemplateParamSet: [code, '5'],
    })

    // Simple HMAC-SHA256 signing for Tencent Cloud API v3
    const crypto = await import('crypto')
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10)
    const signedHeaders = 'content-type;host'
    const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex')

    const canonicalRequest = [
      'POST', '/', '',
      `content-type:application/json\nhost:${host}\n`,
      signedHeaders,
      hashedPayload,
    ].join('\n')

    const algorithm = 'TC3-HMAC-SHA256'
    const credentialScope = `${date}/${service}/tc3_request`
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    const stringToSign = [
      algorithm, timestamp.toString(), credentialScope, hashedCanonicalRequest,
    ].join('\n')

    const kDate = crypto.createHmac('sha256', `TC3${smsSecretKey}`).update(date).digest()
    const kService = crypto.createHmac('sha256', kDate).update(service).digest()
    const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest()
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    const authorization = `${algorithm} Credential=${smsSecretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const response = await fetch(`https://${host}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': host,
        'X-TC-Action': action,
        'X-TC-Version': version,
        'X-TC-Timestamp': timestamp.toString(),
        'Authorization': authorization,
      },
      body: payload,
    })

    const result = await response.json() as any
    if (result.Response?.Error) {
      return { success: false, error: result.Response.Error.Message }
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// Send verification code SMS
export async function sendVerificationSMS(phone: string, code: string): Promise<SmsResult> {
  // In dev mode, just log to console
  if (config.smsDevMode) {
    console.log(`[DEV SMS] Verification code for ${phone}: ${code}`)
    return { success: true }
  }

  return sendTencentSMS(phone, code)
}
