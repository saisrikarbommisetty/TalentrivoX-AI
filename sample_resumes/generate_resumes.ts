import fs from 'fs';
import path from 'path';

export function createMinimalPdf(filename: string, content: string): void {
  const dir = path.resolve(process.cwd(), 'sample_resumes');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Simple valid PDF structure
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${content.length + 100} >>
stream
BT
/F1 12 Tf
72 712 Td
(${content.replace(/[\(\)\\]/g, '\\$&').replace(/\n/g, ') Tj T* (')} ) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000224 00000 n 
0000000375 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
460
%%EOF`;

  fs.writeFileSync(path.join(dir, filename), pdfString, 'utf-8');
}

const sample1 = `Sarah Chen
Email: sarah.chen@techmail.io | Phone: (415) 555-0192 | San Francisco, CA

SUMMARY
Principal Full-Stack Engineer with 7+ years of experience architecting high-scale web platforms using TypeScript, React, and Node.js. Passionate about database optimization and engineering mentorship.

TECHNICAL SKILLS
Languages & Frameworks: TypeScript, JavaScript, React, Next.js, Node.js, Express, Fastify, GraphQL, Tailwind CSS
Databases & Cloud: PostgreSQL, Redis, Docker, Kubernetes, AWS (ECS, Lambda, S3, RDS), CI/CD, GitHub Actions
Practices: System Design, Microservices, Relational Data Modeling, Unit Testing, Agile Leadership

EXPERIENCE
Staff Engineer - CloudScale Inc (2021 - Present)
- Architected enterprise React and TypeScript dashboards serving 200k daily active users.
- Designed PostgreSQL database schemas, indexing strategies, and automated migrations that reduced p99 latency by 45%.
- Led cross-functional team of 6 engineers, conducted code reviews, and established engineering onboarding playbooks.

Senior Backend Engineer - Apex Data Labs (2018 - 2021)
- Built high-throughput Node.js microservices handling 15,000 requests per second.
- Containerized development workflows using Docker and configured automated CI/CD deployment pipelines.

EDUCATION
B.S. in Computer Science - University of California, Berkeley (2018)`;

const sample2 = `David Miller
Email: david.miller@webdev.net | Phone: (512) 555-0144 | Austin, TX

SUMMARY
Frontend Specialist with 4 years of experience crafting interactive user interfaces with React and TypeScript.

TECHNICAL SKILLS
Frontend: React, TypeScript, Redux, Zustand, HTML5, CSS3, Tailwind CSS, Jest, Webpack, Vite
Backend & Tools: Basic Node.js, Git, REST APIs, Figma, Agile

EXPERIENCE
Frontend Developer - Horizon Media (2020 - Present)
- Developed responsive client-facing web applications using React and TypeScript.
- Implemented state management with Redux and integrated third-party REST APIs.
- Built reusable component libraries with Tailwind CSS and achieved 95% test coverage using Jest.

Junior Web Developer - Pixel Dynamics (2019 - 2020)
- Maintained marketing websites and built landing pages using HTML, CSS, and JavaScript.

EDUCATION
B.A. in Digital Arts & Design - University of Texas at Austin (2019)`;

const sample3 = `Elena Rostova
Email: elena.rostova@engineer.org | Phone: (206) 555-0188 | Seattle, WA

SUMMARY
Junior Software Developer with foundational knowledge in JavaScript and Python. Eager to contribute to web projects.

TECHNICAL SKILLS
Languages: JavaScript, Python, HTML5, CSS3
Tools: Git, GitHub, VS Code, Linux

PROJECTS
Task Manager App: Built a personal task organizer using vanilla JavaScript and LocalStorage.
Portfolio Website: Designed and deployed a responsive personal portfolio on GitHub Pages.

EDUCATION
B.S. in Information Systems - University of Washington (2023)`;

createMinimalPdf('Sarah_Chen_Senior_FullStack.pdf', sample1);
createMinimalPdf('David_Miller_Frontend_Engineer.pdf', sample2);
createMinimalPdf('Elena_Rostova_Junior_Developer.pdf', sample3);
console.log('Sample PDF resumes generated in sample_resumes/ directory.');
