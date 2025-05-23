// Configuration
const DEEPSEEK_API_ENDPOINT = '/api/deepseek-proxy';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const countrySelect = document.getElementById('country');
const langButtons = {
    'es': document.getElementById('lang-es'),
    'en': document.getElementById('lang-en'),
    'fr': document.getElementById('lang-fr'),
    'pt': document.getElementById('lang-pt')
};

// Chatbot state
let isListening = false;
let recognition;
let currentLanguage = 'es';
const translations = {
    'es': {
        placeholder: "Escribe cómo te sientes...",
        countryLabel: "País:",
        selectCountry: "Selecciona tu país",
        initialMessage: "¡Hola! Soy Lumi, tu compañero de apoyo emocional. ¿Cómo te sientes hoy?",
        voiceError: "Lo siento, hubo un error con el reconocimiento de voz. ¿Podrías escribirlo?",
        voiceNotAvailable: "Lo siento, el reconocimiento de voz no está disponible en tu navegador.",
        selectCountryPrompt: "Por favor, selecciona tu país para poder recomendarte cómo encontrar profesionales cercanos a ti.",
        apiError: "Lo siento, estoy teniendo dificultades para responder. ¿Podrías intentarlo de nuevo más tarde?",
        countrySelected: "Has seleccionado {country}. Si necesitas ayuda para encontrar un profesional, dime algo como 'Necesito hablar con un psicólogo'."
    },
    'en': {
        placeholder: "Write how you feel...",
        countryLabel: "Country:",
        selectCountry: "Select your country",
        initialMessage: "Hello! I'm Lumi, your emotional support companion. How are you feeling today?",
        voiceError: "Sorry, there was an error with voice recognition. Could you type it instead?",
        voiceNotAvailable: "Sorry, voice recognition is not available in your browser.",
        selectCountryPrompt: "Please select your country so I can recommend how to find professionals near you.",
        apiError: "Sorry, I'm having trouble responding. Could you try again later?",
        countrySelected: "You've selected {country}. If you need help finding a professional, say something like 'I need to talk to a psychologist'."
    },
    'fr': {
        placeholder: "Écrivez comment vous vous sentez...",
        countryLabel: "Pays:",
        selectCountry: "Sélectionnez votre pays",
        initialMessage: "Bonjour ! Je suis Lumi, votre compagnon de soutien émotionnel. Comment vous sentez-vous aujourd'hui ?",
        voiceError: "Désolé, il y a eu une erreur avec la reconnaissance vocale. Pourriez-vous l'écrire à la place ?",
        voiceNotAvailable: "Désolé, la reconnaissance vocale n'est pas disponible dans votre navigateur.",
        selectCountryPrompt: "Veuillez sélectionner votre pays afin que je puisse vous recommander comment trouver des professionnels près de chez vous.",
        apiError: "Désolé, j'ai du mal à répondre. Pourriez-vous réessayer plus tard ?",
        countrySelected: "Vous avez sélectionné {country}. Si vous avez besoin d'aide pour trouver un professionnel, dites quelque chose comme 'Je dois parler à un psychologue'."
    },
    'pt': {
        placeholder: "Escreva como você se sente...",
        countryLabel: "País:",
        selectCountry: "Selecione seu país",
        initialMessage: "Olá! Eu sou Lumi, seu companheiro de apoio emocional. Como você está se sentindo hoje?",
        voiceError: "Desculpe, houve um erro com o reconhecimento de voz. Você poderia digitar em vez disso?",
        voiceNotAvailable: "Desculpe, o reconhecimento de voz não está disponível no seu navegador.",
        selectCountryPrompt: "Por favor, selecione seu país para que eu possa recomendar como encontrar profissionais perto de você.",
        apiError: "Desculpe, estou tendo dificuldades para responder. Você poderia tentar novamente mais tarde?",
        countrySelected: "Você selecionou {country}. Se precisar de ajuda para encontrar um profissional, diga algo como 'Preciso falar com um psicólogo'."
    }
};

// Initialize voice recognition
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage === 'es' ? 'es-ES' : 
                          currentLanguage === 'en' ? 'en-US' : 
                          currentLanguage === 'fr' ? 'fr-FR' : 'pt-BR';

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('listening');
        };

        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            addBotMessage(translations[currentLanguage].voiceError);
            voiceBtn.classList.remove('listening');
            isListening = false;
        };
    } else {
        voiceBtn.style.display = 'none';
    }
}

