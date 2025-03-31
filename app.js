const startBtn = document.getElementById("startBtn");
const transcriptDiv = document.getElementById("transcript");
const responseDiv = document.getElementById("response");

// Check if the browser supports the Web Speech API
if (!('webkitSpeechRecognition' in window)) {
    alert("Your browser doesn't support speech recognition!");
} else {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    startBtn.addEventListener("click", () => {
        recognition.start();
        transcriptDiv.textContent = "Listening...";
    });

    recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        transcriptDiv.textContent = `You said: ${spokenText}`;

        // Send to DeepSeek API
        const aiResponse = await callDeepSeekAPI(spokenText);
        responseDiv.textContent = `AI says: ${aiResponse}`;
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        transcriptDiv.textContent = "Error: " + event.error;
    };
}

async function callDeepSeekAPI(userInput) {
    const API_KEY = "YOUR_DEEPSEEK_API_KEY"; // Replace with your actual API key
    const API_URL = "https://api.deepseek.com/v1/chat/completions"; // Example (check actual API endpoint)

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: userInput }]
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response.";
}
