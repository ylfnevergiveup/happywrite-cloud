import { Router } from 'express'
import { supabase } from '../db'

export const settingRoutes = Router()

settingRoutes.get('/', async (req, res) => {
  const { data } = await supabase.from('settings').select('*').eq('user_id', req.userId!)
  const result: Record<string, unknown> = {}
  data?.forEach((r) => { result[r.key] = r.value ? JSON.parse(r.value) : null })
  res.json(result)
})

settingRoutes.get('/:key', async (req, res) => {
  const { data } = await supabase.from('settings').select('*').eq('key', req.params.key).eq('user_id', req.userId!).single()
  res.json(data?.value ? JSON.parse(data.value) : null)
})

settingRoutes.put('/:key', async (req, res) => {
  const value = JSON.stringify(req.body.value)
  await supabase.from('settings').upsert({
    user_id: req.userId!, key: req.params.key, value, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,key' })
  res.json({ ok: true })
})

settingRoutes.delete('/:key', async (req, res) => {
  await supabase.from('settings').delete().eq('key', req.params.key).eq('user_id', req.userId!)
  res.json({ ok: true })
})
