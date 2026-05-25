import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { supabase } from '../config'

export const activationRoutes = Router()

// Activate a code
activationRoutes.post('/activate', async (req: Request, res: Response) => {
  try {
    const { code } = req.body
    const userId = req.userId!

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: '请输入激活码' })
      return
    }

    // Find code
    const { data: activationCode } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()

    if (!activationCode) {
      res.status(400).json({ success: false, error: '激活码无效' })
      return
    }

    if (activationCode.used_by) {
      res.status(400).json({ success: false, error: '该激活码已被使用' })
      return
    }

    const now = new Date()

    // Calculate VIP expiry
    let newExpiresAt: Date
    const { data: existingVip } = await supabase
      .from('vip_status')
      .select('expires_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingVip && new Date(existingVip.expires_at) > now) {
      // Extend from current expiry
      newExpiresAt = new Date(new Date(existingVip.expires_at).getTime() + activationCode.duration_days * 86400000)
    } else {
      // Start from now
      newExpiresAt = new Date(now.getTime() + activationCode.duration_days * 86400000)
    }

    // Mark code as used
    await supabase
      .from('activation_codes')
      .update({ used_by: userId, used_at: now.toISOString() })
      .eq('id', activationCode.id)

    // Upsert VIP status
    await supabase
      .from('vip_status')
      .upsert({
        user_id: userId,
        expires_at: newExpiresAt.toISOString(),
        updated_at: now.toISOString(),
      })

    res.json({
      success: true,
      expiresAt: newExpiresAt.toISOString(),
      message: `VIP 已激活，有效期至 ${newExpiresAt.toLocaleDateString('zh-CN')}`,
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || '激活失败' })
  }
})

// Get VIP status
activationRoutes.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const { data: vip } = await supabase
      .from('vip_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!vip || new Date(vip.expires_at) < new Date()) {
      res.json({ isVip: false, expiresAt: null })
      return
    }

    res.json({
      isVip: true,
      expiresAt: vip.expires_at,
      activatedAt: vip.activated_at,
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Admin: generate activation codes
activationRoutes.post('/admin/generate', async (req: Request, res: Response) => {
  try {
    const { type = 'vip_month', durationDays = 30, count = 1, note = '' } = req.body
    const userId = req.userId!

    // Check if user is admin (simple check: first user or hardcoded)
    // For now, allow any authenticated user to generate codes during dev
    // TODO: add proper admin check

    const codes = []
    for (let i = 0; i < count; i++) {
      const code = 'HW-' + crypto.randomBytes(4).toString('hex').toUpperCase()
      await supabase.from('activation_codes').insert({
        code,
        type,
        duration_days: durationDays,
        note,
      })
      codes.push(code)
    }

    res.json({ success: true, codes })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Admin: list codes
activationRoutes.get('/admin/list', async (req: Request, res: Response) => {
  try {
    const { data } = await supabase
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    res.json({ success: true, codes: data || [] })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message })
  }
})
