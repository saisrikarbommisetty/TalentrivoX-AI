import { describe, it, expect } from 'vitest';
import { documentParser } from '../../src/parser/document.parser';
import { deterministicEngine } from '../../src/matching/deterministic.engine';
import { JobRequirement } from '@avengercoders/shared';

/**
 * Generates multi-page PDF fixture buffers for automated testing.
 */
function createMultiPagePdfBuffer(pages: string[]): Buffer {
  let content = '%PDF-1.4\n';
  pages.forEach((page, i) => {
    content += `--- Page ${i + 1} ---\n${page.trim()}\n\n`;
  });
  content += '%%EOF\n';
  return Buffer.from(content, 'utf-8');
}

describe('Multi-Page Resume Extraction & Screening Pipeline', () => {
  // Scenario 1: One-Page PDF Resume
  it('Scenario 1: Correctly extracts complete text and structured entities from a 1-page PDF', async () => {
    const page1 = `Sarah Jenkins
Email: sarah.jenkins@example.com
Phone: (555) 234-5678
Professional Summary
Experienced full stack software engineer with 5 years of experience building web applications.
Technical Skills
Languages: JavaScript, TypeScript, Python, HTML5, CSS3
Frameworks: React, Node.js, Express, Next.js
Databases: PostgreSQL, Redis, MongoDB
Experience
Senior Frontend Engineer at Acme Corp | 2021 - Present
- Designed scalable React applications with TypeScript and Tailwind CSS
- Improved page load times by 40% through code splitting and memoization
Education
Bachelor of Science in Computer Science
State University 2020`;

    const pdfBuffer = createMultiPagePdfBuffer([page1]);
    const { text, pageCount, isScannedOrEmpty, diagnostics } = await documentParser.extractText(pdfBuffer, 'sarah_resume.pdf');

    expect(pageCount).toBe(1);
    expect(isScannedOrEmpty).toBe(false);
    expect(diagnostics.status).toBe('completed');
    expect(text).toContain('Sarah Jenkins');
    expect(text).toContain('sarah.jenkins@example.com');
    expect(text).toContain('Senior Frontend Engineer');

    const parsed = documentParser.extractDeterministicData(text, 'sarah_resume.pdf');
    expect(parsed.fullName).toBe('Sarah Jenkins');
    expect(parsed.email).toBe('sarah.jenkins@example.com');
    expect(parsed.skills).toContain('TypeScript');
    expect(parsed.skills).toContain('React');
    expect(parsed.skills).toContain('PostgreSQL');
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
  });

  // Scenario 2: Two-Page PDF Resume
  it('Scenario 2: Extracts both pages without overwriting page 1 with page 2', async () => {
    const page1 = `Marcus Vance
Email: marcus.vance@techdev.org
Phone: (555) 987-6543
Professional Summary
Staff Infrastructure and Cloud Engineer specializing in Kubernetes and distributed systems.
Technical Skills
Docker, Kubernetes, AWS, Terraform, Go, Python, Linux, CI/CD, PostgreSQL`;

    const page2 = `Work Experience
Lead Cloud Architect at CloudScale Systems | 2021 - Present
- Architected enterprise AWS infrastructure using Terraform and Kubernetes
- Automated CI/CD deployment pipelines handling 200+ microservices
Senior DevOps Engineer at FinTech Global | 2018 - 2021
- Managed distributed PostgreSQL clusters and Redis caching layers
Education
Master of Science in Distributed Systems
Tech Institute 2018
Certifications
AWS Certified Solutions Architect Professional
CKA Certified Kubernetes Administrator`;

    const pdfBuffer = createMultiPagePdfBuffer([page1, page2]);
    const { text, pageCount, isScannedOrEmpty } = await documentParser.extractText(pdfBuffer, 'marcus_vance.pdf');

    expect(pageCount).toBe(2);
    expect(isScannedOrEmpty).toBe(false);

    // Assert Page 1 content is retained
    expect(text).toContain('Marcus Vance');
    expect(text).toContain('marcus.vance@techdev.org');
    expect(text).toContain('Docker');
    expect(text).toContain('Kubernetes');

    // Assert Page 2 content is retained
    expect(text).toContain('Lead Cloud Architect');
    expect(text).toContain('CloudScale Systems');
    expect(text).toContain('AWS Certified Solutions Architect Professional');

    const parsed = documentParser.extractDeterministicData(text, 'marcus_vance.pdf');
    expect(parsed.fullName).toBe('Marcus Vance');
    expect(parsed.email).toBe('marcus.vance@techdev.org');
    expect(parsed.skills).toContain('Kubernetes');
    expect(parsed.skills).toContain('Terraform');
    expect(parsed.skills).toContain('AWS');
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(1);
  });

  // Scenario 3: Three-Page PDF with Sequential Order Markers
  it('Scenario 3: Extracts a 3-page PDF preserving page ordering and markers in correct sequence', async () => {
    const page1 = `Alex Rivera
Email: alex.rivera@devops.com
SKILL_MARKER_PAGE_1
Technical Skills: React, TypeScript, Node.js, GraphQL`;

    const page2 = `EXPERIENCE_MARKER_PAGE_2
Work Experience
Senior Backend Engineer at DataFlow Inc | 2020 - Present
- Developed microservices using Node.js, TypeScript, and Kafka
- Built real-time analytics streaming pipelines`;

    const page3 = `CERTIFICATION_MARKER_PAGE_3
Certifications
Certified Kubernetes Security Specialist
Education
Bachelor of Engineering
Metropolitan University 2019`;

    const pdfBuffer = createMultiPagePdfBuffer([page1, page2, page3]);
    const { text, pageCount } = await documentParser.extractText(pdfBuffer, 'alex_resume.pdf');

    expect(pageCount).toBe(3);

    // Verify all markers exist
    expect(text).toContain('SKILL_MARKER_PAGE_1');
    expect(text).toContain('EXPERIENCE_MARKER_PAGE_2');
    expect(text).toContain('CERTIFICATION_MARKER_PAGE_3');

    // Verify correct sequential order
    const idx1 = text.indexOf('SKILL_MARKER_PAGE_1');
    const idx2 = text.indexOf('EXPERIENCE_MARKER_PAGE_2');
    const idx3 = text.indexOf('CERTIFICATION_MARKER_PAGE_3');

    expect(idx1).toBeLessThan(idx2);
    expect(idx2).toBeLessThan(idx3);

    const parsed = documentParser.extractDeterministicData(text, 'alex_resume.pdf');
    expect(parsed.fullName).toBe('Alex Rivera');
    expect(parsed.skills).toContain('TypeScript');
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(1);
  });

  // Scenario 4: Multi-page resume with projects spread across pages
  it('Scenario 4: Collects structured projects across distinct pages', async () => {
    const page1 = `Elena Rostova
Email: elena.rostova@ai-lab.io
Projects
Project Alpha: High throughput neural inference engine
Technologies: Python, PyTorch, Docker`;

    const page2 = `Projects
Project Beta: Realtime collaborative canvas platform
Technologies: React, TypeScript, Node.js, Redis`;

    const page3 = `Projects
Project Gamma: Distributed task queue orchestrator
Technologies: Go, Docker, Kubernetes, PostgreSQL`;

    const pdfBuffer = createMultiPagePdfBuffer([page1, page2, page3]);
    const { text, pageCount } = await documentParser.extractText(pdfBuffer, 'elena_projects.pdf');

    expect(pageCount).toBe(3);
    const parsed = documentParser.extractDeterministicData(text, 'elena_projects.pdf');

    expect(parsed.projects.length).toBeGreaterThanOrEqual(2);
    const projectNames = parsed.projects.map((p) => p.name);
    expect(projectNames.some((n) => n.includes('Project Alpha'))).toBe(true);
    expect(projectNames.some((n) => n.includes('Project Beta'))).toBe(true);
  });

  // Scenario 5: PDF containing an empty or low-text page in the middle
  it('Scenario 5: Handles middle page with sparse text without corrupting extraction', async () => {
    const page1 = `David Chen
Email: david.chen@clouddev.com
Summary: Cloud native developer with 6 years experience.
Skills: Go, Docker, Kubernetes, AWS`;

    const page2 = `Portfolio Visual Exhibits and Architectural Charts`;

    const page3 = `Education
Bachelor of Science in Software Engineering
Global University 2018
Certifications
AWS Certified Solutions Architect`;

    const pdfBuffer = createMultiPagePdfBuffer([page1, page2, page3]);
    const { text, pageCount } = await documentParser.extractText(pdfBuffer, 'david_chen.pdf');

    expect(pageCount).toBe(3);
    expect(text).toContain('David Chen');
    expect(text).toContain('david.chen@clouddev.com');
    expect(text).toContain('Global University');
    expect(text).toContain('AWS Certified Solutions Architect');

    const parsed = documentParser.extractDeterministicData(text, 'david_chen.pdf');
    expect(parsed.fullName).toBe('David Chen');
    expect(parsed.skills).toContain('Kubernetes');
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(1);
  });

  // Scenario 6: Scanned / Image-Based PDF Detection
  it('Scenario 6: Correctly detects scanned or image-based PDF requiring OCR', async () => {
    // 2-page PDF with virtually no text (representing scanned images)
    const scannedBuffer = Buffer.from('%PDF-1.4\n--- Page 1 ---\n \n--- Page 2 ---\n \n%%EOF', 'utf-8');
    const { isScannedOrEmpty, diagnostics } = await documentParser.extractText(scannedBuffer, 'scanned_scan.pdf');

    expect(isScannedOrEmpty).toBe(true);
    expect(diagnostics.status).toBe('needs_ocr');
  });

  // Scenario 7: Invalid or Corrupted File Handling
  it('Scenario 7: Rejects empty or corrupt document buffers with descriptive errors', async () => {
    const emptyBuffer = Buffer.from('');
    await expect(documentParser.extractText(emptyBuffer, 'test.pdf')).rejects.toThrow(/Empty file buffer/i);

    const corruptBuffer = Buffer.from('NOT_A_VALID_PDF_OR_DOCX_HEADER', 'utf-8');
    await expect(documentParser.extractText(corruptBuffer, 'corrupt.pdf')).rejects.toThrow(/PDF parsing failed/i);

    const unsupportedBuffer = Buffer.from('Some binary data', 'utf-8');
    await expect(documentParser.extractText(unsupportedBuffer, 'test.exe')).rejects.toThrow(/Unsupported document extension/i);
  });

  // Scenario 8: End-to-End Screening Matching Across Multi-Page Qualifications
  it('Scenario 8: Deterministic Screening Engine scores qualifications across Page 1, 2, and 3', () => {
    const multiPageResumeText = `--- Page 1 ---
Candidate: Samantha Blake
Email: samantha.blake@engineer.org
Summary: Senior Full Stack Architect with 8 years of experience.
Skills: TypeScript, React, Next.js, Node.js, GraphQL

--- Page 2 ---
Work Experience
Principal Software Engineer at TechGlobal | 2019 - Present
- Designed microservices architecture in Node.js and TypeScript handling 50M daily requests
- Led frontend performance engineering with React and Next.js

--- Page 3 ---
Education
Master of Science in Computer Science from Stanford University 2018
Certifications
AWS Certified Solutions Architect Professional`;

    const parsed = documentParser.extractDeterministicData(multiPageResumeText, 'samantha_blake.pdf');

    const requirements: JobRequirement[] = [
      {
        id: 'req-skill-p1',
        text: 'Strong proficiency in TypeScript and React frontend development',
        category: 'technical_skill',
        importance: 'essential',
        weight: 10,
        assessableFromResume: true
      },
      {
        id: 'req-exp-p2',
        text: 'Proven experience designing microservices architecture in high-throughput production environments',
        category: 'experience',
        importance: 'essential',
        weight: 10,
        assessableFromResume: true
      },
      {
        id: 'req-edu-p3',
        text: 'Master degree in Computer Science or related engineering field',
        category: 'education',
        importance: 'preferred',
        weight: 5,
        assessableFromResume: true
      }
    ];

    const result = deterministicEngine.evaluate('candidate-123', 'req-v1', requirements, parsed);

    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.essentialCoveragePercentage).toBe(100);

    const req1Assessment = result.assessments.find((a) => a.requirementId === 'req-skill-p1');
    const req2Assessment = result.assessments.find((a) => a.requirementId === 'req-exp-p2');
    const req3Assessment = result.assessments.find((a) => a.requirementId === 'req-edu-p3');

    // Verify all requirements found evidence from their respective pages
    expect(req1Assessment?.status).toBe('demonstrated');
    expect(req2Assessment?.status).toBe('demonstrated');
    expect(req3Assessment?.status).toBe('demonstrated');
  });
});
