const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateAvatarFromPhoto = async (imagePath, playerName, position) => {
    try {
        console.log(`🤖 Starting AI Avatar Generation for ${playerName}...`);

        // 1. Read the image file
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // 2. Ask Gemini to describe the person
        // CHANGED: gemini-1.5-flash -> gemini-2.0-flash (Available in user env)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Analyze this photo for an avatar generator. Provide a comma-separated list of ONLY the physical traits. MANDATORY: Start with Gender (Male/Female), then Age Estimate, then Skin Tone. Then list: Hair Style/Color, Beard/Facial Hair (be specific if present), Glasses (if present), and any distinct facial features. Example: Male, 30yo, Tan Skin, Short Black Hair, Full Beard, Rectangular Glasses.";

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
        const description = response.text();
        console.log(`📝 Gemini Description: ${description}`);

        // 3. Construct Pollinations.ai URL
        // Style: Hyperrealistic / Unreal Engine 5 / FIFA Graphics
        const style = "hyperrealistic, unreal engine 5 render, metahuman, fifa 24 graphics, 8k resolution, cinematic lighting, detailed skin texture, professional football portrait, depth of field, ray tracing";
        const positionContext = position === 'GOALKEEPER' ? "goalkeeper gloves, goalkeeper jersey" : "football jersey";

        // Ensure description comes first and is cleaner, remove newlines and periods
        const cleanDescription = description.replace(/\n/g, ' ').replace(/\./g, ',');

        const finalPrompt = `Hyperrealistic 3D Render of a football player, ${cleanDescription}, ${positionContext}, ${style}, facing camera, neutral expression, high detailed`;

        const encodedPrompt = encodeURIComponent(finalPrompt);

        // Use 'flux' model if available in Pollinations or standard.
        // Adding 'nologin=true' and 'model=flux' to URL.
        const avatarUrl = `https://pollinations.ai/p/${encodedPrompt}?width=512&height=512&seed=${Math.floor(Math.random() * 1000)}&nologin=true&model=flux`;

        console.log(`🎨 Generated Avatar URL: ${avatarUrl}`);

        return avatarUrl;

    } catch (error) {
        console.error("❌ Error in AI Generation:", error);
        // Fallback to DiceBear if AI fails (Cartoon style)
        // If this happens again, user will see cartoon.
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}`;
    }
};

module.exports = { generateAvatarFromPhoto };
