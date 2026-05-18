import { Router } from 'express'
import { supabase } from '../db'

export const outlineRoutes = Router()

outlineRoutes.get('/', async (req, res) => {
  const novelId = req.query.novel_id as string
  if (!novelId) { res.status(400).json({ error: 'novel_id required' }); return }
  const { data, error } = await supabase.from('outline_nodes').select('*').eq('novel_id', novelId).eq('user_id', req.userId!)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

outlineRoutes.post('/', async (req, res) => {
  const { novel_id, parent_id, title, description, type, sort_order, client_id } = req.body
  const { data, error } = await supabase.from('outline_nodes').insert({
    novel_id, parent_id: parent_id || null, user_id: req.userId!, client_id,
    title, description: description || '', type: type || 'scene', sort_order: sort_order || 0,
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

outlineRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('outline_nodes').select('*').eq('id', req.params.id).eq('user_id', req.userId!).single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

outlineRoutes.put('/:id', async (req, res) => {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const k of ['title', 'description', 'type', 'sort_order']) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  if (req.body.parent_id !== undefined) updates.parent_id = req.body.parent_id
  if (req.body.chapter_id !== undefined) updates.chapter_id = req.body.chapter_id
  const { data, error } = await supabase.from('outline_nodes').update(updates).eq('id', req.params.id).eq('user_id', req.userId!).select().single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

outlineRoutes.delete('/:id', async (req, res) => {
  await supabase.from('outline_nodes').delete().eq('id', req.params.id).eq('user_id', req.userId!)
  res.json({ ok: true })
})
