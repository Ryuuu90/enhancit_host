const dotenv =  require('dotenv');
const axios =  require('axios');
const {PromptCache} = require('../models/Records');
const crypto = require('crypto');
dotenv.config();



exports.chartExplanation = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt)
    return res.status(500).json({ success: false, message: "Missing prompt." });

  const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
  const promptCache = await PromptCache.findOne({ hash: promptHash });

  if (promptCache?.response) {
    return res.status(200).json({ success: true, Explanation: promptCache.response });
  }

  try {
    const completion = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "user",
            content: prompt,
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const explanation = completion.data.choices[0].message.content;
    await PromptCache.create({ prompt, response: explanation, hash: promptHash });

    res.status(200).json({ success: true, Explanation: explanation });
  } catch (error) {
    if (res.headersSent) return;
    res.status(500).json({ success: false, message: 'Error explaining charts', error: error.message });
  }
};
