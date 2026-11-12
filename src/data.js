export const profile = {
  firstName: 'Nina',
  lastName: 'Vardosanidze',
  role: 'Software Engineer',
  location: 'Tbilisi, Georgia',
  email: 'ninavardosanidze06@gmail.com',
  github: 'https://github.com/ninavardo',
  linkedin: 'https://www.linkedin.com/in/nina-vardosanidze-57b500338',
  intro:
    'I build the logic behind products and the interfaces on top of them: REST APIs and data models in Node.js and TypeScript, and responsive UIs in React.',
  about: [
    "I'm a software engineer from Tbilisi. At Tourlify I design and build the backend services behind hotels, restaurants and tours: endpoints, data models, analytics payloads and the occasional tricky query.",
    'On the side I build interfaces in React and Tailwind, because I like seeing the data I shape turn into something people can click. I study Informatics at GAU, spent a semester in Coimbra on Erasmus+, and lean on AI tools like Cursor and Claude every day to move faster.',
  ],
  facts: [
    { label: 'Based in', value: 'Tbilisi, Georgia' },
    { label: 'Currently', value: 'Backend Developer @ Tourlify' },
    { label: 'Studying', value: 'Informatics @ GAU' },
    { label: 'Speaks', value: 'Georgian · Russian · English' },
  ],
}

export const sections = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'journey', label: 'Journey' },
  { id: 'projects', label: 'Projects' },
  { id: 'documents', label: 'CV' },
  { id: 'contact', label: 'Contact' },
]

export const stack = {
  languages: ['TypeScript', 'JavaScript', 'SQL', 'HTML/CSS', 'C++ (basic)'],
  backend: ['Node.js', 'Express', 'REST APIs', 'PostgreSQL', 'MongoDB'],
  frontend: ['React', 'Tailwind CSS', 'React Router', 'Vite'],
  cloud: ['Microsoft Azure', 'Power Apps', 'Power Automate', 'AI Builder', 'SharePoint'],
}

export const tools = ['git', 'github', 'cursor', 'claude', 'gemini', 'clickup', 'agile-scrum', 'code-reviews']

export const journey = [
  {
    period: 'Nov 2024 — Present',
    title: 'Backend Developer',
    place: 'Tourlify · Remote',
    points: [
      'Built core services in Node.js and TypeScript for hotels, restaurants, tours and tasks.',
      'Aggregated multi-table data into lean JSON payloads for the analytics dashboards.',
      'Built user profiles, notification settings and photo-upload metadata handling.',
      'Designed schemas and optimized queries across PostgreSQL and MongoDB, and took part in code reviews.',
    ],
  },
  {
    period: 'May 2026 — Oct 2026',
    title: 'Front-End Development',
    place: 'GEOLAB · Tbilisi',
    points: ['Hands-on training in HTML, CSS, JavaScript and React, building responsive interfaces.'],
  },
  {
    period: 'Sep 2025 — Jan 2026',
    title: 'Erasmus+ Exchange',
    place: 'ISEC · Coimbra, Portugal',
    points: ['A semester of engineering studies abroad at Instituto Superior de Engenharia de Coimbra.'],
  },
  {
    period: 'Sep 2024 — Present',
    title: 'Bachelor of Informatics',
    place: 'Georgian American University',
    points: ['Coursework includes enterprise cloud technologies, where I built an AI-powered employee evaluation system with Power Apps and Azure AI Builder.'],
  },
]

export const projects = [
  {
    name: 'watchout',
    tagline: 'Movie & series finder',
    description:
      'Pick something to watch by mood, by how much time you have, or let the roulette decide. Trailers, cast, where to stream, and a personal watchlist.',
    image: '/projects/watchout.png',
    live: 'https://whatchout-ten.vercel.app',
    code: 'https://github.com/ninavardo/whatchout',
    tags: ['React', 'Tailwind', 'TMDB API', 'Vitest'],
    category: 'Apps',
    file: 'watchout.app',
  },
  {
    name: 'Paper Trail',
    tagline: 'A daily ledger of sourced facts',
    description:
      'Guess whether a historical money fact is true, set your confidence, and track your calibration over time. Includes an archive, RSS feed and daily email.',
    image: '/projects/papertrail.png',
    live: 'https://paper-trail-flame.vercel.app',
    code: 'https://github.com/ninavardo/PaperTrail',
    tags: ['Next.js', 'TypeScript', 'Drizzle ORM', 'Zod'],
    category: 'Apps',
    file: 'paper-trail.app',
  },
  {
    name: 'OmniCommerce AI',
    tagline: 'Storefront + merchant dashboard',
    description:
      'A shop and a back office sharing one catalog: cart, coupons, checkout, inventory alerts, revenue metrics and an AI shopping concierge.',
    image: '/projects/omnicommerce.png',
    live: 'https://omnicommerce-ai-seven.vercel.app',
    code: 'https://github.com/ninavardo/omnicommerce-ai',
    tags: ['React', 'AI integration', 'Analytics'],
    category: 'Apps',
    file: 'omnicommerce.app',
  },
  {
    name: 'Olea',
    tagline: 'Beauty studio website, Tbilisi',
    description:
      'A calm, bilingual website for a real beauty studio with treatments, a gallery with lightbox, booking flow and dark mode.',
    image: '/projects/olea.png',
    live: 'https://olea-delta.vercel.app',
    code: 'https://github.com/ninavardo/olea',
    tags: ['React', 'TypeScript', 'EN / KA'],
    category: 'Websites',
    file: 'olea.site',
  },
  {
    name: 'Sport Cars',
    tagline: 'Where it all started',
    description: 'One of my first websites: a responsive, sports-car themed landing page made with plain HTML and CSS.',
    image: '/projects/cars.png',
    live: 'https://ninavardo.github.io/project-cars/',
    code: 'https://github.com/ninavardo/project-cars',
    tags: ['HTML', 'CSS'],
    category: 'Websites',
    file: 'sport-cars.html',
  },
]

export const documents = [
  {
    kind: 'CV',
    file: 'Nina_Vardosanidze_CV.pdf',
    title: 'Curriculum Vitae',
    issuer: 'Nina Vardosanidze',
    date: '2026',
    image: '/docs/cv-preview.jpg',
    pdf: '/docs/Nina_Vardosanidze_CV.pdf',
    portrait: true,
  },
  {
    kind: 'Certificates',
    file: 'alison-sqlite-nodejs.jpg',
    title: 'Creating a Local SQLite Database with Node.js',
    issuer: 'Alison · CPD certified',
    date: '12 Nov 2026',
    image: '/docs/alison-sqlite-nodejs-certificate.jpg',
  },
  {
    kind: 'Certificates',
    file: 'geolab-frontend-html-css.jpg',
    title: 'Front-End Web Development, stage 1: HTML & CSS',
    issuer: 'GeoLab · Tbilisi',
    date: '2026',
    image: '/docs/geolab-frontend-certificate.jpg',
  },
]

/** Public Microsoft Learn transcript (Profile → Transcript → Share link). Leave empty to hide the link. */
export const learnTranscript = ''

export const learnModules = [
  { title: 'Get started with generative AI and agents in Azure', passed: true },
  { title: 'Analyze and tune query and operation performance in Azure Cosmos DB' },
  { title: 'Get ready to work with Microsoft Copilot' },
]
