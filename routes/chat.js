const express = require('express');
const router = express.Router();
const { VertexAI } = require('@google-cloud/vertexai');
const { CHARACTERS } = require('./characters');

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

// Simple in-memory history
const chatHistories = {};

router.post('/', async (req, res) => {
  const { userId, characterId, message } = req.body;

  if (!userId || !characterId || !message) {
    return res.status(400).json({ error: 'userId, characterId y message son requeridos' });
  }

  const character = CHARACTERS.find(c => c.id === characterId);
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' });

  try {
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
      systemInstruction: { parts: [{ text: character.personality }] },
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.9,
      },
    });

    const historyKey = `${userId}_${characterId}`;
    if (!chatHistories[historyKey]) chatHistories[historyKey] = [];

    const contents = [
      ...chatHistories[historyKey],
      { role: 'user', parts: [{ text: message }] }
    ];

    const result = await model.generateContent({ contents });
    const response = result.response.candidates[0].content.parts[0].text;

    // Save to history
    chatHistories[historyKey].push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: response }] }
    );

    // Keep last 20 messages
    if (chatHistories[historyKey].length > 20) {
      chatHistories[historyKey] = chatHistories[historyKey].slice(-20);
    }

    res.json({ response, characterId, userId });

  } catch (err) {
    console.error('Error Vertex AI:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:userId/:characterId', (req, res) => {
  const key = `${req.params.userId}_${req.params.characterId}`;
  chatHistories[key] = [];
  res.json({ ok: true });
});

module.exports = router;
