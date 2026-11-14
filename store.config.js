// App Store listing, pushed with `eas metadata:push` (EAS Metadata).
//
// English (en-US) is the primary language. Arabic (ar-SA) is the second
// one. Screenshots are not part of EAS Metadata. See docs/release.md for
// how they are uploaded.
//
// The review contact and the demo account are read from the environment,
// so no phone number or password is committed:
//   APP_REVIEW_FIRST_NAME, APP_REVIEW_LAST_NAME, APP_REVIEW_CONTACT_EMAIL,
//   APP_REVIEW_PHONE (with + and country code), APP_REVIEW_EMAIL and
//   APP_REVIEW_PASSWORD (an Auth0 account on the tenant of the build).
//
// The copy describes only what the app does today. Payments are off
// (EXPO_PUBLIC_PAYMENTS_ENABLED=false), so the listing does not promise
// booking or payment. UniFind approves the wording before each push.

// Interim URLs: the Terms page holds the privacy policy (section 2) and the
// contact address. Replace both with dedicated pages before public review.
const TERMS_URL = 'https://unifind.online/en/terms-conditions';
const PRIVACY_URL = 'https://unifind.online/en/terms-conditions';
const SUPPORT_URL = 'https://unifind.online/en/terms-conditions';
const MARKETING_URL = 'https://unifind.online';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. See the header of store.config.js for the list.`,
    );
  }
  return value;
}

const enDescription = `Find the right university and major in Lebanon, in one free app.

UniFind brings the programs and institutions of Lebanon into one place. Search, filter and compare them, then save the ones you like. The Growth Center connects you with specialists for mentoring, tutoring and career advice.

Program Explorer
• Search university programs by name
• Filter by degree level, field of study, location and tuition
• See the duration, credits, language, campus and tuition of each program
• Find similar programs at other institutions

Institutions
• Browse universities and colleges across Lebanon
• Read the overview, the main campus, the tuition ranges and the academic units
• Read and write reviews

Compare and save
• Compare up to 5 programs or institutions side by side
• Save favorites to your profile

Growth Center
• Browse offerings from specialists: mentoring, tutoring, exam preparation and advice
• See the session modes, the specialists, the prices and the available times

Your profile
• Add your education, experience, skills and languages
• Keep your favorites, comparisons and reviews in one place

Fully in English and Arabic.

Questions: info@unifind.online
Terms and privacy: ${TERMS_URL}`;

const arDescription = `اعثر على الجامعة والاختصاص المناسبين في لبنان، في تطبيق واحد مجاني.

يجمع UniFind برامج ومؤسسات التعليم العالي في لبنان في مكان واحد. ابحث عنها، صفّها وقارن بينها، ثم احفظ ما يعجبك. ويصلك مركز النمو باختصاصيين للإرشاد والدروس والنصائح المهنية.

مستكشف البرامج
• ابحث عن البرامج الجامعية بالاسم
• صفِّ حسب مستوى الشهادة ومجال الدراسة والموقع والأقساط
• اطّلع على مدة كل برنامج وأرصدته ولغته وحرمه وأقساطه
• اعثر على برامج مشابهة في مؤسسات أخرى

المؤسسات التعليمية
• تصفّح الجامعات والكليات في كل لبنان
• اقرأ النبذة والحرم الرئيسي ونطاق الأقساط والكليات
• اقرأ التقييمات واكتب تقييمك

قارن واحفظ
• قارن حتى 5 برامج أو مؤسسات جنبًا إلى جنب
• احفظ المفضلة في ملفك الشخصي

مركز النمو
• تصفّح خدمات الاختصاصيين: إرشاد، دروس خصوصية، تحضير للامتحانات ونصائح
• اطّلع على طرق الجلسات والاختصاصيين والأسعار والأوقات المتاحة

ملفك الشخصي
• أضف تعليمك وخبراتك ومهاراتك ولغاتك
• احتفظ بالمفضلة والمقارنات والتقييمات في مكان واحد

