export type CmsContent = {
  site: {
    nameBn: string
    nameEn: string
    tagline: string
    logo: string
    city: string
    phone: string
    phoneHref: string
    whatsapp: string
    messenger: string
    email: string
    facebook: string
    youtube: string
    addressBn: string
  }
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCta: string
    secondaryCta: string
  }
  whyCornia: Array<{ title: string; description: string }>
  counters: Array<{ value: string; label: string }>
  faqs: Array<{ question: string; answer: string }>
  teachers: Array<{
    name: string
    subject: string
    qualification: string
    experience: string
    image: string
  }>
  gallery: Array<{ image: string; caption: string }>
  successStories: Array<{
    name: string
    college: string
    rank: string
    image: string
    quote: string
  }>
}

export type CmsContentInput = {
  site?: Partial<CmsContent['site']>
  hero?: Partial<CmsContent['hero']>
  whyCornia?: CmsContent['whyCornia']
  counters?: CmsContent['counters']
  faqs?: CmsContent['faqs']
  teachers?: CmsContent['teachers']
  gallery?: CmsContent['gallery']
  successStories?: CmsContent['successStories']
}

export const defaultCmsContent: CmsContent = {
  site: {
    nameBn: process.env.NEXT_PUBLIC_SITE_NAME_BN || 'ISC Expo - Icon Skill & Career Expo',
    nameEn: process.env.NEXT_PUBLIC_SITE_NAME || 'ISC Expo - Icon Skill & Career Expo',
    tagline: 'সাফল্যের জন্য প্রস্তুতি',
    logo: '/logo.svg',
    city: 'খুলনা',
    phone: '01784-176442',
    phoneHref: 'tel:+8801784176442',
    whatsapp: 'https://wa.me/8801784176442',
    messenger: 'https://m.me/isclms',
    email: process.env.NEXT_PUBLIC_SITE_EMAIL || 'info@iscexpo.edu.bd',
    facebook: 'https://www.facebook.com/CorniaNursingKhulna',
    youtube: 'https://youtube.com/@isclms',
    addressBn: 'কলাবাগান মোড়, খুলনা মেডিকেল কলেজ হাসপাতালের সামনে, খুলনা।',
  },
  hero: {
    eyebrow: 'BNMC ভর্তি পরীক্ষার সম্পূর্ণ প্রস্তুতি',
    title: 'খুলনার অন্যতম বিশ্বস্ত নার্সিং ভর্তি কোচিং',
    subtitle:
      'অভিজ্ঞ শিক্ষক, আপডেটেড নোট ও নিয়মিত মডেল টেস্টের মাধ্যমে আপনার নার্সিং ক্যারিয়ারের নিশ্চিত প্রস্তুতি।',
    primaryCta: 'ভর্তি হোন',
    secondaryCta: 'ফ্রি ক্লাস',
  },
  whyCornia: [
    {
      title: 'অভিজ্ঞ শিক্ষকমণ্ডলী',
      description: 'দীর্ঘদিনের অভিজ্ঞ ও দক্ষ শিক্ষকদের সরাসরি তত্ত্বাবধান।',
    },
    {
      title: 'আপডেটেড নোট',
      description: 'সর্বশেষ সিলেবাস অনুযায়ী হালনাগাদ লেকচার শীট ও নোট।',
    },
    {
      title: 'সাপ্তাহিক পরীক্ষা',
      description: 'প্রতি সপ্তাহে মডেল টেস্ট ও পারফরম্যান্স বিশ্লেষণ।',
    },
    {
      title: 'ব্যক্তিগত যত্ন',
      description: 'প্রতিটি শিক্ষার্থীর জন্য আলাদা কেয়ার ও ফলোআপ।',
    },
  ],
  counters: [
    { value: '৫০০০+', label: 'শিক্ষার্থী' },
    { value: '৯৫%', label: 'সাফল্যের হার' },
    { value: '১৫০+', label: 'মডেল টেস্ট' },
    { value: '৩০০+', label: 'লেকচার শীট' },
  ],
  faqs: [
    {
      question: 'ভর্তি কিভাবে করবো?',
      answer:
        'আপনি সরাসরি আমাদের অফিসে এসে অথবা ওয়েবসাইটের ভর্তি পেজ থেকে অনলাইনে ফরম পূরণ করে ভর্তি হতে পারবেন।',
    },
    {
      question: 'ক্লাস কখন হয়?',
      answer:
        'সকাল ও বিকাল — দুটি ব্যাচে ক্লাস পরিচালিত হয়। এছাড়া অনলাইন ব্যাচের জন্য আলাদা সময়সূচি রয়েছে।',
    },
  ],
  teachers: [
    {
      name: 'ডা. তাসনিম আরা',
      subject: 'অ্যানাটমি ও ফিজিওলজি',
      qualification: 'MBBS, BCS (স্বাস্থ্য)',
      experience: '৮ বছরের অভিজ্ঞতা',
      image: '/images/teacher-1.png',
    },
    {
      name: 'মোঃ সাইফুল ইসলাম',
      subject: 'ইংরেজি',
      qualification: 'MA in English',
      experience: '১০ বছরের অভিজ্ঞতা',
      image: '/images/teacher-2.png',
    },
    {
      name: 'রেহানা পারভীন',
      subject: 'নার্সিং ফাউন্ডেশন',
      qualification: 'B.Sc in Nursing',
      experience: '৭ বছরের অভিজ্ঞতা',
      image: '/images/teacher-3.png',
    },
    {
      name: 'আব্দুল্লাহ আল মামুন',
      subject: 'বিজ্ঞান ও সাধারণ জ্ঞান',
      qualification: 'M.Sc in Zoology',
      experience: '৯ বছরের অভিজ্ঞতা',
      image: '/images/teacher-4.png',
    },
  ],
  gallery: [
    { image: '/images/gallery-1.png', caption: 'সেমিনার' },
    { image: '/images/gallery-2.png', caption: 'পুরস্কার বিতরণী' },
    { image: '/images/gallery-3.png', caption: 'ব্যাচ ফটো' },
    { image: '/images/gallery-4.png', caption: 'ফ্রি ক্লাস' },
  ],
  successStories: [
    {
      name: 'সাদিয়া আফরিন',
      college: 'ঢাকা নার্সিং কলেজ',
      rank: 'মেধা তালিকায় ১২তম',
      image: '/images/student-1.png',
      quote:
        'ISC Expo-এর নিয়মিত মডেল টেস্ট আর শিক্ষকদের গাইডলাইন ছাড়া আমার এই ফলাফল সম্ভব হতো না।',
    },
    {
      name: 'রাকিব হাসান',
      college: 'রাজশাহী নার্সিং কলেজ',
      rank: 'মেধা তালিকায় ৪৫তম',
      image: '/images/student-2.png',
      quote:
        'প্রতিটি বিষয়ের বেসিক থেকে শুরু করে অ্যাডভান্স — সব কিছু খুব সহজভাবে বুঝিয়েছেন।',
    },
    {
      name: 'নুসরাত জাহান',
      college: 'খুলনা নার্সিং কলেজ',
      rank: 'মেধা তালিকায় ৮তম',
      image: '/images/student-3.png',
      quote:
        'ব্যক্তিগত যত্ন আর MCQ ব্যাংক প্র্যাকটিস আমাকে আত্মবিশ্বাসী করে তুলেছিল।',
    },
  ],
}

export function mergeCmsContent(input: CmsContentInput = {}): CmsContent {
  return {
    site: { ...defaultCmsContent.site, ...input.site },
    hero: { ...defaultCmsContent.hero, ...input.hero },
    whyCornia: input.whyCornia?.length
      ? input.whyCornia
      : defaultCmsContent.whyCornia,
    counters: input.counters?.length
      ? input.counters
      : defaultCmsContent.counters,
    faqs: input.faqs?.length ? input.faqs : defaultCmsContent.faqs,
    teachers: input.teachers?.length
      ? input.teachers
      : defaultCmsContent.teachers,
    gallery: input.gallery?.length ? input.gallery : defaultCmsContent.gallery,
    successStories: input.successStories?.length
      ? input.successStories
      : defaultCmsContent.successStories,
  }
}
