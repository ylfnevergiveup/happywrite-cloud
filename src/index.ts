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

// Auth routes (no auth required)
app.use('/api/auth', authRoutes)

// Auth routes + activation admin (no auth required)
app.use('/api/auth', authRoutes)
app.use('/api/activation', activationRoutes)

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

app.listen(config.port, () => {
  console.log(`HappyWrite Cloud running on port ${config.port}`)
})
