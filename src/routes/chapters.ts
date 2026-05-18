import { Router } from 'express'
import { supabase } from '../db'

export const chapterRoutes = Router()

chapterRoutes.get('/', async (req, res) => {
  const novelId = req.query.novel_id as string
  if (!novelId) { res.status(400).json({ error: 'novel_id required' }); return }
  const { data, error } = await supabase.from('chapters').select('*').eq('novel_id', novelId).eq('user_id', req.userId!)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

chapterRoutes.post('/', async (req, res) => {
  const { novel_id, volume_id, title, content, sort_order, client_id } = req.body
  const { data, error } = await supabase.from('chapters').insert({
    novel_id, volume_id: volume_id || null, user_id: req.userId!, client_id, title,
    content: content || '', sort_order: sort_order || 0,
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

chapterRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('chapters').select('*').eq('id', req.params.id).eq('user_id', req.userId!).single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

chapterRoutes.put('/:id', async (req, res) => {
  const { title, content, word_count, status, volume_id, sort_order } = req.body
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (content !== undefined) updates.content = content
  if (word_count !== undefined) updates.word_count = word_count
  if (status !== undefined) updates.status = status
  if (volume_id !== undefined) updates.volume_id = volume_id
  if (sort_order !== undefined) updates.sort_order = sort_order
  const { data, error } = await supabase.from('chapters').update(updates).eq('id', req.params.id).eq('user_id', req.userId!).select().single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

chapterRoutes.delete('/:id', async (req, res) => {
  await supabase.from('chapters').delete().eq('id', req.params.id).eq('user_id', req.userId!)
  res.json({ ok: true })
})
