const express = require('express');
const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const CLIENT_CONFIG_PATH = path.join(__dirname, 'config.js');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

function readClientKey() {
  try {
    const txt = fs.readFileSync(CLIENT_CONFIG_PATH, 'utf8');
    const m = txt.match(/window\.GROQ_API_KEY\s*=\s*['"]([^'"]*)['"]/);
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

const groq = new Groq({ apiKey: GROQ_API_KEY || readClientKey() });

app.post('/api/chat', async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) return res.status(400).json({ error: 'Messages are required' });

    const system = {
      role: 'system',
      content: 'Eres un tutor en español. Responde de forma natural, clara y directa. No uses plantillas fijas ni repitas frases predeterminadas. Si el usuario pregunta algo, responde exactamente a eso y no inventes una continuación.'
    };

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [system, ...messages],
      temperature: 1,
      top_p: 1,
      max_tokens: 600
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || '';
    if (!answer) return res.status(500).json({ error: 'Empty answer from model' });
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