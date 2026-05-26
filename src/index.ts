import express from 'express'
import path from 'path'
import cors from 'cors'
import { config } from './config'
import { authMiddleware } from './middleware/auth'
import { novelRoutes } from './routes/novels'
import { chapterRoutes } from './routes/chapters'
import { characterRoutes } from './routes/characters'
import { outlineRoutes } from './routes/outlines'
import { worldSettingRoutes } from './routes/worldSettings'
import { styleSkillRoutes } from './routes/styleSkills'
import { settingRoutes } from './routes/settings'
import { syncRoutes } from './routes/sync'
import { authRoutes } from './routes/auth'
import { activationRoutes } from './routes/activation'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Health check (no auth)
app.get('/health', (_req, res) => { res.json({ ok: true }) })

// Static files (admin page, etc.)
app.use(express.static(path.join(new URL('.', import.meta.url).pathname, '..', 'public')))

// Auth routes + activation admin (no auth required)
app.use('/api/auth', authRoutes)

import crypto from 'crypto'
import { supabase } from './config'

// Admin activation routes (no auth, for admin.html)
app.post('/api/activation/admin/generate', async (req, res) => {
  try {
    const { type = 'vip_month', durationDays = 30, count = 1, note = '' } = req.body
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = 'HW-' + crypto.randomBytes(4).toString('hex').toUpperCase()
      await supabase.from('activation_codes').insert({ code, type, duration_days: durationDays, note })
      codes.push(code)
    }
    res.json({ success: true, codes })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.get('/api/activation/admin/list', async (_req, res) => {
  try {
    const { data } = await supabase.from('activation_codes').select('*').order('created_at', { ascending: false }).limit(200)
    res.json({ success: true, codes: data || [] })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// All other API routes require auth
app.use('/api', authMiddleware)
app.use('/api/novels', novelRoutes)
app.use('/api/chapters', chapterRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/outlines', outlineRoutes)
app.use('/api/world-settings', worldSettingRoutes)
app.use('/api/style-skills', styleSkillRoutes)
app.use('/api/settings', settingRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/activation', activationRoutes)

app.listen(config.port, () => {
  console.log(`HappyWrite Cloud running on port ${config.port}`)
})