بالعربية والإنكليزية بالكامل.

للأسئلة: info@unifind.online
الشروط والخصوصية: ${TERMS_URL}`;

const reviewNotes = () => `UniFind helps students in Lebanon find and compare university programs, institutions and mentoring offerings.

No sign-in is needed to browse. Open Home, Program Explorer or Growth Center, then open any program, institution or offering.

Signed-in features: favorites, Compare, reviews and Profile. Tap the profile icon, then Sign In, and use the demo account in the sign-in fields of this form.

Payments are off in this version. On an offering, the app shows the specialists, dates and times, and a notice replaces the Book and Pay buttons. No purchase is possible in the app.

Language: tap AR or EN in the header of Home to switch between English and Arabic.`;

module.exports = () => ({
  configVersion: 0,
  apple: {
    copyright: '2026 UniFind.Online',
    categories: ['EDUCATION', 'REFERENCE'],
    // No violence, gambling or mature themes. User reviews of institutions
    // and offerings are answered in the age rating questions of App Store
    // Connect, which EAS Metadata does not cover.
    advisory: {
      alcoholTobaccoOrDrugUseOrReferences: 'NONE',
      contests: 'NONE',
      gambling: false,
      gamblingSimulated: 'NONE',
      horrorOrFearThemes: 'NONE',
      matureOrSuggestiveThemes: 'NONE',
      medicalOrTreatmentInformation: 'NONE',
      profanityOrCrudeHumor: 'NONE',
      sexualContentGraphicAndNudity: 'NONE',
      sexualContentOrNudity: 'NONE',
      unrestrictedWebAccess: false,
      violenceCartoonOrFantasy: 'NONE',
      violenceRealistic: 'NONE',
      violenceRealisticProlongedGraphicOrSadistic: 'NONE',
      kidsAgeBand: null,
      ageRatingOverride: 'NONE',
      koreaAgeRatingOverride: 'NONE',
    },
    info: {
      'en-US': {
        title: 'UniFind: Universities & Majors',
        subtitle: 'Find your major in Lebanon',
        description: enDescription,
        keywords: [
          'university',
          'major',
          'college',
          'degree',
          'Lebanon',
          'tuition',
          'compare',
          'mentoring',
          'tutoring',
          'student',
        ],
        promoText:
          'Search programs and universities in Lebanon, compare up to 5 side by side, and find a mentor.',
        supportUrl: SUPPORT_URL,
        marketingUrl: MARKETING_URL,
        privacyPolicyUrl: PRIVACY_URL,
      },
      'ar-SA': {
        title: 'UniFind - جامعات واختصاصات',
        subtitle: 'اختر اختصاصك في لبنان',
        description: arDescription,
        keywords: [
          'جامعة',
          'جامعات',
          'اختصاص',
          'لبنان',
          'شهادة',
          'أقساط',
          'مقارنة',
          'طلاب',
          'إرشاد',
          'دروس',
          'تعليم',
        ],
        promoText:
          'ابحث عن البرامج والجامعات في لبنان، قارن حتى 5 جنبًا إلى جنب، واعثر على مرشد.',
        supportUrl: SUPPORT_URL,
        marketingUrl: MARKETING_URL,
        privacyPolicyUrl: PRIVACY_URL,
      },
    },
    // Released by hand after approval.
    release: {
      automaticRelease: false,
      phasedRelease: false,
    },
    review: {
      firstName: required('APP_REVIEW_FIRST_NAME'),
      lastName: required('APP_REVIEW_LAST_NAME'),
      email: required('APP_REVIEW_CONTACT_EMAIL'),
      phone: required('APP_REVIEW_PHONE'),
      demoUsername: required('APP_REVIEW_EMAIL'),
      demoPassword: required('APP_REVIEW_PASSWORD'),
      demoRequired: false,
      notes: reviewNotes(),
    },
  },
});
