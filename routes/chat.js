const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { CHARACTERS } = require('./characters');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple in-memory history (replace with Firestore later)
const chatHistories = {};

router.post('/', async (req, res) => {
  const { userId, characterId, message } = req.body;

  if (!userId || !characterId || !message) {
    return res.status(400).json({ error: 'userId, characterId y message son requeridos' });
  }

  const character = CHARACTERS.find(c => c.id === characterId);
  if (!character) return res.status(404).json({ error: 'Personaje no encontrado' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: character.personality,
    });

    // Get or create chat history
    const historyKey = `${userId}_${characterId}`;
    if (!chatHistories[historyKey]) chatHistories[historyKey] = [];

    const chat = model.startChat({
      history: chatHistories[historyKey],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.9,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Save to history
    chatHistories[historyKey].push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: response }] }
    );

    // Keep only last 20 messages
    if (chatHistories[historyKey].length > 20) {
      chatHistories[historyKey] = chatHistories[historyKey].slice(-20);
    }

    res.json({ response, characterId, userId });

  } catch (err) {
    console.error('Error Gemini:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:userId/:characterId', (req, res) => {
  const key = `${req.params.userId}_${req.params.characterId}`;
  chatHistories[key] = [];
  res.json({ ok: true });
});

module.exports = router;
