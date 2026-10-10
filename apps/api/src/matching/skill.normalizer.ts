export class SkillNormalizer {
  private static aliases: Record<string, string> = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'react': 'React',
    'reactjs': 'React',
    'react.js': 'React',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'next': 'Next.js',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'psql': 'PostgreSQL',
    'mongo': 'MongoDB',
    'mongodb': 'MongoDB',
    'k8s': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'docker': 'Docker',
    'aws': 'Amazon Web Services (AWS)',
    'amazon web services': 'Amazon Web Services (AWS)',
    'gcp': 'Google Cloud Platform (GCP)',
    'google cloud': 'Google Cloud Platform (GCP)',
    'azure': 'Microsoft Azure',
    'graphql': 'GraphQL',
    'rest': 'RESTful APIs',
    'rest api': 'RESTful APIs',
    'restful': 'RESTful APIs',
    'ci/cd': 'CI/CD Pipelines',
    'cicd': 'CI/CD Pipelines',
    'github actions': 'GitHub Actions',
    'tailwind': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    'redux': 'Redux',
    'python': 'Python',
    'py': 'Python',
    'golang': 'Go',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'c++': 'C++',
    'c#': 'C#',
    '.net': '.NET',
    'sql': 'SQL'
  };

  private static stopWords = new Set([
    'and', 'the', 'for', 'with', 'years', 'experience', 'strong', 'ability', 'must', 'have',
    'such', 'are', 'seeking', 'seasoned', 'senior', 'junior', 'lead', 'looking', 'role', 'team',
    'work', 'working', 'build', 'building', 'join', 'opportunity', 'skills', 'plus', 'including',
    'proficient', 'knowledge', 'responsibilities', 'qualifications', 'requirements', 'engineering',
    'software', 'developer', 'engineer', 'will', 'you', 'our', 'what', 'about', 'from', 'that'
  ]);

  /**
   * Normalizes a raw skill string or object to canonical form.
   */
  public static normalize(rawSkill: any): string {
    if (rawSkill === null || rawSkill === undefined) return '';
    if (typeof rawSkill === 'object') {
      rawSkill = rawSkill.name || rawSkill.skill || rawSkill.label || '';
    }
    const str = String(rawSkill).trim();
    if (!str || str === '[object Object]') return '';
    const cleaned = str.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(this.aliases, cleaned) && typeof this.aliases[cleaned] === 'string') {
      return this.aliases[cleaned];
    }
    return str;
  }

  /**
   * Extracts keywords and token sets from a requirement sentence.
   */
  public static extractRequirementKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    const matches: string[] = [];

    // Check for direct known skill aliases first
    for (const [alias, canonical] of Object.entries(this.aliases)) {
      const regex = new RegExp(`\\b${alias.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        matches.push(canonical);
      }
    }

    const words = lower
      .replace(/[^a-z0-9+#./\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !this.stopWords.has(w));

    return Array.from(new Set([...matches, ...words, ...words.map(w => this.normalize(w))]));
  }
}

