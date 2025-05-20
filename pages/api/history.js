import { supabase } from '../../lib/supabaseClient'

export default async function handler(req, res) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error: fetchError } = await supabase
    .from('chat_messages')
    .select('question, response, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (fetchError) return res.status(500).json({ error: fetchError.message })

  res.status(200).json({ history: data })
}
