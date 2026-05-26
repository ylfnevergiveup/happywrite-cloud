import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { supabase, config } from '../config'
import { sendVerificationSMS } from '../utils/sms'

export const authRoutes = Router()

// Send verification code
authRoutes.post('/phone/send-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      res.status(400).json({ success: false, error: '请输入正确的手机号' })
      return
    }

    // Rate limit: check if code sent within last 60 seconds
    const { data: recent } = await supabase
      .from('verification_codes')
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recent) {
      const secondsSinceLast = (Date.now() - new Date(recent.created_at).getTime()) / 1000
      if (secondsSinceLast < 60) {
        res.status(429).json({ success: false, error: `请 ${Math.ceil(60 - secondsSinceLast)} 秒后再试` })
        return
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // Store code (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    await supabase.from('verification_codes').insert({
      phone,
      code,
      expires_at: expiresAt,
    })

    // Send SMS
    const result = await sendVerificationSMS(phone, code)

    if (!result.success && !config.smsDevMode) {
      res.status(500).json({ success: false, error: '验证码发送失败，请稍后再试' })
      return
    }

    res.json({
      success: true,
      message: '验证码已发送',
      // In dev mode, return the code for testing
      ...(config.smsDevMode ? { devCode: code } : {}),
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || '发送失败' })
  }
})

// Verify code and login/register
authRoutes.post('/phone/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body

    if (!phone || !code) {
      res.status(400).json({ success: false, error: '手机号和验证码不能为空' })
      return
    }

    // Find valid code
    const { data: record } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!record) {
      res.status(400).json({ success: false, error: '验证码错误或已过期' })
      return
    }

    // Mark code as used
    await supabase.from('verification_codes').update({ used: true }).eq('id', record.id)

    // Find or create user — use Supabase Admin API
    const email = `${phone}@phone.happywrite.local`

    // Use a fixed password pattern per phone so user can re-login
    const userPassword = `hw_${phone}_happywrite`

    // Try to sign in first (if user exists with this password)
    let signInResult = await supabase.auth.signInWithPassword({ email, password: userPassword })
    if (signInResult.error) {
      // User doesn't exist or wrong password — create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        phone: `+86${phone}`,
        password: userPassword,
        email_confirm: true,
        user_metadata: { phone, login_method: 'phone' },
      })

      if (createError || !newUser.user) {
        res.status(500).json({ success: false, error: createError?.message || '注册失败' })
        return
      }

      // Sign in with the newly created user
      signInResult = await supabase.auth.signInWithPassword({ email, password: userPassword })
    }

    if (signInResult.error || !signInResult.data.session) {
      res.status(500).json({ success: false, error: '登录失败，请稍后再试' })
      return
    }

    res.json({
      success: true,
      token: signInResult.data.session.access_token,
      user: {
        id: signInResult.data.user.id,
        phone,
      },
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || '验证失败' })
  }
})
