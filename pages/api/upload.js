
import { formidable } from 'formidable'


import fs from 'fs';
import pdfParse from 'pdf-parse';


export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = formidable({ keepExtensions: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err)
      return res.status(500).json({ error: 'Failed to parse file' })
    }

    const file = files.pdf?.[0]
    if (!file) {
      return res.status(400).json({ error: 'No PDF uploaded' })
    }

    try {
      const buffer = fs.readFileSync(file.filepath)
      const data = await pdfParse(buffer)
      return res.status(200).json({ text: data.text })
    } catch (err) {
      console.error('PDF parse error:', err)
      return res.status(500).json({ error: 'Failed to parse PDF' })
    }
  })
}
