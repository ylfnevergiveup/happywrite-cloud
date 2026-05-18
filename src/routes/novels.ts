import { Router } from 'express'
import { supabase } from '../db'

export const novelRoutes = Router()

novelRoutes.get('/', async (req, res) => {
  const { data, error } = await supabase.from('novels').select('*').eq('user_id', req.userId!).order('updated_at', { ascending: false })
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

novelRoutes.post('/', async (req, res) => {
  const { title, description, client_id } = req.body
  const { data, error } = await supabase.from('novels').insert({ user_id: req.userId!, client_id, title, description: description || '' }).select().single()
  if (error) { res.status(500).json({ error: error.message }); return }
  res.status(201).json(data)
})

novelRoutes.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('novels').select('*').eq('id', req.params.id).eq('user_id', req.userId!).single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

novelRoutes.put('/:id', async (req, res) => {
  const { title, description } = req.body
  const { data, error } = await supabase.from('novels').update({ title, description, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.userId!).select().single()
  if (error || !data) { res.status(404).json({ error: 'Not found' }); return }
  res.json(data)
})

novelRoutes.delete('/:id', async (req, res) => {
  await supabase.from('novels').delete().eq('id', req.params.id).eq('user_id', req.userId!)
  res.json({ ok: true })
})
