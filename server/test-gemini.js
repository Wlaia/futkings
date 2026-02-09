const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Testing gemini-1.5-flash...");
        const result = await model.generateContent("Hello");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }

    try {
        console.log("Listing available models...");
        // Note: older versions of the SDK used generic listModels, checking if available on genAI or model manager is needed but let's try basic connection first.
        // Actually, listModels is not directly on genAI instance in some versions, but let's try the simple test first.
    } catch (e) {
        console.log(e);
    }
}

listModels();
