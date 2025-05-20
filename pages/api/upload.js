import formidable from 'formidable'
import fs from 'fs'
import pdfParse from 'pdf-parse'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = new formidable.IncomingForm()
  form.uploadDir = './tmp'
  form.keepExtensions = true

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message })

    const pdfPath = files.pdf.filepath
    const dataBuffer = fs.readFileSync(pdfPath)
    const parsed = await pdfParse(dataBuffer)

    res.status(200).json({ text: parsed.text })
  })
}
