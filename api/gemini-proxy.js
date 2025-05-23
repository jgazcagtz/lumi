export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    try {
        // Validar el cuerpo de la solicitud
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // Añadir configuraciones de seguridad por defecto
        const requestBody = {
            ...req.body,
            safetySettings: [
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH"
                }
            ],
            generationConfig: {
                maxOutputTokens: 800
            }
        };

        const response = await fetch(`${API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from Gemini API:', errorData);
            return res.status(response.status).json({ 
                error: 'API request failed',
                details: errorData 
            });
        }

        const data = await response.json();
        
        // Validar la respuesta
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('Invalid response structure from API');
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error in Gemini API proxy:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
