export interface SiteContent {
  practice: {
    name: string
    tagline: string
    phone: string
    email: string
    address: string
    city: string
  }
  hero: {
    headline: string
    subtext: string
    cta: string
  }
  services: Array<{
    title: string
    description: string
  }>
  about: {
    doctorName: string
    title: string
    bio: string
    yearsExperience: number
    education: string
  }
  testimonials: Array<{
    name: string
    text: string
    rating: number
  }>
  hours: Record<string, string>
  blog: Array<{
    title: string
    excerpt: string
    date: string
    slug: string
  }>
  style: {
    primaryColor: string
    accentColor: string
    bgColor: string
  }
}

export interface Account {
  id: string
  email: string
  license_key: string
  plan: 'demo' | 'monthly'
  status: 'active' | 'inactive'
  actions_used: number
  actions_limit: number
  actions_reset_at: string
  created_at: string
}

export interface Version {
  id: string
  account_id: string
  content: SiteContent
  label: string
  created_at: string
}

export const DEFAULT_CONTENT: SiteContent = {
  practice: {
    name: 'Sunrise Chiropractic',
    tagline: 'Your path to a pain-free life',
    phone: '(555) 867-5309',
    email: 'hello@sunrisechiro.com',
    address: '1234 Wellness Blvd, Suite 100',
    city: 'Springfield, IL 62701',
  },
  hero: {
    headline: 'Feel Better. Move Better. Live Better.',
    subtext:
      'Expert, compassionate chiropractic care for the whole family. Accepting new patients — same-week appointments available.',
    cta: 'Book a Free Consultation',
  },
  services: [
    {
      title: 'Spinal Adjustments',
      description:
        'Precise, gentle adjustments that restore proper alignment and relieve pain at its source.',
    },
    {
      title: 'Sports Injury Care',
      description:
        'Get back in the game faster with targeted sports injury treatment and performance recovery.',
    },
    {
      title: 'Back & Neck Pain',
      description:
        'Find lasting relief from chronic back and neck pain through targeted, evidence-based care.',
    },
    {
      title: 'Headache Relief',
      description:
        'Many headaches stem from spinal tension and misalignment. We treat the root cause, not just the symptom.',
    },
    {
      title: 'Posture Correction',
      description:
        'Reverse the cumulative damage of desk work and screen time before it becomes a serious problem.',
    },
    {
      title: 'Pediatric Care',
      description:
        'Safe, gentle chiropractic care for children of all ages — from newborns through teenagers.',
    },
  ],
  about: {
    doctorName: 'Dr. Alex Rivera',
    title: 'Doctor of Chiropractic',
    bio: 'Dr. Rivera has spent over 15 years helping patients find natural, lasting relief from pain. With advanced training in sports medicine and a whole-body approach to wellness, Dr. Rivera takes time to truly understand each patient before treatment begins.\n\nWe believe you deserve to know exactly what is happening with your body and why — so you can make informed decisions about your own care.',
    yearsExperience: 15,
    education: 'Palmer College of Chiropractic, Magna Cum Laude',
  },
  testimonials: [
    {
      name: 'Sarah M.',
      text: 'I came in barely able to walk. After four visits I was back to my morning runs. The results were nothing short of incredible.',
      rating: 5,
    },
    {
      name: 'Tom B.',
      text: 'Dr. Rivera was the first doctor in 10 years to actually explain what was going on with my back. That alone was worth the visit.',
      rating: 5,
    },
    {
      name: 'Linda K.',
      text: 'My migraines have dropped by 80% since starting care here. I only wish I had found this place sooner.',
      rating: 5,
    },
  ],
  hours: {
    Monday: '9:00 AM – 6:00 PM',
    Tuesday: '9:00 AM – 6:00 PM',
    Wednesday: '9:00 AM – 6:00 PM',
    Thursday: '9:00 AM – 6:00 PM',
    Friday: '9:00 AM – 5:00 PM',
    Saturday: '9:00 AM – 12:00 PM',
    Sunday: 'Closed',
  },
  blog: [],
  style: {
    primaryColor: '#1A5276',
    accentColor: '#2980B9',
    bgColor: '#F0F7FF',
  },
}
