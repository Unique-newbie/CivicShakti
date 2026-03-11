import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// =====================================================
// TYPES — CivicShakti Vision AI Engine
// =====================================================

export interface VisionAnalysis {
    detected_issue: {
        category: string;
        sub_type: string;
        description: string;
        objects_detected: string[];
    };
    severity: {
        score: number;
        level: string;
        reasoning: string;
        safety_hazard: boolean;
        estimated_affected: string;
    };
    department: {
        primary: string;
        secondary: string;
        escalation: string;
    };
    quality: {
        confidence: number;
        image_relevant: boolean;
        is_duplicate_risk: boolean;
        suggestions: string;
    };
}

export interface ComplaintAnalysis {
    is_valid: boolean;
    priority_score: number;
    analysis: string;
    image_matches_description: boolean;
}

// =====================================================
// SCHEMAS — Structured output for Gemini
// =====================================================

const visionAnalysisSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        detected_issue: {
            type: SchemaType.OBJECT,
            properties: {
                category: {
                    type: SchemaType.STRING,
                    description: "Best matching category from: pothole, garbage, water, electricity, pollution, infrastructure",
                    format: "enum",
                    enum: ["pothole", "garbage", "water", "electricity", "pollution", "infrastructure"],
                },
                sub_type: {
                    type: SchemaType.STRING,
                    description: "Specific sub-type of the issue, e.g. 'large pothole with water accumulation', 'overflowing municipal dumpster', 'broken street light pole'",
                },
                description: {
                    type: SchemaType.STRING,
                    description: "A citizen-friendly, clear 2-3 sentence description of the detected issue suitable for an official complaint.",
                },
                objects_detected: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "List of key objects detected in the image like 'road', 'pothole', 'garbage pile', 'broken pipe', 'electric pole'",
                },
            },
            required: ["category", "sub_type", "description", "objects_detected"],
        },
        severity: {
            type: SchemaType.OBJECT,
            properties: {
                score: {
                    type: SchemaType.INTEGER,
                    description: "Severity score from 1-100 based on size of damage, safety risk, population impact. 1-25=low, 26-50=medium, 51-75=high, 76-100=critical",
                },
                level: {
                    type: SchemaType.STRING,
                    description: "Severity level based on the score",
                    format: "enum",
                    enum: ["low", "medium", "high", "critical"],
                },
                reasoning: {
                    type: SchemaType.STRING,
                    description: "Brief explanation of why this severity was assigned, referencing visible damage indicators.",
                },
                safety_hazard: {
                    type: SchemaType.BOOLEAN,
                    description: "True if this poses immediate danger to pedestrians, vehicles, or property (e.g. live wires, deep potholes, structural collapse).",
                },
                estimated_affected: {
                    type: SchemaType.STRING,
                    description: "Rough estimate of people affected daily, e.g. '~200 commuters/day', '~50 households', 'entire neighborhood'.",
                },
            },
            required: ["score", "level", "reasoning", "safety_hazard", "estimated_affected"],
        },
        department: {
            type: SchemaType.OBJECT,
            properties: {
                primary: {
                    type: SchemaType.STRING,
                    description: "Primary government department responsible, e.g. 'Public Works Department', 'Sanitation Department', 'Electricity Board', 'Water Supply Department', 'Environment Department'.",
                },
                secondary: {
                    type: SchemaType.STRING,
                    description: "Specific division within the department, e.g. 'Road Maintenance', 'Solid Waste Management', 'Street Lighting'.",
                },
                escalation: {
                    type: SchemaType.STRING,
                    description: "Urgency of escalation based on severity and safety hazard",
                    format: "enum",
                    enum: ["normal", "urgent", "emergency"],
                },
            },
            required: ["primary", "secondary", "escalation"],
        },
        quality: {
            type: SchemaType.OBJECT,
            properties: {
                confidence: {
                    type: SchemaType.INTEGER,
                    description: "AI confidence in the detection accuracy from 0-100. Low confidence (<50) if image is blurry, dark, or ambiguous.",
                },
                image_relevant: {
                    type: SchemaType.BOOLEAN,
                    description: "True if image shows a genuine civic/infrastructure issue. False if it's a selfie, meme, random photo, or not clearly related to any civic complaint.",
                },
                is_duplicate_risk: {
                    type: SchemaType.BOOLEAN,
                    description: "True if the image appears to be a stock photo, screenshot, or previously used image rather than a fresh capture.",
                },
                suggestions: {
                    type: SchemaType.STRING,
                    description: "Helpful tips for the citizen to improve their report, e.g. 'Include surrounding landmarks for easier location identification' or 'Photo is clear and well-framed, great report!'",
                },
            },
            required: ["confidence", "image_relevant", "is_duplicate_risk", "suggestions"],
        },
    },
    required: ["detected_issue", "severity", "department", "quality"],
};

const complaintAnalysisSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        is_valid: {
            type: SchemaType.BOOLEAN,
            description: "Whether the complaint seems legitimate and not spam/abusive.",
        },
        priority_score: {
            type: SchemaType.INTEGER,
            description: "A severity score from 1 to 100 indicating how urgent the issue is.",
        },
        analysis: {
            type: SchemaType.STRING,
            description: "A very brief, one-sentence reasoning for the score and validity.",
        },
        image_matches_description: {
            type: SchemaType.BOOLEAN,
            description: "If an image is provided, does it match the category and description? If no image is provided, set to true.",
        },
    },
    required: ["is_valid", "priority_score", "analysis", "image_matches_description"],
};

const categorizationSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        category: {
            type: SchemaType.STRING,
            description: "The most appropriate category ID for the issue.",
            format: "enum",
            enum: ["pothole", "garbage", "water", "electricity", "pollution", "infrastructure"],
        },
    },
    required: ["category"],
};

// =====================================================
// CivicShakti Vision AI Engine — Primary Analysis
// =====================================================

const VISION_PROMPT = `You are the CivicShakti Vision AI Engine, an advanced multi-stage analysis system for detecting civic infrastructure issues from photographs submitted by citizens of India.

Your task is to perform a COMPREHENSIVE analysis of the provided image:

## STAGE 1: Issue Detection
- Identify the PRIMARY civic issue visible in the image
- Classify it into the correct category and sub-type
- List all key objects you can detect in the scene
- Generate a clear, official-sounding description suitable for a government complaint

## STAGE 2: Severity Assessment
- Score severity from 1-100 using this scale:
  * 1-25 (LOW): Minor cosmetic issues, small cracks, minor littering
  * 26-50 (MEDIUM): Moderate damage, accumulated garbage, minor leaks
  * 51-75 (HIGH): Significant damage, road hazards, large waste dumps, broken utilities
  * 76-100 (CRITICAL): Life-threatening hazards, exposed live wires, deep sinkholes, structural collapse
- Consider: damage size relative to surroundings, population density of area, weather impact, accessibility
- Flag as safety_hazard if there's any immediate danger to life or property

## STAGE 3: Department Routing
- Route to the correct Indian municipal department based on the detected issue type:
  * Potholes/Roads → Public Works Department / Road Maintenance Division
  * Garbage/Waste → Sanitation Department / Solid Waste Management
  * Water/Drainage → Water Supply & Sewerage Board / Pipeline Maintenance
  * Electricity → State Electricity Board / Street Lighting Division
  * Pollution → Environment Department / Pollution Control Board
  * Other → Municipal Corporation / General Maintenance
- Set escalation level based on severity and safety hazard

## STAGE 4: Quality Assessment
- Rate your confidence in the detection (0-100)
- Check if image actually shows a civic issue (not a selfie, meme, or irrelevant photo)
- Check if image looks like a genuine fresh capture vs. stock photo/screenshot
- Give the citizen helpful suggestions to improve their report

IMPORTANT RULES:
- Be accurate and specific in sub-type detection (don't just say "pothole", say "medium-sized pothole with water accumulation on main road")
- Be honest about confidence — if the image is blurry or ambiguous, say so
- Provide meaningful department routing that reflects Indian municipal structure
- Generate descriptions in professional English suitable for official records`;

