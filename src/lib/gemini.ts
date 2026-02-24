import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define the structured schema for the AI Response
const complaintAnalysisSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        is_valid: {
            type: SchemaType.BOOLEAN,
            description: "Whether the complaint seems legitimate and not spam/abusive.",
        },
        priority_score: {
            type: SchemaType.INTEGER,
            description: "A severity score from 1 to 100 indicating how urgent the issue is based on standard municipal guidelines (e.g. hazardous situations are high, aesthetic issues are low).",
        },
        analysis: {
            type: SchemaType.STRING,
            description: "A very brief, one-sentence reasoning for the score and validity.",
        },
        image_matches_description: {
            type: SchemaType.BOOLEAN,
            description: "If an image is provided, does it match the category and description? If no image is provided, set to true.",
        }
    },
    required: ["is_valid", "priority_score", "analysis", "image_matches_description"],
};

export async function analyzeComplaint(
    category: string,
    description: string,
    base64Image?: string,
    mimeType?: string
) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Skipping AI validation.");
        return {
            is_valid: true,
            priority_score: 50,
            analysis: "AI validation skipped. Automatic default values applied.",
            image_matches_description: true,
        };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: complaintAnalysisSchema,
            },
        });

        const prompt = `
        You are a government triage assistant for the CivicShakti platform. Analyze the incoming citizen complaint.
        Category: ${category}
        Description: ${description}
        
        Rules:
        1. Reject (is_valid: false) if the text contains hate speech, extreme profanity, political campaigning, or clear spam.
        2. Assign a priority_score (1-100) based on urgency. (e.g., Live wires = 90-100, Pothole = 50-70, Garbage = 30-50).
        3. If an image is provided, verify it visually matches the description. If it's a selfie, a meme, or completely unrelated to the category, set image_matches_description to false.
        `;

        let result;
        if (base64Image && mimeType) {
            // Multimodal prompt
            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            // Text only prompt
            result = await model.generateContent(prompt);
        }

        const responseText = result.response.text();
        const jsonResponse = JSON.parse(responseText);
        return jsonResponse;

    } catch (error) {
        console.error("AI Validation Error:", error);
        // Fail-safe: If AI goes down, we shouldn't block user complaints completely, just assign default.
        return {
            is_valid: true,
            priority_score: 50,
            analysis: "Error connecting to AI verification pipeline. Auto-approved.",
            image_matches_description: true,
        };
    }
}
