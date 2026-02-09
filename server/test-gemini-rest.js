require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

async function testRest() {
    console.log("Testing REST API...");
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: "Hello" }]
            }]
        })
    });

    console.log("Status:", response.status);
    const data = await response.json(); // or text()
    console.log("Body:", JSON.stringify(data, null, 2));
}

testRest();
