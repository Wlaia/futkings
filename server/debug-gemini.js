const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function debugModels() {
    console.log("API Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : "MISSING");

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Attempting generation with gemini-1.5-flash...");
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("FULL ERROR DETAILS:");
        console.error(JSON.stringify(error, null, 2));
        if (error.response) {
            console.error("Response data:", error.response);
        }
    }
}

debugModels();
