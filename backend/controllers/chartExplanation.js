const dotenv =  require('dotenv');
const axios =  require('axios');
const {PromptCache} = require('../models/index');
const crypto = require('crypto');

dotenv.config();


function normalizePrompt(prompt) {
  return prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}



exports.chartExplanation = async (req, res) => {
  const { prompt, chartType } = req.body;
  if (!prompt)
    return res.status(500).json({ success: false, message: "Missing prompt." });
  const normalizedPrompt = normalizePrompt(prompt);
  const promptHash = crypto.createHash('sha256').update(normalizedPrompt).digest('hex');

  const promptCache = await PromptCache.findOne({ hash: promptHash });
  if (promptCache?.response) {
    return res.status(200).json({ success: true, Explanation: promptCache.response });
  }
  
  try {
        let completion
        if(chartType === "radar chart")
        {
              completion = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  model: "deepseek/deepseek-chat-v3-0324:free",
                  messages: [
                    {
                      role: "user",
                      content: prompt
                    }
                  ]
                },
                {
                  headers: {
                    Authorization: "Bearer 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",
                    "Content-Type": "application/json"
                  }
                }
              );
        }
        else
        {
          completion = await axios.post(
              "https://api.openai.com/v1/chat/completions",
              {
                  model: "gpt-3.5-turbo",
                  messages: [
                    {
                      role: "system",
                      content: "You are a data analyst that explains charts clearly in simple terms.",
                    },
                    {
                      role: "user",
                      content: prompt,
                    }
                  ]
              },
              {
                  headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                    'Cache-Control': 'no-cache'
                  }
              }
          );
        }
    
    const explanation = completion.data.choices[0].message.content;
    
    await PromptCache.create({
        prompt,
        response: explanation,
        hash: promptHash
    });
    res.status(200).json({ success: true, Explanation: explanation });
  } catch (error) {
    if (res.headersSent) return;
    res.status(500).json({ success: false, message: 'Error explaining charts', error: error.message });
  }
};
