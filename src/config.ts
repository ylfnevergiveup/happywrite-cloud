import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET!,
  // Tencent Cloud SMS
  smsSecretId: process.env.SMS_SECRET_ID || '',
  smsSecretKey: process.env.SMS_SECRET_KEY || '',
  smsAppId: process.env.SMS_APP_ID || '',
  smsSignName: process.env.SMS_SIGN_NAME || '',
  smsTemplateId: process.env.SMS_TEMPLATE_ID || '',
  smsDevMode: process.env.SMS_DEV_MODE === 'true',
}

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