// Event listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    voiceBtn.addEventListener('click', toggleVoiceRecognition);
    countrySelect.addEventListener('change', handleCountryChange);
    
    // Language buttons
    Object.keys(langButtons).forEach(lang => {
        langButtons[lang].addEventListener('click', () => changeLanguage(lang));
    });
}

// Change language
function changeLanguage(lang) {
    currentLanguage = lang;
    
    // Update UI elements
    userInput.placeholder = translations[lang].placeholder;
    document.querySelector('.country-selector label').textContent = translations[lang].countryLabel;
    countrySelect.querySelector('option[value=""]').textContent = translations[lang].selectCountry;
    
    // Update active language button
    Object.values(langButtons).forEach(btn => btn.classList.remove('active'));
    langButtons[lang].classList.add('active');
    
    // Reinitialize voice recognition with new language
    if (recognition) {
        recognition.lang = lang === 'es' ? 'es-ES' : 
                          lang === 'en' ? 'en-US' : 
                          lang === 'fr' ? 'fr-FR' : 'pt-BR';
    }
}

// Chatbot functions
function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    addUserMessage(message);
    userInput.value = '';
    
    showTypingIndicator();
    processUserMessage(message);
}

function toggleVoiceRecognition() {
    if (!recognition) {
        addBotMessage(translations[currentLanguage].voiceNotAvailable);
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="content">
            <p>${text}</p>
        </div>
        <div class="avatar">
            <i class="fas fa-user"></i>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addBotMessage(text, isHTML = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    if (isHTML) {
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="content">
                ${text}
            </div>
        `;
    } else {
        const contentP = document.createElement('p');
        contentP.textContent = text;
        
        messageDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="content"></div>
        `;
        messageDiv.querySelector('.content').appendChild(contentP);
    }
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="content">
            <p class="typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></p>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    return typingDiv;
}

function removeTypingIndicator(typingElement) {
    if (typingElement && typingElement.parentNode) {
        typingElement.parentNode.removeChild(typingElement);
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function processUserMessage(message) {
    const country = countrySelect.value;
    const typingElement = document.querySelector('.typing');
    
    try {
        // Detect if user is asking for professional help
        const isProfessionalHelpRequest = /psic[oó]logo|terapeuta|profesional|ayuda profesional|necesito ayuda|psychologist|therapist|professional help|I need help|psychologue|thérapeute|besoin d'aide|psicólogo|terapeuta|ajuda profissional|preciso de ajuda/i.test(message.toLowerCase());
        
        if (isProfessionalHelpRequest) {
            if (country) {
                // Get crisis resources based on country and language
                const prompt = generateCrisisPrompt(country, currentLanguage);
                const response = await callDeepSeekAPI(prompt);
                removeTypingIndicator(typingElement);
                addBotMessage(formatCrisisResponse(response, currentLanguage, country), true);
            } else {
                removeTypingIndicator(typingElement);
                addBotMessage(translations[currentLanguage].selectCountryPrompt);
            }
        } else {
            // General emotional response
            const prompt = generateEmotionalPrompt(message, currentLanguage);
            const response = await callDeepSeekAPI(prompt);
            removeTypingIndicator(typingElement);
            addBotMessage(response);
        }
    } catch (error) {
        console.error('Error processing message:', error);
        removeTypingIndicator(typingElement);
        addBotMessage(translations[currentLanguage].apiError);
    }
}

function generateCrisisPrompt(country, lang) {
    const prompts = {
        'es': `Proporciona información sobre recursos de ayuda psicológica en ${country} para alguien en crisis. Incluye:
        1. Líneas de ayuda telefónica disponibles 24/7
        2. Asociaciones profesionales de psicología
        3. Plataformas de terapia en línea
        4. Cómo acceder a ayuda pública
        Responde en formato HTML con viñetas, sé conciso (máximo 200 palabras) y proporciona información verificable.`,
        'en': `Provide information about psychological help resources in ${country} for someone in crisis. Include:
        1. 24/7 helplines
        2. Professional psychology associations
        3. Online therapy platforms
        4. How to access public help
        Respond in HTML with bullet points, be concise (max 200 words) and provide verifiable information.`,
        'fr': `Fournissez des informations sur les ressources d'aide psychologique en ${country} pour une personne en crise. Incluez:
        1. Lignes d'assistance téléphonique disponibles 24h/24
        2. Associations professionnelles de psychologie
        3. Plateformes de thérapie en ligne
        4. Comment accéder à l'aide publique
        Répondez en HTML avec des puces, soyez concis (max 200 mots) et fournissez des informations vérifiables.`,
        'pt': `Forneça informações sobre recursos de ajuda psicológica em ${country} para alguém em crise. Inclua:
        1. Linhas de ajuda telefônica disponíveis 24 horas
        2. Associações profissionais de psicologia
        3. Plataformas de terapia online
        4. Como acessar ajuda pública
        Responda em HTML com marcadores, seja conciso (máximo 200 palavras) e forneça informações verificáveis.`
    };
    return prompts[lang];
}

function formatCrisisResponse(response, lang, country) {
    // If the response is already formatted, return it
    if (response.includes('<ul>') || response.includes('<li>')) {
        return response;
    }
    
    // Otherwise, format it properly
    const crisisTitles = {
        'es': `Recursos de ayuda en ${country}`,
        'en': `Help resources in ${country}`,
        'fr': `Ressources d'aide en ${country}`,
        'pt': `Recursos de ajuda em ${country}`
    };
    
    return `
        <h4>${crisisTitles[lang]}</h4>
        <ul>${response.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}</ul>
        <p>${getCrisisFooter(lang)}</p>
    `;
}

function getCrisisFooter(lang) {
    const footers = {
        'es': "Recuerda que no estás solo/a. Si estás en una crisis grave, por favor contacta a los servicios de emergencia de tu localidad inmediatamente.",
        'en': "Remember you're not alone. If you're in a serious crisis, please contact your local emergency services immediately.",
        'fr': "N'oubliez pas que vous n'êtes pas seul. Si vous êtes dans une crise grave, veuillez contacter immédiatement les services d'urgence de votre localité.",
        'pt': "Lembre-se de que você não está sozinho. Se você estiver em uma crise grave, entre em contato com os serviços de emergência locais imediatamente."
    };
    return footers[lang];
}

function generateEmotionalPrompt(message, lang) {
    const prompts = {
        'es': `Eres Lumi, un chatbot de apoyo emocional. El usuario te ha dicho: "${message}". 
        Responde de manera empática, comprensiva y profesional, ofreciendo apoyo emocional en español.
        Sé breve (máximo 2 párrafos) y evita diagnósticos médicos.`,
        'en': `You are Lumi, an emotional support chatbot. The user has told you: "${message}".
        Respond in an empathetic, understanding and professional manner, offering emotional support in English.
        Be brief (maximum 2 paragraphs) and avoid medical diagnoses.`,
        'fr': `Vous êtes Lumi, un chatbot de soutien émotionnel. L'utilisateur vous a dit : "${message}".
        Répondez de manière empathique, compréhensive et professionnelle, en offrant un soutien émotionnel en français.
        Soyez bref (maximum 2 paragraphes) et évitez les diagnostics médicaux.`,
        'pt': `Você é Lumi, um chatbot de apoio emocional. O usuário te disse: "${message}".
        Responda de maneira empática, compreensiva e profissional, oferecendo apoio emocional em português.
        Seja breve (máximo 2 parágrafos) e evite diagnósticos médicos.`
    };
    return prompts[lang];
}

async function callDeepSeekAPI(prompt) {
    try {
        const response = await fetch(DEEPSEEK_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 800,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.text) {
            throw new Error('Incomplete API response');
        }
        
        return data.choices[0].text;
    } catch (error) {
        console.error('Error in callDeepSeekAPI:', error);
        throw error;
    }
}

function handleCountryChange() {
    if (countrySelect.value) {
        const message = translations[currentLanguage].countrySelected.replace('{country}', countrySelect.value);
        addBotMessage(message);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeVoiceRecognition();
    setupEventListeners();
    addBotMessage(translations[currentLanguage].initialMessage);
});
