// Configuración - Usando const en lugar de var para evitar redeclaración
const GEMINI_API_KEY = 'AIzaSyCa1d69ilyiiQkB_wiRgFHEDbXdT7Cu0dg';
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Elementos del DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const countrySelect = document.getElementById('country');

// Estado del chatbot
let isListening = false;
let recognition;

// Inicializar reconocimiento de voz si está disponible
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

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
            console.error('Error en reconocimiento de voz:', event.error);
            addBotMessage('Lo siento, hubo un error con el reconocimiento de voz. ¿Podrías escribirlo?');
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
}

// Funciones del chatbot
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
        addBotMessage('Lo siento, el reconocimiento de voz no está disponible en tu navegador.');
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
                <p>${text}</p>
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
    speakText(text);
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

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}

async function processUserMessage(message) {
    const country = countrySelect.value;
    const typingElement = document.querySelector('.typing');
    
    try {
        // Detectar si el usuario está pidiendo ayuda profesional
        const isProfessionalHelpRequest = /psic[oó]logo|terapeuta|profesional|ayuda profesional|necesito ayuda/i.test(message);
        
        if (isProfessionalHelpRequest) {
            if (country) {
                // Usar Gemini para buscar recomendaciones en internet
                const prompt = `El usuario solicita recomendaciones de psicólogos en ${country}. 
                Proporciona una lista de 3-5 formas de encontrar psicólogos en ese país, incluyendo:
                1. Directorios en línea de psicólogos certificados
                2. Asociaciones profesionales de psicología del país
                3. Plataformas de terapia en línea que operen allí
                4. Recomendaciones para verificar credenciales
                Responde en formato HTML con viñetas, sé conciso (máximo 150 palabras) y evita nombres específicos.`;
                
                const response = await callGeminiAPI(prompt);
                removeTypingIndicator(typingElement);
                addBotMessage(response, true);
            } else {
                removeTypingIndicator(typingElement);
                addBotMessage('Por favor, selecciona tu país para poder recomendarte cómo encontrar profesionales cercanos a ti.');
            }
        } else {
            // Respuesta emocional general
            const prompt = `Eres Lumi, un chatbot de apoyo emocional. El usuario te ha dicho: "${message}". 
            Responde de manera empática, comprensiva y profesional, ofreciendo apoyo emocional. 
            Sé breve (máximo 2 párrafos) y evita diagnósticos médicos.`;
            
            const response = await callGeminiAPI(prompt);
            removeTypingIndicator(typingElement);
            addBotMessage(response);
        }
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        removeTypingIndicator(typingElement);
        addBotMessage('Lo siento, estoy teniendo dificultades para responder. ¿Podrías intentarlo de nuevo más tarde?');
    }
}

async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_ONLY_HIGH"
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 800
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new Error('Respuesta de la API incompleta');
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error en callGeminiAPI:', error);
        throw error;
    }
}

function handleCountryChange() {
    if (countrySelect.value) {
        addBotMessage(`Has seleccionado ${countrySelect.value}. Si necesitas ayuda para encontrar un profesional, dime algo como "Necesito hablar con un psicólogo".`);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeVoiceRecognition();
    setupEventListeners();
    addBotMessage('¡Hola! Soy Lumi, tu compañero de apoyo emocional. ¿Cómo te sientes hoy?');
});
