import { Router } from 'express'
import { supabase } from '../db'

export const styleSkillRoutes = Router()

styleSkillRoutes.get('/', async (req, res) => {
  const novelId = req.query.novel_id as string
  if (!novelId) { res.status(400).json({ error: 'novel_id required' }); return }
  const { data, error } = await supabase.from('style_skills').select('*').eq('novel_id', novelId).eq('user_id', req.userId!)
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

styleSkillRoutes.post('/', async (req, res) => {
  const { novel_id, name, source_type, source_text, style_profile, client_id } = req.body
  const { data, error } = await supabase.from('style_skills').insert({
    novel_id, user_id: req.userId!, client_id, name,
    source_type: source_type || 'paste', source_text: source_text || '', style_profile: style_profile || '',
  }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

styleSkillRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('style_skills').select('*').eq('id', req.params.id).eq('user_id', req.userId!).single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

styleSkillRoutes.put('/:id', async (req, res) => {
  const updates: Record<string, any> = {}
  if (req.body.name !== undefined) updates.name = req.body.name
  if (req.body.style_profile !== undefined) updates.style_profile = req.body.style_profile
  if (req.body.is_default !== undefined) updates.is_default = req.body.is_default
  if (req.body.source_text !== undefined) updates.source_text = req.body.source_text
  const { data, error } = await supabase.from('style_skills').update(updates).eq('id', req.params.id).eq('user_id', req.userId!).select().single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

styleSkillRoutes.delete('/:id', async (req, res) => {
  await supabase.from('style_skills').delete().eq('id', req.params.id).eq('user_id', req.userId!)
  res.json({ ok: true })
})
