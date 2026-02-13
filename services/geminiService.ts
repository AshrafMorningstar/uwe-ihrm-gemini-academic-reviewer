
import { GoogleGenAI, Type } from "@google/genai";
import { PortfolioReview, StudentData, TaskType } from "../types";
import { CASE_STUDY, MODULE_CODE, TASK_MODELS } from "../constants";

// Correctly initialize with process.env.API_KEY directly as required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReview = async (studentData: StudentData): Promise<PortfolioReview> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    You are a world-class Senior Lecturer at UWE Bristol for the module ${MODULE_CODE}: International HRM. 
    Evaluate the following student portfolio for the 2024/25 academic year based on the case study: ${CASE_STUDY}.
    
    Student Name: ${studentData.name}
    Student Bio/Context: Github: ${studentData.githubLink}, LinkedIn: ${studentData.linkedinLink}

    Review the portfolio against these Learning Outcomes:
    MO1: Critical evaluation of IHRM strategies and business objectives.
    MO2: Distinguishing between international approaches to people management and regulations.
    MO3: Identification of international manager roles and challenges.
    MO4: Evaluation of contemporary developments, ethics, and standards.

    Portfolio Content:
    ${Object.entries(studentData.portfolioContent).map(([task, content]) => `
      --- TASK: ${task} ---
      Expected Models: ${TASK_MODELS[task as TaskType]?.join(', ')}
      Content: ${content || 'NOT PROVIDED'}
    `).join('\n')}

    Rules:
    - Use UWE Harvard referencing standards.
    - Professional, constructive, yet rigorous academic tone.
    - Provide specific critique for each task provided.
    - Assign realistic provisional grades based on UWE criteria.
    - Check if exactly TWO specified theoretical models were applied per task.
    - Confirm 400-500 word limits (approx).
  `;

  // Use ai.models.generateContent with model and prompt as specified in the guidelines
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 20000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallGrade: { type: Type.STRING },
          summativeOverview: { type: Type.STRING },
          learningOutcomeCheck: {
            type: Type.OBJECT,
            properties: {
              mo1: { type: Type.STRING },
              mo2: { type: Type.STRING },
              mo3: { type: Type.STRING },
              mo4: { type: Type.STRING }
            },
            required: ['mo1', 'mo2', 'mo3', 'mo4']
          },
          taskReviews: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskName: { type: Type.STRING },
                provisionalGrade: { type: Type.STRING },
                gradeBand: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                criticalEvaluationScore: { type: Type.NUMBER },
                actionableSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                detailedCritique: { type: Type.STRING },
                referencingFeedback: { type: Type.STRING },
                wordCountAnalysis: { type: Type.STRING }
              },
              required: ['taskName', 'provisionalGrade', 'gradeBand', 'strengths', 'weaknesses', 'detailedCritique']
            }
          }
        },
        required: ['overallGrade', 'summativeOverview', 'learningOutcomeCheck', 'taskReviews']
      }
    }
  });

  // Extract text using property access (not a method) and parse JSON as recommended
  const jsonStr = response.text?.trim() || '{}';
  return JSON.parse(jsonStr) as PortfolioReview;
};
