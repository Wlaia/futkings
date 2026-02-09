const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
    try {
        // Note: The SDK might not expose listModels directly on genAI.
        // We can try to assume 1.5-flash-001 or gemini-pro.

        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-pro", "gemini-1.5-pro"];

        for (const modelName of modelsToTest) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS: ${modelName} responded:`, result.response.text());
                return; // Exit on first success
            } catch (error) {
                console.log(`FAILED: ${modelName} - ${error.message.split('[')[0]}`); // Print short error
            }
        }
    } catch (error) {
        console.error("Global error:", error);
    }
}

checkModels();
