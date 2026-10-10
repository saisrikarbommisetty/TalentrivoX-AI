// Safe document stub for PDF.js font loader in Node.js
if (typeof globalThis !== 'undefined' && !(globalThis as any).document) {
  (globalThis as any).document = {
    createElement: () => ({
      appendChild: () => {},
      setAttribute: () => {},
      sheet: {
        insertRule: () => {},
        cssRules: []
      }
    }),
    getElementsByTagName: () => [],
    head: {
      appendChild: () => {}
    }
  };
}

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';
import zlib from 'zlib';
import {
  ExtractedResumeData,
  CandidateExperienceItem,
  CandidateEducationItem,
  CandidateProjectItem
} from '@avengercoders/shared';

export interface DocumentParseDiagnostics {
  pageCount: number;
  characterCount: number;
  wordCount: number;
  durationMs: number;
  status: 'completed' | 'needs_ocr' | 'failed';
}

export interface DocumentParseResult {
  text: string;
  pageCount: number;
  isScannedOrEmpty: boolean;
  diagnostics: DocumentParseDiagnostics;
  extractedData: ExtractedResumeData;
}

export class DocumentParser {
  /**
   * Sanitizes untrusted document text to prevent null byte injection and control character issues.
   */
  public sanitizeText(raw: string): string {
    return raw
      .replace(/\0/g, '') // strip null bytes
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control characters
      .trim();
  }

  /**
   * Decompresses and extracts string tokens directly from raw PDF content streams.
   */
  public extractStringsFromContentStream(streamContent: string): string {
    const textChunks: string[] = [];

    // 1. Match (text) Tj, ', "
    const parenRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
    let m: RegExpExecArray | null;
    while ((m = parenRegex.exec(streamContent)) !== null) {
      const clean = m[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean && clean.length > 0) textChunks.push(clean);
    }

    // 2. Match [(array of strings and kerning numbers)] TJ
    const arrayRegex = /\[(.*?)\]\s*TJ/g;
    while ((m = arrayRegex.exec(streamContent)) !== null) {
      const inner = m[1];
      const innerParenRegex = /\(([^)]*)\)/g;
      let innerMatch: RegExpExecArray | null;
      let line = '';
      while ((innerMatch = innerParenRegex.exec(inner)) !== null) {
        line += innerMatch[1].replace(/\\([()\\])/g, '$1');
      }
      if (line.trim()) textChunks.push(line.trim());
    }

    // 3. Match <hex> Tj
    const hexRegex = /<([0-9a-fA-F]{2,})>\s*Tj/g;
    while ((m = hexRegex.exec(streamContent)) !== null) {
      try {
        const decoded = Buffer.from(m[1], 'hex').toString('utf-8').trim();
        if (decoded && !decoded.includes('\0')) textChunks.push(decoded);
      } catch {}
    }

    return textChunks.join(' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Decompresses Flate streams from raw PDF buffer and returns extracted text blocks.
   */
  public extractTextFromRawPdfBuffer(buffer: Buffer): string[] {
    const pageTexts: string[] = [];
    const bufferStr = buffer.toString('binary');

    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(bufferStr)) !== null) {
      const rawStream = Buffer.from(match[1], 'binary');
      let decompressed: Buffer | null = null;

      try {
        decompressed = zlib.inflateSync(rawStream);
      } catch {
        try {
          decompressed = zlib.inflateRawSync(rawStream);
        } catch {
          decompressed = rawStream;
        }
      }

      if (decompressed) {
        const text = this.extractStringsFromContentStream(decompressed.toString('utf-8'));
        if (text.length > 5) {
          pageTexts.push(text);
        }
      }
    }

