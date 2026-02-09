const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGeneration() {
    console.log("🚀 Testing Gemini 2.0 Flash generation...");

    // 1x1 transparent pixel jpeg base64 (approximate) / or just a white pixel
    const base64Image = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8QAQwAGAQEBAQEAAAAAAAAAAAAAAAYFBAMH/8QAJRAAAgEDAwQCAwAAAAAAAAAAAQIDBAURAAYhEjFBYRNRcYGR/8QAFABAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AH7k1dI1G0Uu4b/K1T1n0P08Kj8Az39x8j9M88/5xU1j3r/T/9k=";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Describe this image technically.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        console.log("✅ Description:", response.text());

        const avatarUrl = `https://pollinations.ai/p/${encodeURIComponent("Test Avatar football")}?width=512&height=512&nologin=true&model=flux`;
        console.log("✅ Mock Pollination URL:", avatarUrl);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(JSON.stringify(error, null, 2));
    }
}

testGeneration();
