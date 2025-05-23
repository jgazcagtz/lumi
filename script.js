// Configuración
const API_KEY = 'AIzaSyCa1d69ilyiiQkB_wiRgFHEDbXdT7Cu0dg';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Elementos del DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const countrySelect = document.getElementById('country');

// Psicólogos por país (ejemplo simplificado)
const psychologistsByCountry = {
    'Argentina': [
        { name: 'Dra. María López', specialty: 'Ansiedad y depresión', contact: 'maria.lopez@psicoarg.com' },
        { name: 'Lic. Carlos Gómez', specialty: 'Terapia cognitivo-conductual', contact: 'cgomez@terapiaarg.com.ar' }
    ],
    'Brasil': [
        { name: 'Dr. João Silva', specialty: 'Terapia familiar', contact: 'joao.silva@psi.com.br' },
        { name: 'Dra. Ana Santos', specialty: 'Estrés postraumático', contact: 'ana.santos@saudemental.br' }
    ],
    'Chile': [
        { name: 'Lic. Pablo González', specialty: 'Terapia de parejas', contact: 'pablo.gonzalez@psicologoschile.cl' },
        { name: 'Dra. Fernanda Rojas', specialty: 'Depresión y autoestima', contact: 'f.rojas@ayudapsicologica.cl' }
    ],
    'Colombia': [
        { name: 'Dr. Andrés Martínez', specialty: 'Ansiedad y manejo del estrés', contact: 'andres.martinez@psicologoscol.com' },
        { name: 'Lic. Carolina Díaz', specialty: 'Terapia infantil', contact: 'carolina.diaz@psicologia.co' }
    ],
    'México': [
        { name: 'Dra. Laura Méndez', specialty: 'Terapia cognitivo-conductual', contact: 'laura.mendez@psicologosmx.com' },
        { name: 'Lic. Roberto Navarro', specialty: 'Adicciones', contact: 'roberto.navarro@terapia.mx' }
    ],
    'Perú': [
        { name: 'Lic. Sofía Quispe', specialty: 'Autoestima y desarrollo personal', contact: 'sofia.quispe@psicoperu.com' },
        { name: 'Dr. Luis Vargas', specialty: 'Terapia de parejas', contact: 'lvargas@psicologiaperu.pe' }
    ],
    'EEUU': [
        { name: 'Dr. Michael Johnson', specialty: 'Trauma therapy', contact: 'm.johnson@mentalhealthus.com' },
        { name: 'Lic. Sarah Williams', specialty: 'Cognitive behavioral therapy', contact: 's.williams@therapyusa.org' }
    ],
    'Canadá': [
        { name: 'Dr. David Brown', specialty: 'Anxiety disorders', contact: 'd.brown@canadamentalhealth.ca' },
        { name: 'Lic. Emily Taylor', specialty: 'Depression and mood disorders', contact: 'e.taylor@therapycanada.ca' }
    ],
    'otros': [
        { name: 'Psicólogos sin Fronteras', specialty: 'Atención psicológica internacional', contact: 'contacto@psicologossinfronteras.org' },
        { name: 'Terapia Online Internacional', specialty: 'Servicios en línea', contact: 'info@terapiaonlineglobal.com' }
    ]
};

// Estado del chatbot
let isListening = false;
let recognition;

// Inicializar reconocimiento de voz si está disponible
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

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

voiceBtn.addEventListener('click', toggleVoiceRecognition);

// Funciones del chatbot
function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    addUserMessage(message);
    userInput.value = '';
    
    // Mostrar indicador de que el bot está escribiendo
    showTypingIndicator();
    
    // Procesar mensaje y obtener respuesta
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

function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="content">
            <p>${text}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Usar síntesis de voz si está disponible
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
        let response;
        
        // Primero verificar si el mensaje parece una solicitud de ayuda profesional
        if (message.toLowerCase().includes('psicólogo') || 
            message.toLowerCase().includes('profesional') || 
            message.toLowerCase().includes('terapeuta') ||
            message.toLowerCase().includes('ayuda profesional')) {
            
            if (country) {
                const psychologists = psychologistsByCountry[country] || psychologistsByCountry['otros'];
                let psychologistsText = `Aquí tienes algunos profesionales en ${country}:\n\n`;
                
                psychologists.forEach(psych => {
                    psychologistsText += `• <strong>${psych.name}</strong> (${psych.specialty}) - Contacto: ${psych.contact}\n`;
                });
                
                psychologistsText += "\nRecuerda que es importante encontrar un profesional con el que te sientas cómodo/a.";
                
                removeTypingIndicator(typingElement);
                addBotMessage(psychologistsText);
            } else {
                removeTypingIndicator(typingElement);
                addBotMessage('Por favor, selecciona tu país para poder recomendarte profesionales cercanos a ti.');
            }
        } else {
            // Usar la API de Gemini para respuestas generales
            response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Eres Lumi, un chatbot de apoyo emocional. El usuario te ha dicho: "${message}". Responde de manera empática, comprensiva y profesional, ofreciendo apoyo emocional. Sé breve (máximo 2 párrafos).`
                        }]
                    }]
                })
            });
            
            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;
            
            removeTypingIndicator(typingElement);
            addBotMessage(botResponse);
        }
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        removeTypingIndicator(typingElement);
        addBotMessage('Lo siento, estoy teniendo dificultades para responder. ¿Podrías intentarlo de nuevo?');
    }
}

// Manejar cambios en el país seleccionado
countrySelect.addEventListener('change', () => {
    if (countrySelect.value) {
        addBotMessage(`Has seleccionado ${countrySelect.value}. Si necesitas recomendaciones de profesionales, dime algo como "Necesito hablar con un psicólogo".`);
    }
});