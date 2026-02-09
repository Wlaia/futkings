require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModelsRest() {
    console.log("Listing Models via REST...");
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    console.log("Status:", response.status);
    const data = await response.json();

    if (data.models) {
        console.log("Available Models:");
        data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
    } else {
        console.log("Error Body:", JSON.stringify(data, null, 2));
    }
}

listModelsRest();
