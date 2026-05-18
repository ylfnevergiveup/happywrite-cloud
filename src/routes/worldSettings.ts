import { Router } from 'express'
import { supabase } from '../db'

export const worldSettingRoutes = Router()

worldSettingRoutes.get('/', async (req, res) => {
  const novelId = req.query.novel_id as string
  if (!novelId) { res.status(400).json({ error: 'novel_id required' }); return }
  const { data, error } = await supabase.from('world_settings').select('*').eq('novel_id', novelId).eq('user_id', req.userId!)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

worldSettingRoutes.post('/', async (req, res) => {
  const { novel_id, category, title, content, client_id } = req.body
  const { data, error } = await supabase.from('world_settings').insert({
    novel_id, user_id: req.userId!, client_id, category, title, content: content || '',
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

worldSettingRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('world_settings').select('*').eq('id', req.params.id).eq('user_id', req.userId!).single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

worldSettingRoutes.put('/:id', async (req, res) => {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const k of ['category', 'title', 'content']) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  const { data, error } = await supabase.from('world_settings').update(updates).eq('id', req.params.id).eq('user_id', req.userId!).select().single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

worldSettingRoutes.delete('/:id', async (req, res) => {
  await supabase.from('world_settings').delete().eq('id', req.params.id).eq('user_id', req.userId!)
  res.json({ ok: true })
})
