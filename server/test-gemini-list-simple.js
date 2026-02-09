require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModelsRest() {
    console.log("Listing Generative Models via REST...");
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Found models:");
            const genModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            genModels.forEach(m => console.log(`- ${m.name}`));

            const hasFlash = genModels.some(m => m.name.includes("gemini-1.5-flash"));
            console.log("Has 1.5-flash:", hasFlash);
        } else {
            console.log("Error:", JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}

listModelsRest();
