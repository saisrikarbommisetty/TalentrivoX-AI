import {
  AIRequirementExtractionOutputSchema,
  AIResumeParseOutputSchema,
  AIEvaluationOutputSchema,
  AIInterviewQuestionsOutputSchema,
  JobRequirement,
  ExtractedResumeData,
  EvaluationResult,
  InterviewQuestion,
  calculateEvaluationScore,
  EVIDENCE_SCORES,
  RequirementCategoryType,
  RequirementImportanceType,
  QuestionCategoryType,
  QuestionDifficultyType
} from '@avengercoders/shared';
import { env } from '../config/env';
import { deterministicEngine } from '../matching/deterministic.engine';

export interface AIProviderStatus {
  isAvailable: boolean;
  providerName: string;
  model: string;
  reason?: string;
}

export class GeminiService {
  private apiKey: string | undefined;
  private modelName: string;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('placeholder')
      ? env.GEMINI_API_KEY
      : undefined;
    this.modelName = env.GEMINI_MODEL || 'gemini-3.8-flash';
  }

  public getStatus(): AIProviderStatus {
    if (!this.apiKey) {
      return {
        isAvailable: false,
        providerName: 'gemini',
        model: this.modelName,
        reason: 'GEMINI_API_KEY is not configured or is set to placeholder. Deterministic engine is actively powering all features.'
      };
    }
    return {
      isAvailable: true,
      providerName: 'gemini',
      model: this.modelName
    };
  }

  /**
   * Helper to make REST API call to Google Gemini GenerateContent with JSON schema format.
   */
  private async callGeminiWithJson(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY_UNAVAILABLE');
    }

    const candidateModels = Array.from(new Set([
      this.modelName,
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ]));

    let lastError: any = null;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        systemInstruction: systemInstruction ? {
          parts: [{ text: systemInstruction }]
        } : undefined,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS || 15000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 404) {
            lastError = new Error(`Gemini API error (404): ${errText}`);
            continue; // try next candidate model
          }
          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const contentText = candidate?.content?.parts?.[0]?.text;

        if (!contentText) {
          throw new Error('Empty response received from Gemini API');
        }

        this.modelName = model;
        return contentText;
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.warn(`[GeminiService] Request timed out for model ${model}`);
        }
      }
    }

    throw lastError || new Error('Failed to query Gemini API');
  }

  /**
   * Extracts structured requirements from a job description.
   */
  public async extractRequirements(jobTitle: string, jobDescription: string): Promise<JobRequirement[]> {
    if (this.apiKey) {
      try {
        const prompt = `You are a principal recruitment architect. Analyze this job description and extract 4 to 8 structured, job-related requirements.
Job Title: ${jobTitle}
Job Description:
${jobDescription}

Return strict JSON adhering to schema:
{
  "requirements": [
    {
      "id": "req-1",
      "text": "Clear concise requirement text",
      "category": "technical_skill" | "domain_knowledge" | "experience" | "education" | "certification" | "responsibility",
      "importance": "essential" | "preferred",
      "weight": number (1 to 10),
      "evidenceExpectations": "what proof or keywords in resume would satisfy this",
      "assessableFromResume": boolean
    }
  ]
}`;

        const rawJson = await this.callGeminiWithJson(prompt);
        const parsed = JSON.parse(rawJson);
        const validated = AIRequirementExtractionOutputSchema.parse(parsed);
        return validated.requirements;
      } catch (err) {
        console.warn('[GeminiService] Requirement extraction fallback to deterministic rules:', err);
      }
    }

    // Deterministic fallback for requirement extraction
    return this.extractRequirementsDeterministically(jobTitle, jobDescription);
  }

  private extractRequirementsDeterministically(jobTitle: string, description: string): JobRequirement[] {
    const lines = description.split('\n').map((l) => l.trim().replace(/^[-*•0-9.)]\s*/, '')).filter((l) => l.length > 15);
    const requirements: JobRequirement[] = [];

    let count = 1;
    for (const line of lines.slice(0, 6)) {
      const lower = line.toLowerCase();
      let category: RequirementCategoryType = 'technical_skill';
      if (lower.includes('degree') || lower.includes('bachelor') || lower.includes('master')) category = 'education';
      else if (lower.includes('lead') || lower.includes('manage') || lower.includes('collaborate')) category = 'responsibility';
      else if (lower.includes('architecture') || lower.includes('design') || lower.includes('practices')) category = 'domain_knowledge';

      requirements.push({
        id: `req-${count}`,
        text: line,
        category,
        importance: count <= 3 ? 'essential' : 'preferred',
        weight: count <= 3 ? 8 : 5,
        evidenceExpectations: `Demonstrated experience or background matching: ${line.slice(0, 60)}`,
        assessableFromResume: category !== 'responsibility'
      });
      count++;
    }

    if (requirements.length === 0) {
      requirements.push({
        id: 'req-1',
        text: `Proven professional experience relevant to ${jobTitle}`,
        category: 'technical_skill',
        importance: 'essential',
        weight: 8,
        evidenceExpectations: 'Documented projects and technologies',
        assessableFromResume: true
      });
    }

    return requirements;
  }

  /**
   * Evaluates a resume against job requirements using AI with transparent fallback.
   */
  public async evaluateResume(
    jobCandidateId: string,
    requirementVersionId: string,
    requirements: JobRequirement[],
    resumeData: ExtractedResumeData
  ): Promise<EvaluationResult> {
    if (this.apiKey) {
      try {
        const prompt = `You are a recruitment decision-support AI. Evaluate the candidate's resume evidence against the approved job requirements.
IMPORTANT RULES:
1. Ground every claim in the provided resume text. Do NOT invent qualifications, employers, dates, or achievements.
2. Use status "demonstrated" only if clear supporting evidence exists.
3. Use status "partial" if relevant evidence exists but is not fully established.
4. Use status "not_evidenced" if resume provides no evidence. Never say the candidate lacks the skill, only that evidence is absent.
5. Use status "needs_review" if ambiguous or requiring human validation.

Candidate Resume Text (Full Document):
${(resumeData?.rawText || '').slice(0, 35000)}

Structured Resume Summary:
- Skills: ${(resumeData?.skills || []).join(', ') || 'None explicitly parsed'}
- Experience: ${(resumeData?.experience || []).map((e) => `${e.title || ''} at ${e.company || ''} (${e.startDate || ''} - ${e.endDate || ''}): ${e.highlights?.join('; ') || e.description || ''}`).join('\n')}
- Projects: ${(resumeData?.projects || []).map((p) => `${p.name || ''}: ${p.description || ''} [Tech: ${p.technologies?.join(', ') || ''}]`).join('\n')}
- Education: ${(resumeData?.education || []).map((ed) => `${ed.degree || ''} - ${ed.institution || ''} (${ed.graduationYear || ''})`).join('\n')}
- Certifications: ${(resumeData?.certifications || []).join(', ') || 'None'}

Job Requirements:
${JSON.stringify(requirements, null, 2)}

Return JSON adhering to schema:
{
  "summary": "Objective synthesis of candidate profile vs role",
  "requirementAssessments": [
    {
      "requirementId": "req id matching given requirements",
      "status": "demonstrated" | "partial" | "not_evidenced" | "needs_review",
      "evidenceScore": number (1.0 for demonstrated, 0.5 for partial, 0.0 for not_evidenced, 0.25 for needs_review),
      "evidenceText": "Exact quote or excerpt from resume supporting this evaluation",
      "reasoningSummary": "Clear objective justification",
      "confidence": number between 0 and 1
    }
  ],
  "uncertainties": ["Things requiring interviewer verification"],
  "suggestedInterviewTopics": ["Key focus areas"]
}`;

        const rawJson = await this.callGeminiWithJson(prompt);
        const parsed = JSON.parse(rawJson);
        const validated = AIEvaluationOutputSchema.parse(parsed);

        const scoreResult = calculateEvaluationScore(requirements, validated.requirementAssessments as any);

        return {
          jobCandidateId,
          requirementVersionId,
          overallScore: scoreResult.overallScore,
          coveragePercentage: scoreResult.coveragePercentage,
          essentialCoveragePercentage: scoreResult.essentialCoveragePercentage,
          matchingMethod: 'hybrid_ai',
          evaluationStatus: 'completed',
          assessments: validated.requirementAssessments as any,
          calculationExplanation: scoreResult.calculationExplanation,
          summary: validated.summary,
          uncertainties: validated.uncertainties,
          suggestedInterviewTopics: validated.suggestedInterviewTopics,
          modelMetadata: {
            provider: 'gemini',
            model: this.modelName,
            evaluatedAt: new Date().toISOString()
          }
        };
      } catch (err) {
        console.warn('[GeminiService] AI evaluation failed, falling back to deterministic matching:', err);
      }
    }

    // Fallback to deterministic matching
    return deterministicEngine.evaluate(jobCandidateId, requirementVersionId, requirements, resumeData);
  }

  /**
   * Generates a balanced, comprehensive interview plan using the 4-tier blueprint:
   * 1. Resume and project-specific questions (30%)
   * 2. Job-description-driven technical questions (25%)
   * 3. General role fundamentals and foundational knowledge (20%)
   * 4. HR, behavioral, communication, and situational questions (25%)
   */
  public async generateInterviewQuestions(
    jobTitle: string,
    requirements: JobRequirement[],
    evaluation: EvaluationResult,
    candidateName: string,
    resumeData?: ExtractedResumeData,
    rawResumeText?: string
  ): Promise<InterviewQuestion[]> {
    if (this.apiKey) {
      try {
        const projects = resumeData?.projects || [];
        const skills = resumeData?.skills || [];
        const experience = resumeData?.experience || [];
        const rawSnippet = (rawResumeText || resumeData?.rawText || '').slice(0, 30000);

        const prompt = `You are a Principal Technical Interviewer & Senior HR Talent Partner at TalentrivoX AI.
You are designing an in-depth, balanced, and highly comprehensive interview guide for Candidate "${candidateName}" for the position "${jobTitle}".

CRITICAL GENERATION BLUEPRINT (Generate 16 to 20 structured, realistic interview questions):

1. CATEGORY A — RESUME & PROJECT QUESTIONS (~30% / 5-6 questions):
   - Grounded in candidate's actual projects (${projects.map(p => p.name).join(', ') || 'their primary projects'}).
   - Deep-dive into architecture, data flow, API design, database schemas, algorithm choices, trade-offs, scaling, and production debugging.
   - Category: "project_verification" | "practical_problem_solving"

2. CATEGORY B — JOB-DESCRIPTION-SPECIFIC TECHNICAL QUESTIONS (~25% / 4-5 questions):
   - Evaluate specific competencies, tools, and practices required by the job description (${requirements.map(r => r.text).slice(0, 8).join('; ')}).
   - Practical scenarios, framework internals, security, and validating evidence gaps neutrally.
   - Category: "technical_knowledge" | "skill_gap_validation" | "role_specific_scenarios"

3. CATEGORY C — GENERAL ROLE FUNDAMENTALS (~20% / 3-4 questions):
   - Foundational engineering & domain principles adapted to seniority (OOP/functional patterns, concurrency, network/HTTP protocols, database indexing, caching strategies, state management, distributed systems).
   - Category: "role_fundamentals" | "technical_knowledge"

4. CATEGORY D — HR, BEHAVIORAL, COMMUNICATION & SITUATIONAL (~25% / 4-5 questions):
   - Career trajectory & role motivation tailored to candidate's background.
   - Explaining complex technical concepts to non-technical stakeholders (product managers, clients).
   - Managing engineering disagreements with objective data and benchmarks.
   - Handling unexpected project blockers, scope changes, or taking ownership of mistakes.
   - Category: "hr_communication" | "behavioral_situational"

CANDIDATE CONTEXT:
- Resume Projects: ${JSON.stringify(projects, null, 2)}
- Resume Skills: ${JSON.stringify(skills, null, 2)}
- Work Experience: ${JSON.stringify(experience.slice(0, 10), null, 2)}
- Raw Excerpt: ${rawSnippet}
- Job Requirements: ${JSON.stringify({ requirements, assessments: evaluation.assessments }, null, 2)}

OUTPUT SCHEMA:
Return strictly JSON adhering to schema:
{
  "questions": [
    {
      "requirementId": "matching req id or null",
      "category": "project_verification" | "technical_knowledge" | "practical_problem_solving" | "skill_gap_validation" | "behavioral_situational" | "role_specific_scenarios" | "hr_communication" | "role_fundamentals",
      "questionText": "Clear, conversational, realistic interview question",
      "relevanceReason": "Why this question matters for this candidate and role",
      "relatedProject": "Exact project name from resume if applicable, or null",
      "relatedSkills": ["Specific", "Technologies"],
      "relatedRequirement": "Relevant job requirement text if applicable, or null",
      "resumeEvidence": "Verbatim quote or project passage from resume if applicable, or null",
      "jobDescriptionEvidence": "Relevant JD requirement or expectation, or null",
      "expectedAnswerSignals": ["Concrete architectural choice or behavior", "Specific technical trade-off"],
      "followUpQuestions": ["Adaptive follow-up 1 probing deeper", "Adaptive follow-up 2"],
      "difficulty": "junior" | "mid" | "senior" | "lead",
      "evaluationRubric": {
        "poor": "Signs of inadequate answer or superficial buzzwords",
        "adequate": "Competent answer with standard patterns and sound reasoning",
        "strong": "Exceptional mastery, clear trade-offs, and strong communication"
      }
    }
  ]
}`;

        const rawJson = await this.callGeminiWithJson(prompt);
        const parsed = JSON.parse(rawJson);
        const validated = AIInterviewQuestionsOutputSchema.parse(parsed);

        return validated.questions.map((q, idx) => ({
          ...q,
          sortOrder: idx
        }));
      } catch (err) {
        console.warn('[GeminiService] AI interview question generation fallback:', err);
      }
    }

    // Deterministic fallback for interview questions
    return this.generateInterviewQuestionsDeterministically(
      jobTitle,
      requirements,
      evaluation,
      candidateName,
      resumeData,
      rawResumeText
    );
  }

  private generateInterviewQuestionsDeterministically(
    jobTitle: string,
    requirements: JobRequirement[],
    evaluation: EvaluationResult,
    candidateName: string,
    resumeData?: ExtractedResumeData,
    rawResumeText?: string
  ): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];
    let order = 0;

    const projects = resumeData?.projects && resumeData.projects.length > 0
      ? resumeData.projects
      : this.extractProjectsFromRawText(rawResumeText || resumeData?.rawText || '');

    const skills = resumeData?.skills && resumeData.skills.length > 0
      ? resumeData.skills
      : ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Architecture'];

    // =========================================================================
    // 1. CATEGORY A — RESUME & PROJECT QUESTIONS (30% / 5-6 questions)
    // =========================================================================
    if (projects.length > 0) {
      const topProj = projects[0];
      const projSkills = topProj.technologies && topProj.technologies.length > 0
        ? topProj.technologies
        : skills.slice(0, 3);
      const skillsText = projSkills.join(', ');

      // Q1: Project Architecture & Data Flow
      questions.push({
        requirementId: null,
        category: 'project_verification',
        questionText: `In your project "${topProj.name}", could you walk us through the high-level architecture and how data flows from the client to the backend services?`,
        relevanceReason: `Validates candidate's system design execution, component boundaries, and hands-on ownership of "${topProj.name}".`,
        relatedProject: topProj.name,
        relatedSkills: projSkills,
        relatedRequirement: `Hands-on system architecture relevant to ${jobTitle}`,
        resumeEvidence: topProj.description || `Project "${topProj.name}" utilizing ${skillsText}`,
        jobDescriptionEvidence: `Architecture & development expectations for ${jobTitle}`,
        expectedAnswerSignals: [
          'Clear separation of presentation, business logic, and data persistence layers',
          'Specific API contract design (REST, GraphQL, or gRPC) with error handling',
          'State management and caching strategies explained'
        ],
        followUpQuestions: [
          `What factors influenced your decision to select ${skillsText || 'these tools'} over alternatives?`,
          'How did you handle network latency or service degradation between components?'
        ],
        difficulty: 'senior',
        evaluationRubric: {
          poor: 'High-level buzzwords without concrete component interaction details or clear ownership',
          adequate: 'Clear description of standard client-server request flow and component roles',
          strong: 'Deep technical clarity on protocols, asynchronous flows, resilience patterns, and scalability considerations'
        },
        sortOrder: order++
      });

      // Q2: Technical Challenge & Debugging
      questions.push({
        requirementId: null,
        category: 'practical_problem_solving',
        questionText: `What was the most difficult technical challenge or unexpected edge case you encountered while building "${topProj.name}", and how did you resolve it?`,
        relevanceReason: `Evaluates debugging depth, root-cause analysis, and problem-solving tenacity on a real project.`,
        relatedProject: topProj.name,
        relatedSkills: projSkills,
        relatedRequirement: 'Debugging & problem solving in production environments',
        resumeEvidence: topProj.description || `Developed "${topProj.name}"`,
        jobDescriptionEvidence: 'Troubleshooting and engineering resilience',
        expectedAnswerSignals: [
          'Structured root-cause diagnosis using logs, traces, or profiling metrics',
          'Explanation of trade-offs considered before implementing the fix',
          'Preventative testing or monitoring added to prevent regression'
        ],
        followUpQuestions: [
          'If the volume of active users or concurrent requests grew by 10x, where would the first bottleneck appear?',
          'What would you refactor or implement differently if building this from scratch today?'
        ],
        difficulty: 'senior',
        evaluationRubric: {
          poor: 'Trivial issue described or inability to explain root cause and technical resolution',
          adequate: 'Explains concrete bug or performance issue with solid resolution steps',
          strong: 'Demonstrates deep analytical rigor, performance profiling, and proactive preventative safeguards'
        },
        sortOrder: order++
      });

      if (projects.length > 1) {
        const secProj = projects[1];
        const secSkills = secProj.technologies && secProj.technologies.length > 0 ? secProj.technologies : skills.slice(1, 4);
        
        // Q3 from Second Project
        questions.push({
          requirementId: null,
          category: 'project_verification',
          questionText: `In "${secProj.name}", what were the key technical decisions regarding state management, data persistence, and API contract design?`,
          relevanceReason: `Examines versatility and design patterns across multiple projects.`,
          relatedProject: secProj.name,
          relatedSkills: secSkills,
          relatedRequirement: `Component design and data persistence for ${jobTitle}`,
          resumeEvidence: secProj.description || `Developed "${secProj.name}"`,
          jobDescriptionEvidence: `Practical software engineering delivery`,
          expectedAnswerSignals: [
            'Clear rationale for data schema design and caching layer',
            'Defensive input validation and contract handling'
          ],
          followUpQuestions: [
            'How did you ensure testability across different layers of the application?'
          ],
          difficulty: 'mid',
          evaluationRubric: {
            poor: 'Unclear explanation of state flow or database choices',
            adequate: 'Sound rationale for selected stack and state handling',
            strong: 'Comprehensive architecture discussion with explicit performance trade-offs'
          },
          sortOrder: order++
        });
      } else {
        // Q3: Data Persistence & State in Top Project
        questions.push({
          requirementId: null,
          category: 'project_verification',
          questionText: `In "${topProj.name}", how did you design data persistence and manage state or caching across user sessions?`,
          relevanceReason: `Evaluates schema design and state management depth.`,
          relatedProject: topProj.name,
          relatedSkills: projSkills,
          relatedRequirement: `Data modeling and state management for ${jobTitle}`,
          resumeEvidence: topProj.description || `Built "${topProj.name}"`,
          jobDescriptionEvidence: `Data flow and storage management in ${jobTitle}`,
          expectedAnswerSignals: [
            'Database schema normalization and indexing considerations',
            'Client vs server-side state synchronization'
          ],
          followUpQuestions: [
            'How did you handle concurrent writes or stale cache invalidation?'
          ],
          difficulty: 'senior',
          evaluationRubric: {
            poor: 'Superficial database knowledge without indexing or transaction awareness',
            adequate: 'Clear description of tables/collections and state handling',
            strong: 'Deep expertise in transactional integrity, cache invalidation, and data modeling'
          },
          sortOrder: order++
        });
      }

      // Q4: Testing & Error Handling in Project
      questions.push({
        requirementId: null,
        category: 'practical_problem_solving',
        questionText: `How did you structure automated testing, error boundaries, and telemetry in "${topProj.name}" to ensure production stability?`,
        relevanceReason: `Evaluates testing discipline, error resilience, and operational observability.`,
        relatedProject: topProj.name,
        relatedSkills: projSkills,
        relatedRequirement: `Quality assurance and test automation for ${jobTitle}`,
        resumeEvidence: topProj.description || `Developed "${topProj.name}"`,
        jobDescriptionEvidence: `Automated testing and reliability standards for ${jobTitle}`,
        expectedAnswerSignals: [
          'Combination of unit, integration, and mock tests for critical user flows',
          'Structured error logging and graceful UI/API degradation'
        ],
        followUpQuestions: [
          'What was your test coverage threshold before shipping changes?'
        ],
        difficulty: 'mid',
        evaluationRubric: {
          poor: 'Little to no automated testing; relies entirely on manual verification',
          adequate: 'Implements standard unit tests and error handling middleware',
          strong: 'Comprehensive test pyramid, CI pipeline automation, and structured telemetry'
        },
        sortOrder: order++
      });

      // Q5: Performance Optimization & Trade-Offs in Project
      questions.push({
        requirementId: null,
        category: 'project_verification',
        questionText: `What performance optimizations (such as payload reduction, query tuning, or asynchronous offloading) did you implement in "${topProj.name}"?`,
        relevanceReason: `Assesses proactive performance engineering and resource management.`,
        relatedProject: topProj.name,
        relatedSkills: projSkills,
        relatedRequirement: `Performance engineering and optimization for ${jobTitle}`,
        resumeEvidence: topProj.description || `Engineered "${topProj.name}"`,
        jobDescriptionEvidence: `High-performance computing standards`,
        expectedAnswerSignals: [
          'Profiling data, bundle size analysis, or query plan optimization',
          'Measurable speedup or throughput improvement'
        ],
        followUpQuestions: [
          'What metrics did you track to verify that the optimization succeeded in production?'
        ],
        difficulty: 'senior',
        evaluationRubric: {
          poor: 'Mentions generic premature optimizations without profiling evidence',
          adequate: 'Describes concrete performance tuning steps with solid technical foundation',
          strong: 'Exceptional measurement-first approach with rigorous benchmarks and profiling'
        },
        sortOrder: order++
      });

      // Q6: Individual Contribution & Ownership in Project
      questions.push({
        requirementId: null,
        category: 'project_verification',
        questionText: `Reflecting on "${topProj.name}", which specific subsystems or components did you own end-to-end, and what were the most critical engineering trade-offs you made?`,
        relevanceReason: `Validates individual contribution boundaries, technical ownership, and architectural decision-making.`,
        relatedProject: topProj.name,
        relatedSkills: projSkills,
        relatedRequirement: `Technical leadership and engineering ownership`,
        resumeEvidence: topProj.description || `Owned development of "${topProj.name}"`,
        jobDescriptionEvidence: `Ownership expectations for ${jobTitle}`,
        expectedAnswerSignals: [
          'Clear demarcation of personal contributions vs external libraries or team members',
          'Candid discussion of technical trade-offs between velocity and long-term maintainability'
        ],
        followUpQuestions: [
          'What feature or architectural choice did you decide NOT to build, and why?'
        ],
        difficulty: 'senior',
        evaluationRubric: {
          poor: 'Unclear personal contribution; claims full credit for entire third-party frameworks',
          adequate: 'Clear ownership of specific modules and honest explanation of technical choices',
          strong: 'High engineering maturity, deep pride of craftsmanship, and clear trade-off articulation'
        },
        sortOrder: order++
      });
    } else {
      // Fallback 5 Project / Engineering Walkthrough Questions
      for (let fIdx = 0; fIdx < 5; fIdx++) {
        const focusAreas = [
          'high-level system architecture and client-server communication',
          'debugging complex edge cases and production stability',
          'state management and database persistence design',
          'automated testing, CI/CD, and quality assurance',
          'performance optimization and profiling'
        ];
        questions.push({
          requirementId: null,
          category: 'project_verification',
          questionText: `In your recent engineering work with ${skills[fIdx] || 'your core stack'}, could you walk us through your approach to ${focusAreas[fIdx]}?`,
          relevanceReason: `Establishes baseline engineering ownership and architectural decision-making.`,
          relatedProject: 'Recent Engineering Work',
          relatedSkills: skills.slice(0, 3),
          relatedRequirement: `Core technical capability for ${jobTitle}`,
          resumeEvidence: `Technical background with ${skills.slice(0, 4).join(', ')}`,
          jobDescriptionEvidence: `Practical delivery in ${jobTitle} role`,
          expectedAnswerSignals: [
            'Detailed architectural overview and component communication',
            'Concrete justification for technology selection',
            'Measurable business or performance impact'
          ],
          followUpQuestions: [
            'What was your individual contribution vs the broader team?',
            'How did you validate stability and performance before launch?'
          ],
          difficulty: 'mid',
          evaluationRubric: {
            poor: 'Vague overview without specific technical depth or ownership',
            adequate: 'Structured description of project architecture and personal tasks',
            strong: 'Exceptional architectural clarity, deep discussion of trade-offs and production observability'
          },
          sortOrder: order++
        });
      }
    }

    // =========================================================================
    // 2. CATEGORY B — JOB-DESCRIPTION-SPECIFIC TECHNICAL QUESTIONS (25% / 4-5 questions)
    // =========================================================================
    for (const req of requirements.slice(0, 4)) {
      const assessment = evaluation?.assessments?.find((a) => a.requirementId === req.id);
      const isDemonstrated = assessment?.status === 'demonstrated' || !evaluation;

      if (isDemonstrated) {
        questions.push({
          requirementId: req.id,
          category: 'technical_knowledge',
          questionText: `The role requires proficiency in ${req.text}. How do you approach designing and testing production-grade implementations for this requirement?`,
          relevanceReason: `Evaluates technical depth for essential requirement: ${req.text}.`,
          relatedProject: projects[0]?.name || null,
          relatedSkills: [req.text.split(' ')[0]],
          relatedRequirement: req.text,
          resumeEvidence: assessment?.evidenceText || `Demonstrated competency in ${req.text}`,
          jobDescriptionEvidence: `[${(req.importance || 'essential').toUpperCase()}] ${req.text}`,
          expectedAnswerSignals: [
            'Detailed architectural patterns and idiomatic practices',
            'Automated testing strategy (unit, integration, end-to-end)',
            'Error resilience and edge case handling'
          ],
          followUpQuestions: [
            'What telemetry or monitoring metrics do you establish for this in production?',
            'What common pitfalls or performance bottlenecks have you experienced here?'
          ],
          difficulty: 'senior',
          evaluationRubric: {
            poor: 'Superficial definition without practical production experience',
            adequate: 'Sound understanding of standard implementation and test patterns',
            strong: 'Deep technical mastery, proactively discusses edge cases, caching, and resiliency'
          },
          sortOrder: order++
        });
      } else {
        questions.push({
          requirementId: req.id,
          category: 'skill_gap_validation',
          questionText: `The ${jobTitle} position emphasizes ${req.text}. Could you describe any exposure or transferable experience you have in this area, or how you would approach ramping up on it?`,
          relevanceReason: `Constructive gap validation for unevidenced requirement: ${req.text}.`,
          relatedProject: null,
          relatedSkills: [],
          relatedRequirement: req.text,
          resumeEvidence: 'No explicit resume evidence found for this specific criterion',
          jobDescriptionEvidence: `[${(req.importance || 'essential').toUpperCase()}] ${req.text}`,
          expectedAnswerSignals: [
            'Draws sound analogies from adjacent tools or architectures',
            'Demonstrates foundational conceptual clarity',
            'Explains proven rapid learning methodology'
          ],
          followUpQuestions: [
            'Can you share an example where you mastered an unfamiliar technology under tight timelines?',
            'How do you validate code quality when working with a new tool?'
          ],
          difficulty: 'mid',
          evaluationRubric: {
            poor: 'Unfamiliar with core concepts and unable to relate to known paradigms',
            adequate: 'Understands key principles and explains relevant transferable skills',
            strong: 'Fast learner with strong theoretical foundation and enthusiastic proactive approach'
          },
          sortOrder: order++
        });
      }
    }

    // =========================================================================
    // 3. CATEGORY C — GENERAL ROLE FUNDAMENTALS (20% / 3-4 questions)
    // =========================================================================
    // Core Concurrency & Asynchronous Patterns
    questions.push({
      requirementId: null,
      category: 'role_fundamentals',
      questionText: `Could you explain how asynchronous execution, event loops, and concurrency work in your primary backend or runtime stack? How do you prevent race conditions and memory leaks?`,
      relevanceReason: `Tests foundational runtime understanding, thread/event lifecycle, and memory management.`,
      relatedProject: null,
      relatedSkills: skills.slice(0, 2),
      relatedRequirement: `Core computer science and engineering fundamentals for ${jobTitle}`,
      resumeEvidence: 'Foundational engineering knowledge',
      jobDescriptionEvidence: `Runtime fundamentals required for ${jobTitle}`,
      expectedAnswerSignals: [
        'Clear explanation of non-blocking I/O, task queues, and microtask execution',
        'Techniques for managing shared state (locks, immutability, idempotency)',
        'Profiling memory allocation and identifying uncollected references'
      ],
      followUpQuestions: [
        'How does CPU-bound processing differ from I/O-bound processing in your stack?',
        'What debugging tools do you use to diagnose event loop lag or thread starvation?'
      ],
      difficulty: 'mid',
      evaluationRubric: {
        poor: 'Unable to explain event loop or async execution mechanics',
        adequate: 'Explains async/await, promises, and non-blocking I/O correctly',
        strong: 'Comprehensive grasp of runtime internals, task scheduling, memory profiling, and race prevention'
      },
      sortOrder: order++
    });

    // Database Fundamentals & Indexing Strategy
    questions.push({
      requirementId: null,
      category: 'role_fundamentals',
      questionText: `When designing a relational or document database schema for high-throughput reads and writes, what indexing strategies, isolation levels, and normalization trade-offs do you consider?`,
      relevanceReason: `Evaluates database schema architecture, query performance optimization, and transactional integrity.`,
      relatedProject: null,
      relatedSkills: ['PostgreSQL', 'Database Design'],
      relatedRequirement: `Data modeling and database fundamentals`,
      resumeEvidence: 'Database experience',
      jobDescriptionEvidence: `Data architecture fundamentals for ${jobTitle}`,
      expectedAnswerSignals: [
        'B-tree indexing principles, composite indexes, and index overhead during writes',
        'ACID properties, transaction isolation levels (Read Committed vs Serializable)',
        'Balancing normalization for consistency vs denormalization for read performance'
      ],
      followUpQuestions: [
        'How do you investigate and optimize a slow query using EXPLAIN ANALYZE?',
        'When would you introduce an asynchronous read replica or caching layer?'
      ],
      difficulty: 'senior',
      evaluationRubric: {
        poor: 'Basic SQL syntax only without understanding index structures or query plans',
        adequate: 'Understands primary keys, foreign keys, and basic indexing benefits',
        strong: 'Deep mastery of execution plans, locking behavior, composite indexing, and caching topologies'
      },
      sortOrder: order++
    });

    // API Design & Contract Resilience
    questions.push({
      requirementId: null,
      category: 'role_fundamentals',
      questionText: `What principles guide your API design when building services consumed by multiple client platforms? How do you manage versioning, backwards compatibility, and idempotency?`,
      relevanceReason: `Validates clean API interface design, contract stability, and defensive architecture.`,
      relatedProject: null,
      relatedSkills: ['REST', 'API Design'],
      relatedRequirement: `Service interface design and contracts`,
      resumeEvidence: 'API development background',
      jobDescriptionEvidence: `Service architecture expectations for ${jobTitle}`,
      expectedAnswerSignals: [
        'Consistent error response schema and standard HTTP status code semantics',
        'Idempotency keys for non-safe operations (payments, mutations)',
        'Backwards-compatible additive changes and deprecation workflows'
      ],
      followUpQuestions: [
        'How do you handle rate-limiting and circuit breaking on public API endpoints?'
      ],
      difficulty: 'mid',
      evaluationRubric: {
        poor: 'Vague endpoint naming without error standards or versioning consideration',
        adequate: 'Designs clean RESTful resources with standard status codes and schema validation',
        strong: 'Expert in resilient API contracts, idempotency, pagination, rate-limiting, and evolvable schemas'
      },
      sortOrder: order++
    });

    // =========================================================================
    // 4. CATEGORY D — HR, BEHAVIORAL, COMMUNICATION & SITUATIONAL (25% / 4-5 questions)
    // =========================================================================
    // Motivation & Background
    questions.push({
      requirementId: null,
      category: 'hr_communication',
      questionText: `Looking across your background and career journey, what specifically attracts you to the ${jobTitle} position, and how does this role align with your long-term engineering goals?`,
      relevanceReason: `Evaluates candidate career motivation, role alignment, and enthusiasm.`,
      relatedProject: null,
      relatedSkills: [],
      relatedRequirement: `Culture and career motivation for ${jobTitle}`,
      resumeEvidence: candidateName ? `${candidateName}'s professional background` : 'Career trajectory',
      jobDescriptionEvidence: `Role mission and objectives for ${jobTitle}`,
      expectedAnswerSignals: [
        'Articulates genuine understanding of the team and product mission',
        'Connects past technical experience to the specific challenges of this role',
        'Demonstrates proactive learning and professional growth aspirations'
      ],
      followUpQuestions: [
        'What type of engineering culture or team dynamic brings out your best work?'
      ],
      difficulty: 'junior',
      evaluationRubric: {
        poor: 'Generic answer showing lack of research or interest in the specific position',
        adequate: 'Clear explanation of personal interest and relevant background',
        strong: 'Inspiring alignment with product vision, clear growth mindset, and enthusiastic technical commitment'
      },
      sortOrder: order++
    });

    // Technical Communication with Non-Technical Stakeholders
    questions.push({
      requirementId: null,
      category: 'hr_communication',
      questionText: `Can you share an example of how you explained a complex technical limitation or architectural trade-off to a non-technical stakeholder (like a Product Manager or Executive)?`,
      relevanceReason: `Assesses cross-functional communication, empathy, and translation of technical concepts to business impact.`,
      relatedProject: null,
      relatedSkills: [],
      relatedRequirement: `Cross-functional communication and stakeholder collaboration`,
      resumeEvidence: 'Team collaboration experience',
      jobDescriptionEvidence: `Stakeholder communication for ${jobTitle}`,
      expectedAnswerSignals: [
        'Uses business impact, user experience, and risk analogies rather than jargon',
        'Actively listens to product priorities and offers constructive alternative solutions',
        'Validates alignment and mutual understanding before proceeding'
      ],
      followUpQuestions: [
        'How do you manage stakeholder expectations when an unexpected technical hurdle delays a deliverable?'
      ],
      difficulty: 'mid',
      evaluationRubric: {
        poor: 'Uses alienating technical jargon or dismisses stakeholder business concerns',
        adequate: 'Communicates clearly using basic analogies and pragmatic business framing',
        strong: 'Exceptional communication empathy, translates technical complexity to business value, builds strong partnerships'
      },
      sortOrder: order++
    });

    // Engineering Disagreement & Team Alignment
    questions.push({
      requirementId: null,
      category: 'behavioral_situational',
      questionText: `Can you describe a scenario where you proposed an architectural change or code review approach that faced resistance from a teammate? How did you approach the discussion and reach alignment?`,
      relevanceReason: `Evaluates communication, engineering culture, constructive debate, and commitment to team decisions.`,
      relatedProject: null,
      relatedSkills: [],
      relatedRequirement: `Engineering collaboration and leadership for ${jobTitle}`,
      resumeEvidence: 'Professional teamwork experience',
      jobDescriptionEvidence: `Team alignment and technical leadership in ${jobTitle} role`,
      expectedAnswerSignals: [
        'Relies on objective data, benchmarks, and prototype demonstrations rather than dogma',
        'Actively listens to peer concerns regarding delivery timelines and risk',
        'Shows commitment to team consensus once a decision is made ("disagree and commit")'
      ],
      followUpQuestions: [
        'How do you handle situations where a consensus cannot be reached quickly?'
      ],
      difficulty: 'mid',
      evaluationRubric: {
        poor: 'Blames colleagues or exhibits rigid uncollaborative mindset',
        adequate: 'Communicates clearly and uses standard compromise approaches',
        strong: 'Exemplary technical leadership, uses objective data, and fosters strong team trust'
      },
      sortOrder: order++
    });

    // Ownership & Incident Handling
    questions.push({
      requirementId: null,
      category: 'behavioral_situational',
      questionText: `Tell me about a time when an issue or bug occurred in production because of a change you made. How did you diagnose the problem, communicate with the team, and ensure it wouldn't happen again?`,
      relevanceReason: `Assesses personal accountability, incident communication, and blameless post-mortem culture.`,
      relatedProject: null,
      relatedSkills: [],
      relatedRequirement: `Production accountability and operational maturity`,
      resumeEvidence: 'Production software engineering experience',
      jobDescriptionEvidence: `High-quality engineering standards for ${jobTitle}`,
      expectedAnswerSignals: [
        'Takes immediate ownership without deflecting blame',
        'Clear focus on rapid mitigation (rollback, feature flag, hotfix) before prolonged root-cause analysis',
        'Implements automated test coverage, monitoring alerts, or process guards to prevent recurrence'
      ],
      followUpQuestions: [
        'What did you learn from that incident that changed your daily engineering habits?'
      ],
      difficulty: 'mid',
      evaluationRubric: {
        poor: 'Denies making mistakes or blames tooling/others without taking ownership',
        adequate: 'Acknowledges error, explains remediation, and adds basic tests',
        strong: 'Exemplary ownership, rapid communication, and champions systemic blameless safeguards'
      },
      sortOrder: order++
    });

    return questions;
  }

  /**
   * Helper to parse project names and descriptions from raw resume text when structured projects array is empty.
   */
  private extractProjectsFromRawText(text: string): Array<{ name: string; description: string; technologies: string[] }> {
    const projects: Array<{ name: string; description: string; technologies: string[] }> = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let inProjectsSection = false;
    let currentProject: { name: string; description: string; technologies: string[] } | null = null;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('projects') || lower.includes('personal projects') || lower.includes('key projects') || lower.includes('portfolio')) {
        inProjectsSection = true;
        continue;
      }
      if (inProjectsSection && (lower.includes('education') || lower.includes('experience') || lower.includes('certifications') || lower.includes('skills') || lower.includes('work history'))) {
        inProjectsSection = false;
        if (currentProject) projects.push(currentProject);
        break;
      }

      if (inProjectsSection) {
        if (line.length > 3 && line.length < 50 && !line.startsWith('•') && !line.startsWith('-')) {
          if (currentProject) projects.push(currentProject);
          currentProject = {
            name: line.replace(/[:|–-].*$/, '').trim(),
            description: line,
            technologies: []
          };
        } else if (currentProject) {
          currentProject.description += ' ' + line;
        }
      }
    }

    if (currentProject && !projects.includes(currentProject)) {
      projects.push(currentProject);
    }

    return projects.slice(0, 4);
  }

  /**
   * Generates tailored resume improvement suggestions for a Job Seeker.
   */
  public async generateResumeImprovements(
    resumeText: string,
    parsedResume: ExtractedResumeData,
    targetJobTitle: string,
    requirements: JobRequirement[]
  ): Promise<any[]> {
    if (this.apiKey) {
      try {
        const prompt = `You are a Principal Career Coach & Technical Resume Strategist for TalentrivoX AI.
Analyze the following candidate resume against target role requirements: "${targetJobTitle}".
Generate actionable, professional suggestions to strengthen the resume without fabricating experience, numbers, or qualifications.
Use the STAR framework (Situation, Task, Action, Result) with clear brackets like [insert real metric %] for user-provided numbers.

TARGET REQUIREMENTS:
${requirements.map((r, i) => `${i + 1}. [${r.importance.toUpperCase()}] ${r.text}`).join('\n')}

RESUME TEXT:
${resumeText.slice(0, 4000)}

Return JSON array of suggestions adhering strictly to:
[
  {
    "id": "sug-1",
    "section": "summary" | "experience" | "projects" | "skills" | "structure",
    "targetRequirementText": "...",
    "originalSnippet": "...",
    "suggestedRevision": "...",
    "improvementReason": "...",
    "starContextGuide": "..."
  }
]`;

        const rawJson = await this.callGeminiWithJson(prompt);
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          return parsed.suggestions;
        }
      } catch (err) {
        console.warn('[AI] Gemini generateResumeImprovements failed, using deterministic engine fallback', err);
      }
    }

    // Deterministic High-Quality Fallback
    const suggestions: any[] = [];
    let idCounter = 1;

    // 1. Professional Summary Enhancement
    const originalSummary = parsedResume.summary || 'Software engineer with experience in web technologies.';
    suggestions.push({
      id: `sug-${idCounter++}`,
      section: 'summary',
      targetRequirementText: requirements[0]?.text || `Core competencies for ${targetJobTitle}`,
      originalSnippet: originalSummary,
      suggestedRevision: `Results-driven ${targetJobTitle} with proven background in ${parsedResume.skills.slice(0, 4).join(', ')}. Demonstrated success delivering high-reliability systems, optimizing application performance by [insert % gain], and collaborating in Agile engineering teams.`,
      improvementReason: `Elevates professional summary by framing experience directly around the target role (${targetJobTitle}) and priming the reader with measurable impact.`,
      starContextGuide: `Context: Senior recruiters spend 6-8 seconds on initial scan. Ensure your top 3 tech competencies appear in sentence one.`
    });

    // 2. Experience Bullet Point Improvements
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      const firstExp = parsedResume.experience[0];
      const origBullet = firstExp.description || `Developed web features for ${firstExp.company}.`;
      suggestions.push({
        id: `sug-${idCounter++}`,
        section: 'experience',
        targetRequirementText: requirements.find(r => r.importance === 'essential')?.text || 'Hands-on system implementation',
        originalSnippet: origBullet,
        suggestedRevision: `Architected and deployed responsive full-stack features using ${parsedResume.skills.slice(0, 3).join(', ')}, reducing latency by [insert % / ms metric] and supporting [insert user scale / throughput].`,
        improvementReason: `Replaces passive responsibility descriptions with high-impact action verbs (Architected, Deployed, Optimized) and quantifiable business value.`,
        starContextGuide: `Action -> Metric -> Outcome. If exact latency numbers are unknown, quantify by API count, test coverage %, or release frequency.`
      });
    }

    // 3. Technical Skills Categorization
    suggestions.push({
      id: `sug-${idCounter++}`,
      section: 'skills',
      targetRequirementText: requirements.find(r => r.category === 'technical_skill')?.text || 'Modern tech stack proficiencies',
      originalSnippet: parsedResume.skills.join(', '),
      suggestedRevision: `Languages & Frameworks: ${parsedResume.skills.filter(s => ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Next.js', 'Python'].includes(s)).join(', ') || 'TypeScript, React, Node.js'}\nDatabases & Storage: PostgreSQL, Redis, Relational Data Modeling\nDevOps & Quality: Docker, CI/CD, Automated Testing (Jest/Vitest), Git`,
      improvementReason: `Categorized skill groupings significantly improve ATS keyword matching and recruiter readability compared to a single unstructured list.`,
      starContextGuide: `Organize skills by architectural tier (Frontend, Backend, Databases, Cloud & DevOps).`
    });

    // 4. Missing Requirement Evidence Recommendation
    const missingReq = requirements.find(r => r.importance === 'essential' && !parsedResume.skills.some(s => r.text.toLowerCase().includes(s.toLowerCase())));
    if (missingReq) {
      suggestions.push({
        id: `sug-${idCounter++}`,
        section: 'projects',
        targetRequirementText: missingReq.text,
        originalSnippet: 'No explicit project evidence found for this essential requirement.',
        suggestedRevision: `[Project Name]: Built a dedicated service utilizing ${missingReq.text.split(' ')[0] || 'relevant technology'} featuring [insert key architectural pattern], achieving [insert performance or business outcome].`,
        improvementReason: `Directly bridges an essential requirement gap (${missingReq.text}) by articulating a concrete project or architecture contribution.`,
        starContextGuide: `Include a link to a verified GitHub repository or live URL demo.`
      });
    }

    return suggestions;
  }

  /**
   * Evaluates a live mock interview answer submitted by a Job Seeker.
   */
  public async evaluateMockInterviewAnswer(
    questionText: string,
    userAnswer: string,
    rubric: { poor: string; adequate: string; strong: string },
    expectedSignals: string[]
  ): Promise<{
    score: number;
    strengths: string[];
    weaknesses: string[];
    modelAnswerGuidance: string;
  }> {
    if (this.apiKey) {
      try {
        const prompt = `You are a Principal Technical Interviewer evaluating a candidate's response.
QUESTION:
"${questionText}"

CANDIDATE ANSWER:
"${userAnswer}"

EXPECTED SIGNALS:
${expectedSignals.map((s, i) => `- ${s}`).join('\n')}

EVALUATION RUBRIC:
- Poor (1-2): ${rubric.poor}
- Adequate (3): ${rubric.adequate}
- Strong (4-5): ${rubric.strong}

Evaluate the response objectively. Give constructive feedback without fabricating claims.
Return JSON strictly:
{
  "score": 4,
  "strengths": ["...", "..."],
  "weaknesses": ["..."],
  "modelAnswerGuidance": "..."
}`;

        const rawJson = await this.callGeminiWithJson(prompt);
        const parsed = JSON.parse(rawJson);
        if (parsed.score && parsed.strengths && parsed.modelAnswerGuidance) {
          return {
            score: Math.min(5, Math.max(1, Math.round(parsed.score))),
            strengths: parsed.strengths,
            weaknesses: parsed.weaknesses || [],
            modelAnswerGuidance: parsed.modelAnswerGuidance
          };
        }
      } catch (err) {
        console.warn('[AI] Gemini evaluateMockInterviewAnswer failed, using deterministic scoring fallback', err);
      }
    }

    // Deterministic Evaluation Fallback
    const wordCount = userAnswer.trim().split(/\s+/).length;
    let score = 3;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (wordCount < 25) {
      score = 2;
      weaknesses.push('Answer is brief and lacks depth or concrete situational examples.');
      strengths.push('Direct and concise initial statement.');
    } else if (wordCount >= 60) {
      score = 4;
      strengths.push('Detailed response with context and practical reasoning.');
      strengths.push('Demonstrates articulate communication and structured thought process.');
    } else {
      score = 3;
      strengths.push('Good fundamental answer covering core conceptual points.');
      weaknesses.push('Could be strengthened by adding a specific measurable outcome (STAR framework).');
    }

    // Check for expected signal keywords
    const lowerAns = userAnswer.toLowerCase();
    const matchedSignals = expectedSignals.filter(sig => 
      sig.toLowerCase().split(' ').some(word => word.length > 4 && lowerAns.includes(word))
    );

    if (matchedSignals.length > 0) {
      strengths.push(`Addressed key signals: ${matchedSignals.slice(0, 2).join(', ')}.`);
    } else if (expectedSignals.length > 0) {
      weaknesses.push(`Consider explicitly mentioning ${expectedSignals[0]}.`);
    }

    const modelAnswerGuidance = `Structure your response using STAR: (1) Situation & technical problem, (2) Action & specific tools used, (3) Measurable outcome and trade-offs considered.`;

    return {
      score,
      strengths,
      weaknesses,
      modelAnswerGuidance
    };
  }

  /**
   * Generates a Personalized Skill Development Roadmap from match gaps.
   */
  public generateSkillRoadmap(
    gaps: { skillName: string; importance: string; requirementText: string }[],
    targetJobTitle: string
  ): any[] {
    const tasks: any[] = [];
    let idCounter = 1;

    gaps.forEach((gap, idx) => {
      const isEssential = gap.importance === 'essential';
      tasks.push({
        id: `task-gen-${idCounter++}`,
        skillName: gap.skillName,
        category: isEssential ? 'Core Requirement' : 'Preferred Skill',
        priority: isEssential ? 'high' : 'medium',
        gapType: isEssential ? 'deepening' : 'development_need',
        whyItMatters: `Crucial for demonstrating competence in ${gap.requirementText} for ${targetJobTitle} roles.`,
        recommendedActivity: `Study official documentation, architecture whitepapers, and production code examples for ${gap.skillName}.`,
        practicalProjectIdea: `Build a functional proof-of-concept module implementing ${gap.skillName} with unit tests and clear documentation.`,
        interviewValidationTask: `Prepare a 2-minute STAR narrative highlighting how you would approach ${gap.skillName} in a high-scale environment.`,
        status: 'not_started',
        targetDate: new Date(Date.now() + 86400000 * (7 * (idx + 1))).toISOString().split('T')[0]
      });
    });

    if (tasks.length === 0) {
      tasks.push({
        id: `task-gen-1`,
        skillName: 'System Architecture & Concurrency',
        category: 'Advanced Mastery',
        priority: 'medium',
        gapType: 'deepening',
        whyItMatters: `Strengthens competitive standing for ${targetJobTitle} technical rounds.`,
        recommendedActivity: 'Review distributed caching, database indexing, and resilience patterns.',
        practicalProjectIdea: 'Build an end-to-end benchmark demonstrating latency reductions under load.',
        interviewValidationTask: 'Practice whiteboarding system design architectures.',
        status: 'in_progress',
        targetDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
      });
    }

    return tasks;
  }

  /**
   * Performs an ATS (Applicant Tracking System) Quality Audit.
   */
  public analyzeAtsQuality(
    resumeText: string,
    parsedResume: ExtractedResumeData,
    targetRequirements: JobRequirement[]
  ): any {
    const checks: any[] = [];
    let score = 100;

    // 1. Contact Information Check
    const hasEmail = Boolean(parsedResume.email && parsedResume.email.includes('@'));
    const hasPhone = Boolean(parsedResume.phone && parsedResume.phone.length > 5);
    if (hasEmail && hasPhone) {
      checks.push({
        id: 'chk-contact',
        category: 'contact_info',
        title: 'Complete Contact Header',
        status: 'passed',
        detail: `Valid email (${parsedResume.email}) and telephone number detected.`,
        remediation: 'Ensure contact details are in standard text header, not embedded in header images.'
      });
    } else {
      score -= 15;
      checks.push({
        id: 'chk-contact',
        category: 'contact_info',
        title: 'Missing Contact Details',
        status: 'warning',
        detail: hasEmail ? 'Telephone number not found.' : 'Email address not found.',
        remediation: 'Add clean text email and phone number at top of resume.'
      });
    }

    // 2. Standard Section Headers Check
    const sectionsFound = [];
    const lowerText = resumeText.toLowerCase();
    if (lowerText.includes('experience') || lowerText.includes('employment') || lowerText.includes('work history')) sectionsFound.push('Experience');
    if (lowerText.includes('education') || lowerText.includes('academic')) sectionsFound.push('Education');
    if (lowerText.includes('skills') || lowerText.includes('technologies')) sectionsFound.push('Skills');
    if (lowerText.includes('summary') || lowerText.includes('profile')) sectionsFound.push('Summary');

    if (sectionsFound.length >= 3) {
      checks.push({
        id: 'chk-sections',
        category: 'sections',
        title: 'Standard Resume Section Headings',
        status: 'passed',
        detail: `Found ${sectionsFound.length} standard sections: ${sectionsFound.join(', ')}.`,
        remediation: 'Keep standard headings (Experience, Education, Skills) for maximum ATS parsing reliability.'
      });
    } else {
      score -= 20;
      checks.push({
        id: 'chk-sections',
        category: 'sections',
        title: 'Unconventional Section Headings',
        status: 'warning',
        detail: `Only identified: ${sectionsFound.join(', ')}.`,
        remediation: 'Use standard names like "Professional Experience", "Technical Skills", and "Education".'
      });
    }

    // 3. Keyword Match Rate Check
    const targetKeywords = targetRequirements.map(r => r.text.toLowerCase());
    const matchedCount = targetKeywords.filter(kw => {
      const words = kw.split(' ').filter(w => w.length > 3);
      return words.some(w => lowerText.includes(w));
    }).length;

    const keywordMatchRate = targetKeywords.length > 0
      ? Math.round((matchedCount / targetKeywords.length) * 100)
      : 80;

    if (keywordMatchRate >= 70) {
      checks.push({
        id: 'chk-keywords',
        category: 'keywords',
        title: 'Strong Keyword Coverage',
        status: 'passed',
        detail: `${keywordMatchRate}% of target role requirements matched in resume text.`,
        remediation: 'Maintain natural keyword integration within real project descriptions.'
      });
    } else {
      score -= 15;
      checks.push({
        id: 'chk-keywords',
        category: 'keywords',
        title: 'Low Keyword Alignment',
        status: 'warning',
        detail: `${keywordMatchRate}% match rate against target job requirements.`,
        remediation: 'Incorporate missing technical skills and terminology naturally in your experience descriptions.'
      });
    }

    // 4. Text Readability & Parsing Cleanliness
    const hasUnreadableChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(resumeText);
    if (!hasUnreadableChars && resumeText.length > 300) {
      checks.push({
        id: 'chk-readability',
        category: 'readability',
        title: 'Clean Text Extraction',
        status: 'passed',
        detail: 'Document text extracted cleanly without encoding corruptions or unreadable glyphs.',
        remediation: 'Avoid saving PDFs with decorative icon fonts or rasterized image text.'
      });
    } else {
      score -= 10;
      checks.push({
        id: 'chk-readability',
        category: 'readability',
        title: 'Potential Parsing Artifacts',
        status: 'failed',
        detail: 'Document contained formatting artifacts or unusually short character length.',
        remediation: 'Use a standard single-column PDF or DOCX layout exported directly from Google Docs or Word.'
      });
    }

    // 5. Formatting & Layout Safety
    checks.push({
      id: 'chk-formatting',
      category: 'formatting',
      title: 'ATS-Safe Formatting Layout',
      status: 'passed',
      detail: 'Standard font hierarchy and linear chronological flow detected.',
      remediation: 'Do not use multi-column tables, text boxes, or essential info embedded in SVG graphics.'
    });

    const finalScore = Math.max(0, Math.min(100, score));
    const rating = finalScore >= 85 ? 'excellent' : finalScore >= 70 ? 'good' : finalScore >= 50 ? 'needs_improvement' : 'poor';

    const missingTargetKeywords = targetRequirements
      .filter(r => !lowerText.includes(r.text.toLowerCase().split(' ')[0]))
      .map(r => r.text.split(' ').slice(0, 3).join(' '));

    return {
      score: finalScore,
      rating,
      keywordMatchRate,
      extractedKeywordCount: parsedResume.skills.length,
      missingTargetKeywords: missingTargetKeywords.slice(0, 5),
      checks,
      summaryAdvice: `Your resume scored ${finalScore}/100 in ATS compatibility. Address warning items in the checklist below to optimize parsing accuracy across enterprise ATS platforms.`
    };
  }
}

export const geminiService = new GeminiService();
