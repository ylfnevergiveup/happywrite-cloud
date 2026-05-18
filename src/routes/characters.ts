import { Router } from 'express'
import { supabase } from '../db'

export const characterRoutes = Router()

characterRoutes.get('/', async (req, res) => {
  const novelId = req.query.novel_id as string
  if (!novelId) { res.status(400).json({ error: 'novel_id required' }); return }
  const { data, error } = await supabase.from('characters').select('*').eq('novel_id', novelId).eq('user_id', req.userId!)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

characterRoutes.post('/', async (req, res) => {
  const { novel_id, name, role, description, client_id } = req.body
  const { data, error } = await supabase.from('characters').insert({
    novel_id, user_id: req.userId!, client_id, name, role: role || '', description: description || '',
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

characterRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('characters').select('*').eq('id', req.params.id).eq('user_id', req.userId!).single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

characterRoutes.put('/:id', async (req, res) => {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const k of ['name', 'role', 'description', 'aliases', 'attributes', 'relationships']) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  const { data, error } = await supabase.from('characters').update(updates).eq('id', req.params.id).eq('user_id', req.userId!).select().single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

characterRoutes.delete('/:id', async (req, res) => {
  await supabase.from('characters').delete().eq('id', req.params.id).eq('user_id', req.userId!)
  res.json({ ok: true })
})
