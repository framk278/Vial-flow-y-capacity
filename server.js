const express = require('express');
const path = require('path');
require('dotenv').config();
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('Falta GROQ_API_KEY en .env');
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const system = {
      role: 'system',
      content: 'Eres un tutor en español. Responde de forma natural, clara y directa. No uses plantillas fijas ni repitas frases predeterminadas.'
    };

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [system, ...messages],
      temperature: 1,
      top_p: 1,
      max_tokens: 600
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || '';
    if (!answer) {
      return res.status(500).json({ error: 'Empty answer from model' });
    }

    return res.json({ answer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Error generando respuesta con Groq' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