    return pageTexts;
  }

  /**
   * Parses PDF or DOCX buffer and extracts full raw text across all pages in order.
   */
  public async extractText(
    buffer: Buffer,
    filename: string
  ): Promise<{ text: string; pageCount: number; isScannedOrEmpty: boolean; diagnostics: DocumentParseDiagnostics }> {
    const startTime = Date.now();
    const ext = path.extname(filename).toLowerCase();
    let rawText = '';
    let pageCount = 1;

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer provided for resume parsing');
    }

    if (ext === '.pdf') {
      if (!buffer.toString('utf-8', 0, 10).includes('%PDF')) {
        throw new Error('PDF parsing failed: File is missing valid %PDF header or is corrupted.');
      }

      try {
        // Multi-strategy page render handler ensuring no page is discarded
        const pageRenderHandler = async (pageData: any): Promise<string> => {
          const pageIndex = (pageData.pageIndex !== undefined ? pageData.pageIndex : 0) + 1;
          let pageText = '';

          // Strategy 1: Standard getTextContent with positioning
          try {
            const textContent = await pageData.getTextContent({
              normalizeWhitespace: false,
              disableCombineTextItems: false
            });

            let lastY: number | undefined;
            for (const item of textContent.items) {
              if (item && typeof item.str === 'string') {
                if (lastY === undefined || Math.abs(lastY - item.transform[5]) < 2) {
                  pageText += (pageText.length > 0 && !pageText.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
                } else {
                  pageText += '\n' + item.str;
                }
                lastY = item.transform[5];
              }
            }
          } catch (e) {
            // ignore and fallback
          }

          // Strategy 2: Fallback getTextContent with normalized whitespace
          if (!pageText || pageText.trim().length === 0) {
            try {
              const textContent = await pageData.getTextContent({
                normalizeWhitespace: true,
                disableCombineTextItems: true
              });
              pageText = (textContent.items || [])
                .map((i: any) => (i && typeof i.str === 'string' ? i.str : ''))
                .join(' ')
                .trim();
            } catch (e) {
              // ignore and fallback
            }
          }

          return `\n\n--- Page ${pageIndex} ---\n\n` + pageText.trim();
        };

        // Suppress noisy internal PDF.js TrueType bytecode warnings during parsing
        const originalWarn = console.warn;
        const originalLog = console.log;

        console.warn = (...args: any[]) => {
          const str = (args || []).map((a) => String(a || '')).join(' ');
          if (str.includes('TT:') || str.includes('Indexing all PDF objects') || str.includes('undefined function') || str.includes('invalid function id')) {
            return;
          }
          originalWarn.apply(console, args);
        };

        console.log = (...args: any[]) => {
          const str = (args || []).map((a) => String(a || '')).join(' ');
          if (str.includes('TT:') || str.includes('Indexing all PDF objects') || str.includes('undefined function') || str.includes('invalid function id')) {
            return;
          }
          originalLog.apply(console, args);
        };

        let data: any;
        try {
          data = await pdfParse(buffer, {
            pagerender: pageRenderHandler,
            max: 0 // 0 means parse all pages completely
          });
        } finally {
          console.warn = originalWarn;
          console.log = originalLog;
        }

        rawText = data.text || '';
        pageCount = data.numpages || 1;

        // Post-extraction verification: If any page is empty or missing, recover from raw PDF content streams
        const pageSections = rawText.split(/---\s*Page\s*\d+\s*---/i).map((s) => s.trim());
        const hasMissingPage = pageSections.some((s, idx) => idx > 0 && s.length < 5);

        if (hasMissingPage || rawText.trim().length < 30) {
          const streamTexts = this.extractTextFromRawPdfBuffer(buffer);
          if (streamTexts.length > 0) {
            let recoveredText = '';
            const totalCount = Math.max(pageCount, streamTexts.length);
            for (let i = 0; i < totalCount; i++) {
              const parsedPage = pageSections[i + 1] || '';
              const streamPage = streamTexts[i] || '';
              const bestContent = parsedPage.length >= 10 ? parsedPage : streamPage;
              recoveredText += `\n\n--- Page ${i + 1} ---\n\n` + bestContent;
            }
            if (recoveredText.trim().length > rawText.trim().length) {
              rawText = recoveredText;
              pageCount = totalCount;
            }
          }
        }
      } catch (err: any) {
        // Fallback for text-stream / pseudo-PDF test fixtures
        const bufferStr = buffer.toString('utf-8');
        const rawLines = bufferStr.split('\n').map((l) => l.trim());
        const cleanLines = rawLines
          .filter(
            (l) =>
              l.length > 0 &&
              !l.startsWith('%') &&
              !l.startsWith('<<') &&
              !l.includes('/Length') &&
              !l.includes('/Type') &&
              !l.includes('/MediaBox') &&
              !l.includes('/Resources') &&
              !l.includes('obj') &&
              !l.includes('endobj') &&
              !l.includes('stream') &&
              !l.includes('endstream') &&
              !l.includes('xref') &&
              !l.includes('trailer') &&
              !l.includes('startxref') &&
              !l.match(/^(BT|ET|\/F\d+|[0-9.-]+\s+[0-9.-]+\s+Td|T\*|\([^\)]*\)\s*Tj)$/)
          )
          .join('\n')
          .trim();

        const pageMatches = cleanLines.match(/---\s*Page\s*\d+\s*---/gi);
        const detectedPages = pageMatches ? pageMatches.length : 1;

        if (cleanLines.length > 10) {
          rawText = cleanLines;
          pageCount = detectedPages;
        } else {
          throw new Error(`PDF parsing failed: ${err.message || 'Corrupt or unreadable PDF'}`);
        }
      }
    } else if (ext === '.docx' || ext === '.doc') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || '';
        pageCount = 1; // Mammoth extracts full document text without page-break counts
      } catch (err: any) {
        throw new Error(`DOCX parsing failed: ${err.message || 'Corrupt or unreadable Word document'}`);
      }
    } else {
      throw new Error(`Unsupported document extension '${ext}'. Supported extensions are .pdf and .docx`);
    }

    const sanitized = this.sanitizeText(rawText);
    const words = sanitized.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const characterCount = sanitized.length;

    // Detect scanned/image-based documents or empty documents
    const isScannedOrEmpty = wordCount < 15 || (pageCount > 1 && wordCount / pageCount < 8);
    const durationMs = Date.now() - startTime;

    const diagnostics: DocumentParseDiagnostics = {
      pageCount,
      characterCount,
      wordCount,
      durationMs,
      status: isScannedOrEmpty ? 'needs_ocr' : 'completed'
    };

    return {
      text: sanitized,
      pageCount,
      isScannedOrEmpty,
      diagnostics
    };
  }

  /**
   * Deterministic entity and section extractor across all document pages.
   */
  public extractDeterministicData(text: string, originalFilename?: string): ExtractedResumeData {
    const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // Filter out page boundary markers for name extraction
    const contentLines = rawLines.filter((l) => !l.match(/^---\s*Page\s*\d+\s*---$/i));

    // 1. Candidate Name (heuristic: first non-header, non-contact line)
    let fullName = '';
    for (const line of contentLines.slice(0, 10)) {
      if (
        !line.includes('@') &&
        !line.match(/https?:\/\//i) &&
        !line.match(/^(resume|curriculum|vitae|page|phone|email|profile|contact|summary|skills|experience|education)/i) &&
        line.split(/\s+/).length >= 2 &&
        line.split(/\s+/).length <= 5 &&
        !line.includes(':') &&
        !line.match(/\d{4}/)
      ) {
        fullName = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
        break;
      }
    }

    if (!fullName && originalFilename) {
      const namePart = path
        .basename(originalFilename, path.extname(originalFilename))
        .replace(/[-_]?(resume|cv|profile|latest|v\d+)[-_]?/gi, '')
        .replace(/[_\-.]+/g, ' ')
        .trim();
      if (namePart.length > 2) {
        fullName = namePart;
      }
    }

    if (!fullName) fullName = 'Candidate';

    // 2. Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0].toLowerCase() : null;

    // 3. Phone
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : null;

    // 4. Section parsing across all pages
    const { experience, education, projects, certifications, summary, explicitSkills } = this.parseSections(text);

    // 5. Clean, high-signal skills extraction: Prioritize known tech catalog skills + clean valid explicit skills
    const catalogSkills = this.extractKnownSkills(text);
    const allSkillsSet = new Set<string>();

    // Add high-confidence catalog skills first
    for (const s of catalogSkills) {
      allSkillsSet.add(s);
    }

    // Add valid, clean explicit skills (filtered from noise sentences)
    for (const raw of explicitSkills) {
      const s = raw.trim();
      if (!s || s.length < 2 || s.length > 30) continue;
      if (s.split(/\s+/).length > 3) continue; // skip sentence fragments
      if (s.match(/^(etc|and|or|including|proficient|basic|advanced|strong|good|knowledge|experience|responsible|ability|working|skills)$/i)) continue;

      const exists = Array.from(allSkillsSet).some((existing) => existing.toLowerCase() === s.toLowerCase());
      if (!exists) {
        allSkillsSet.add(s);
      }
      if (allSkillsSet.size >= 25) break; // cap to top clean skills
    }

    const skills = Array.from(allSkillsSet).slice(0, 20);

    // 6. Calculate total experience years
    let totalExperienceYears: number | undefined;
    const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
    if (expMatch) {
      totalExperienceYears = parseInt(expMatch[1], 10);
    } else if (experience.length > 0) {
      totalExperienceYears = this.calculateExperienceYearsFromEntries(experience);
    }

    return {
      fullName,
      email,
      phone,
      summary,
      skills,
      experience,
      education,
      projects,
      certifications,
      rawText: text,
      totalExperienceYears
    };
  }

  private extractKnownSkills(text: string): string[] {
    const knownSkillsList = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala',
      'React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Zustand', 'GraphQL',
      'Node.js', 'Express', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Ruby on Rails',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Supabase', 'Firebase', 'SQLite',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux', 'Nginx',
      'REST APIs', 'Microservices', 'System Design', 'Git', 'Agile', 'Scrum', 'Jira', 'Unit Testing', 'Jest', 'Vitest', 'Cypress',
      'Kafka', 'RabbitMQ', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Machine Learning', 'AI', 'NLP', 'SQL', 'NoSQL'
    ];

    const detected = new Set<string>();
    for (const skill of knownSkillsList) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:\\b|[^a-zA-Z0-9])${escaped}(?:\\b|[^a-zA-Z0-9])`, 'i');
      if (regex.test(text)) {
        detected.add(skill);
      }
    }
    return Array.from(detected);
  }

  private parseSections(text: string) {
    const experience: CandidateExperienceItem[] = [];
    const education: CandidateEducationItem[] = [];
    const projects: CandidateProjectItem[] = [];
    const certifications: string[] = [];
    const explicitSkills: string[] = [];
    let summary = '';

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    let currentSection = 'summary';

    let currentExp: Partial<CandidateExperienceItem> | null = null;
    let currentProj: Partial<CandidateProjectItem> | null = null;

    const finalizeExp = () => {
      if (currentExp && (currentExp.title || currentExp.company)) {
        experience.push({
          title: currentExp.title || 'Software Engineer',
          company: currentExp.company || 'Technology Company',
          location: currentExp.location,
          startDate: currentExp.startDate,
          endDate: currentExp.endDate,
          description: currentExp.description || (currentExp.highlights?.join(' ') || ''),
          highlights: currentExp.highlights || []
        });
        currentExp = null;
      }
    };

    const finalizeProj = () => {
      if (currentProj && currentProj.name) {
        projects.push({
          name: currentProj.name,
          description: currentProj.description || 'Project implementation and engineering',
          technologies: currentProj.technologies || []
        });
        currentProj = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Skip page markers in section detection
      if (lower.match(/^---\s*page\s*\d+\s*---$/i)) {
        continue;
      }

      // Section header detection
      if (lower.match(/^(work|professional|employment|career)\s+experience/i) || lower === 'experience' || lower === 'work history' || lower === 'employment history') {
        finalizeExp();
        finalizeProj();
        currentSection = 'experience';
        continue;
      } else if (lower.match(/^education/i) || lower.match(/^academic background/i) || lower.match(/^academic qualifications/i) || lower.match(/^qualifications/i)) {
        finalizeExp();
        finalizeProj();
        currentSection = 'education';
        continue;
      } else if (lower.match(/^(key\s+)?projects/i) || lower.match(/^personal projects/i) || lower.match(/^portfolio/i) || lower.match(/^academic projects/i)) {
        finalizeExp();
        finalizeProj();
        currentSection = 'projects';
        continue;
      } else if (lower.match(/^certifications/i) || lower.match(/^licenses/i) || lower.match(/^courses & certifications/i) || lower.match(/^certifications & licenses/i)) {
        finalizeExp();
        finalizeProj();
        currentSection = 'certifications';
        continue;
      } else if (lower.match(/^(technical|soft|core|key|professional|functional|industry)\s+skills/i) || lower === 'skills' || lower === 'core competencies' || lower === 'technologies' || lower === 'tech stack' || lower === 'tools & technologies') {
        finalizeExp();
        finalizeProj();
        currentSection = 'skills';
        continue;
      } else if (lower.match(/^(professional\s+)?summary/i) || lower.match(/^about me/i) || lower.match(/^profile/i) || lower.match(/^objective/i) || lower.match(/^career objective/i)) {
        finalizeExp();
        finalizeProj();
        currentSection = 'summary';
        continue;
      } else if (lower.match(/^(languages|achievements|awards|honors|publications|interests|hobbies|extracurricular|volunteering|references|declaration|contact)/i)) {
        finalizeExp();
        finalizeProj();
        currentSection = 'other';
        continue;
      }

      // Process section contents
      if (currentSection === 'summary') {
        if (!summary && line.length > 30 && !line.includes('@')) {
          summary = line;
        } else if (summary && summary.length < 300 && line.length > 20 && !line.includes('@')) {
          summary += ' ' + line;
        }
      } else if (currentSection === 'skills') {
        // Only parse concise skill lines, not full prose sentences
        if (line.length < 85 && !line.endsWith('.')) {
          const cleaned = line.replace(/^[•*\->\d.)]\s*/, '').replace(/^[A-Za-z\s]+:\s*/, '');
          const tokens = cleaned.split(/[,|•/]/).map((t) => t.trim()).filter((t) => t.length > 1 && t.length < 30);
          for (const token of tokens) {
            if (token.split(/\s+/).length <= 3 && !token.match(/^(etc|and|or|including|proficient|basic|advanced|good|strong|knowledge|experience)$/i)) {
              explicitSkills.push(token);
            }
          }
        }
      } else if (currentSection === 'experience') {
        // Detect dates (e.g. "2021 - Present", "Jan 2020 - Dec 2022", "05/2019 - 08/2021")
        const dateMatch = line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(?:-|–|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|Present|Current)\b/i);

        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('–');

        if (dateMatch || (!isBullet && line.length < 70 && (lower.includes('engineer') || lower.includes('developer') || lower.includes('manager') || lower.includes('lead') || lower.includes('architect') || lower.includes('consultant') || lower.includes('analyst') || lower.includes('specialist') || line.includes(' at ') || line.includes(' | ')))) {
          finalizeExp();
          
          let title = line;
          let company = '';
          let startDate = dateMatch ? dateMatch[1] : undefined;
          let endDate = dateMatch ? dateMatch[2] : undefined;

          if (line.includes(' at ')) {
            const parts = line.split(' at ');
            title = parts[0].trim();
            company = parts[1].replace(dateMatch ? dateMatch[0] : '', '').trim();
          } else if (line.includes(' | ')) {
            const parts = line.split(' | ');
            title = parts[0].trim();
            company = parts[1].replace(dateMatch ? dateMatch[0] : '', '').trim();
          } else if (dateMatch) {
            title = line.replace(dateMatch[0], '').replace(/[-–|,]/g, ' ').trim();
          }

          currentExp = {
            title: title || 'Role',
            company: company || (lines[i + 1] && !lines[i + 1].startsWith('•') && lines[i + 1].length < 60 ? lines[i + 1] : 'Company'),
            startDate,
            endDate,
            highlights: []
          };
        } else if (currentExp) {
          const highlightText = line.replace(/^[•*\->–]\s*/, '').trim();
          if (highlightText.length > 5) {
            currentExp.highlights = currentExp.highlights || [];
            currentExp.highlights.push(highlightText);
          }
        }
      } else if (currentSection === 'projects') {
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('–');
        
        if (!isBullet && line.length < 80 && !line.toLowerCase().includes('responsibilities:')) {
          finalizeProj();
          const nameClean = line.split(/[:|–-]/)[0].trim();
          currentProj = {
            name: nameClean || line,
            description: '',
            technologies: []
          };
        } else if (currentProj) {
          const descLine = line.replace(/^[•*\->–]\s*/, '').trim();
          if (descLine.toLowerCase().startsWith('technologies:') || descLine.toLowerCase().startsWith('tools:')) {
            const techStr = descLine.replace(/^(technologies|tools):\s*/i, '');
            currentProj.technologies = techStr.split(/[,|/]/).map((t) => t.trim()).filter(Boolean);
          } else {
            if (currentProj.description) {
              currentProj.description += ' ' + descLine;
            } else {
              currentProj.description = descLine;
            }
          }
        }
      } else if (currentSection === 'education') {
        if (line.match(/(bachelor|master|phd|b\.s|m\.s|b\.e|b\.tech|m\.tech|degree|diploma|associate|university|college|institute|school)/i)) {
          const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
          const nextLine = lines[i + 1] || '';
          const hasInstInNext = nextLine.match(/(university|college|institute|school|polytechnic)/i);

          education.push({
            degree: line.replace(/\b(19\d{2}|20\d{2})\b/g, '').replace(/[-–|,]/g, ' ').trim() || line,
            institution: hasInstInNext ? nextLine : (line.includes(' from ') ? line.split(' from ')[1].trim() : 'Academic Institution'),
            graduationYear: yearMatch ? yearMatch[0] : undefined
          });
        }
      } else if (currentSection === 'certifications') {
        if (line.length > 4 && line.length < 120 && !line.toLowerCase().startsWith('certifications')) {
          const certClean = line.replace(/^[•*\->–\d.)]\s*/, '').trim();
          if (certClean.length > 3) {
            certifications.push(certClean);
          }
        }
      }
    }

    finalizeExp();
    finalizeProj();

    return { experience, education, projects, certifications, summary, explicitSkills };
  }

  private calculateExperienceYearsFromEntries(experience: CandidateExperienceItem[]): number {
    let totalMonths = 0;
    const currentYear = new Date().getFullYear();

    for (const exp of experience) {
      if (exp.startDate && exp.endDate) {
        const startY = parseInt((exp.startDate.match(/\b(19\d{2}|20\d{2})\b/) || [])[0] || '0', 10);
        const endY = exp.endDate.match(/present|current/i)
          ? currentYear
          : parseInt((exp.endDate.match(/\b(19\d{2}|20\d{2})\b/) || [])[0] || '0', 10);

        if (startY > 1970 && endY >= startY) {
          totalMonths += (endY - startY + 1) * 12;
        }
      }
    }

    return totalMonths > 0 ? Math.round(totalMonths / 12) : 1;
  }
}

export const documentParser = new DocumentParser();


