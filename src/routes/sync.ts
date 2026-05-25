import { Router } from 'express'
import { supabase } from '../db'

export const syncRoutes = Router()

const tables = ['novels', 'chapters', 'characters', 'outline_nodes', 'world_settings', 'style_skills', 'settings']

// VIP gate middleware
syncRoutes.use(async (req, res, next) => {
  try {
    const { data: vip } = await supabase
      .from('vip_status')
      .select('expires_at')
      .eq('user_id', req.userId!)
      .maybeSingle()

    if (!vip || new Date(vip.expires_at) < new Date()) {
      res.status(403).json({ error: 'VIP 已过期，请续费后使用云同步功能', code: 'VIP_REQUIRED' })
      return
    }
    next()
  } catch {
    res.status(500).json({ error: 'VIP 状态检查失败' })
  }
})

syncRoutes.post('/push', async (req, res) => {
  try {
    const { table, rows } = req.body
    if (!tables.includes(table)) { res.status(400).json({ error: 'Invalid table' }); return }

    const results: Record<number, string> = {}
    for (const row of rows) {
      const { client_id, client_updated_at, id, ...data } = row
      data.user_id = req.userId!

      if (id && typeof id === 'string' && id.length === 36) {
        // UUID → update
        await supabase.from(table).update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', req.userId!)
        results[client_id] = id
      } else {
        // Insert
        const { data: inserted } = await supabase.from(table).insert({ ...data, client_id, client_updated_at }).select('id').single()
        if (inserted) results[client_id] = inserted.id
      }
    }
    res.json({ ok: true, server_ids: results })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

syncRoutes.post('/pull', async (req, res) => {
  try {
    const { table, last_sync_at } = req.body
    if (!tables.includes(table)) { res.status(400).json({ error: 'Invalid table' }); return }

    let query = supabase.from(table).select('*').eq('user_id', req.userId!)
    if (last_sync_at) {
      query = query.gt('updated_at', last_sync_at)
    }
    const { data } = await query.order('updated_at')
    res.json({ rows: data, server_time: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

syncRoutes.get('/status', async (_req, res) => {
  res.json({ status: 'ok', server_time: new Date().toISOString() })
})
