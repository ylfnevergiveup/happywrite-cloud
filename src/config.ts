import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET!,
}

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