export async function analyzeImage(
    base64Image: string,
    mimeType: string,
    userDescription?: string
): Promise<VisionAnalysis> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not configured. Returning defaults.");
        return getDefaultVisionAnalysis();
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: visionAnalysisSchema,
                temperature: 0.3,
            },
        });

        let prompt = VISION_PROMPT;
        if (userDescription) {
            prompt += `\n\nThe citizen also provided this description: "${userDescription}"\nUse this to enhance your analysis but prioritize what you actually see in the image.`;
        }

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        return JSON.parse(responseText) as VisionAnalysis;
    } catch (error) {
        console.error("Vision AI Analysis Error:", error);
        return getDefaultVisionAnalysis();
    }
}

// =====================================================
// Complaint Analysis (text + optional image)
// =====================================================

export async function analyzeComplaint(
    category: string,
    description: string,
    base64Image?: string,
    mimeType?: string
): Promise<ComplaintAnalysis> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not configured. Skipping AI validation.");
        return {
            is_valid: true,
            priority_score: 50,
            analysis: "AI validation skipped. Automatic default values applied.",
            image_matches_description: true,
        };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
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
            const imagePart = {
                inlineData: { data: base64Image, mimeType },
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("AI Validation Error:", error);
        return {
            is_valid: true,
            priority_score: 50,
            analysis: "Error connecting to AI verification pipeline. Auto-approved.",
            image_matches_description: true,
        };
    }
}

// =====================================================
// Auto-categorization (text + optional image)
// =====================================================

export async function suggestCategory(
    description: string,
    base64Image?: string,
    mimeType?: string
) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not configured. Skipping AI categorization.");
        return { category: "infrastructure" };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: categorizationSchema,
                temperature: 0.1,
            },
        });

        const prompt = `
        You are an AI assistant for the CivicShakti platform. Analyze the incoming civic issue description and/or image.
        Your task is to select the BEST matching category ID from the allowed options.
        
        Allowed Categories:
        - "pothole": Potholes, broken roads, damaged sidewalks.
        - "garbage": Solid waste, overflowing bins, illegal dumping, dead animals.
        - "water": Water leaks, broken pipes, open manholes, drainage issues, flooding.
        - "electricity": Broken streetlights, hanging live wires, sparking transformers, power outages.
        - "pollution": Air pollution, burning garbage, extreme noise pollution.
        - "infrastructure": General infrastructure damage, falling trees, broken public benches, anything else.
        
        Description: ${description || "None. Rely solely on the provided image."}
        `;

        let result;
        if (base64Image && mimeType) {
            const imagePart = {
                inlineData: { data: base64Image, mimeType },
            };
            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("AI Categorization Error:", error);
        return { category: "infrastructure" };
    }
}

// =====================================================
// Defaults
// =====================================================

function getDefaultVisionAnalysis(): VisionAnalysis {
    return {
        detected_issue: {
            category: "infrastructure",
            sub_type: "unknown",
            description: "AI analysis unavailable. Manual review required.",
            objects_detected: [],
        },
        severity: {
            score: 50,
            level: "medium",
            reasoning: "Default severity assigned — AI analysis unavailable.",
            safety_hazard: false,
            estimated_affected: "Unknown",
        },
        department: {
            primary: "Municipal Corporation",
            secondary: "General Maintenance",
            escalation: "normal",
        },
        quality: {
            confidence: 0,
            image_relevant: true,
            is_duplicate_risk: false,
            suggestions: "AI analysis could not be performed. Your complaint has been filed with default values.",
        },
    };
}
