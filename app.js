// app.js
let DEEPSEEK_API_KEY = null;
let conversationHistory = [];
let recognition = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check for saved API key in sessionStorage
    const savedKey = sessionStorage.getItem('tempDeepSeekKey');
    if (savedKey) {
        DEEPSEEK_API_KEY = savedKey;
        document.getElementById('apiKeyInput').value = '••••••••••••••••';
        toggleUI(true);
    }

    // Setup API key button
    document.getElementById('saveKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('startBtn').addEventListener('click', toggleSpeechRecognition);
});

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }

    if (!apiKey.startsWith('sk-')) {
        alert('Invalid API key format. It should start with "sk-".');
        return;
    }

    // Store the key in memory and sessionStorage
    DEEPSEEK_API_KEY = apiKey;
    sessionStorage.setItem('tempDeepSeekKey', apiKey);
    
    // Hide key input, show chat
    toggleUI(true);
    
    console.log('API key saved (temporarily).');
}

function toggleUI(showChat) {
    document.getElementById('apiKeySection').style.display = showChat ? 'none' : 'block';
    document.getElementById('chatSection').style.display = showChat ? 'block' : 'none';
}

function toggleSpeechRecognition() {
    const startBtn = document.getElementById('startBtn');
    
    if (!recognition) {
        initializeSpeechRecognition();
        recognition.start();
        startBtn.textContent = 'Stop Listening';
        document.getElementById('transcript').textContent = 'Listening...';
    } else {
        recognition.stop();
        startBtn.textContent = 'Start Speaking';
    }
}

function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Your browser doesn\'t support speech recognition. Try Chrome or Edge.');
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        document.getElementById('transcript').textContent = `You said: ${spokenText}`;

        try {
            const aiResponse = await callDeepSeekAPI(spokenText);
            document.getElementById('response').textContent = `AI says: ${aiResponse}`;
            speak(aiResponse);
        } catch (error) {
            console.error('API Error:', error);
            document.getElementById('response').textContent = 'Error getting response. Check your API key.';
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('transcript').textContent = `Error: ${event.error}`;
        document.getElementById('startBtn').textContent = 'Start Speaking';
    };

    recognition.onend = () => {
        document.getElementById('startBtn').textContent = 'Start Speaking';
    };
}

async function callDeepSeekAPI(userInput) {
    if (!DEEPSEEK_API_KEY) {
        alert('API key missing. Please enter it again.');
        toggleUI(false);
        throw new Error('API key missing');
    }

    // Add user message to conversation history
    conversationHistory.push({ role: 'user', content: userInput });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: conversationHistory
        })
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Invalid API key - clear it and show input again
            DEEPSEEK_API_KEY = null;
            sessionStorage.removeItem('tempDeepSeekKey');
            toggleUI(false);
            throw new Error('Invalid API key. Please enter a valid key.');
        }
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response.';
    
    // Add AI response to conversation history
    conversationHistory.push({ role: 'assistant', content: aiResponse });
    
    return aiResponse;
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Optional: Configure voice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
            utterance.rate = 0.9;
            utterance.pitch = 1;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = function() {
        // Voices are now loaded
    };
}
