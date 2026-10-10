import { PlatformFallbackLink, JobDiscoveryQuery } from '@avengercoders/shared';

export class PlatformSearchLinkGenerator {
  /**
   * Generates legitimate, cleanly-encoded direct platform search shortcuts
   * for major job boards based on candidate's target title, skills, and location.
   */
  public static generatePlatformLinks(query: JobDiscoveryQuery): PlatformFallbackLink[] {
    const rawRole = query.role || query.query || 'Software Engineer';
    const rawLocation = query.location || (query.workplaceType === 'remote' ? 'Remote' : '');
    
    const cleanRole = encodeURIComponent(rawRole.trim());
    const cleanLocation = encodeURIComponent(rawLocation.trim());
    const slugRole = rawRole.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'software-engineer';
    const slugLocation = rawLocation.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'india';

    const links: PlatformFallbackLink[] = [
      {
        platform: 'naukri',
        label: 'Search on Naukri.com',
        searchUrl: `https://www.naukri.com/${slugRole}-jobs${slugLocation ? `-in-${slugLocation}` : ''}?k=${cleanRole}${cleanLocation ? `&l=${cleanLocation}` : ''}`,
        icon: 'briefcase',
        badgeText: 'India & Tech Hubs',
        description: `Direct search on Naukri for "${rawRole}" ${rawLocation ? `in ${rawLocation}` : ''}`
      },
      {
        platform: 'indeed',
        label: 'Search on Indeed',
        searchUrl: `https://www.indeed.com/jobs?q=${cleanRole}&l=${cleanLocation || 'Remote'}`,
        icon: 'globe',
        badgeText: 'Global & Remote',
        description: `Direct search on Indeed for "${rawRole}"`
      },
      {
        platform: 'linkedin',
        label: 'Search on LinkedIn Jobs',
        searchUrl: `https://www.linkedin.com/jobs/search/?keywords=${cleanRole}${cleanLocation ? `&location=${cleanLocation}` : ''}`,
        icon: 'layers',
        badgeText: 'Professional Network',
        description: `Explore live postings on LinkedIn for "${rawRole}"`
      },
      {
        platform: 'foundit',
        label: 'Search on Foundit (Monster)',
        searchUrl: `https://www.foundit.in/srp/results?query=${cleanRole}${cleanLocation ? `&locations=${cleanLocation}` : ''}`,
        icon: 'search',
        badgeText: 'APAC & Tech',
        description: `Direct search on Foundit for "${rawRole}"`
      },
      {
        platform: 'google_jobs',
        label: 'Search with Google Jobs',
        searchUrl: `https://www.google.com/search?q=${cleanRole}+jobs+${cleanLocation || 'remote'}&ibp=htl;jobs`,
        icon: 'sparkles',
        badgeText: 'Google Aggregator',
        description: `Live Google Jobs index for "${rawRole}"`
      }
    ];

    return links;
  }
}
