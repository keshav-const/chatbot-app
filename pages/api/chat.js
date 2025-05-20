import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { supabase } from '../../lib/supabaseClient'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export default async function handler(req, res) {
  const { context, question } = req.body

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session) return res.status(401).json({ error: 'Unauthorized' })

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  const result = await model.generateContent(`Context: ${context}\n\nQuestion: ${question}`)
  const reply = result.response.text()

  // Save to DB
  await supabaseAdmin.from('chat_messages').insert({
    user_id: session.user.id,
    question,
    response: reply,
  })

  res.status(200).json({ reply })
}
