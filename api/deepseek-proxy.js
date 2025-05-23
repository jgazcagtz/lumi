export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { prompt, max_tokens, temperature } = req.body;

        const requestBody = {
            model: "deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: max_tokens || 800,
            temperature: temperature || 0.7
        };

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from DeepSeek API:', errorData);
            return res.status(response.status).json({ 
                error: 'API request failed',
                details: errorData 
            });
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('Invalid response structure from API');
        }

        res.status(200).json({
            choices: [{
                text: data.choices[0].message.content
            }]
        });
    } catch (error) {
        console.error('Error in DeepSeek API proxy:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
