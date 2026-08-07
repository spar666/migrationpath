/**
 * Data-driven definition of the Partner Visa eligibility quiz
 * (subclasses 820, 801, 309, 100, 300).
 *
 * Labels may contain {applicant} / {sponsor} tokens that are replaced with the
 * first names collected on the first step. Fields render only when their
 * `showWhen` predicate passes; a hidden field is never validated or submitted.
 */

export type AnswerValue = string | string[];
export type Answers = Record<string, AnswerValue | undefined>;

export type FieldType =
  | "radio"
  | "checkboxes"
  | "select"
  | "text"
  | "textarea"
  | "date"
  | "email"
  /** A single required tickbox. Distinct from "checkboxes", which is multi-select. */
  | "consent";

/**
 * The collection notice, in the exact words shown on screen.
 *
 * Submitted with the answers and stored verbatim against the prospect. Keep it
 * here as a single constant rather than inline in JSX: if the wording is ever
 * changed, records created before the change must still show the text that
 * person actually agreed to, and that only works if what we display and what we
 * send can never drift apart.
 */
export const CONSENT_NOTICE =
  "I agree that MigrationPath may store the answers I have given and my " +
  "contact details, and may contact me about my partner visa enquiry. I " +
  "understand this assessment is not immigration advice and is not a decision " +
  "by the Department of Home Affairs.";

export interface FieldDef {
  id: string;
  type: FieldType;
  label: string;
  /** Muted helper line under the label. */
  hint?: string;
  /** Bullet points rendered under the label (used by the visa-issues question). */
  bullets?: string[];
  options?: string[];
  /** Defaults to true. */
  required?: boolean;
  maxLength?: number;
  /** Date fields only: the date must not be in the future (e.g. a marriage date). */
  pastOnly?: boolean;
  /** Date fields only: the date must not be in the past (e.g. a visa expiry date). */
  futureOnly?: boolean;
  showWhen?: (a: Answers) => boolean;
}

export interface StepDef {
  id: string;
  /** Short name shown in the progress line. */
  name: string;
  title?: string;
  intro?: string;
  fields: FieldDef[];
}

export const AU_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
];

export const LANGUAGES = [
  "Arabic", "Azerbaijani", "Bengali", "Bulgarian", "Burmese", "Czech",
  "Danish", "Dutch", "Filipino (Tagalog)", "Finnish", "French", "German",
  "Greek", "Gujarati", "Hindi", "Hungarian", "Italian", "Japanese",
  "Javanese", "Korean", "Latvian", "Lithuanian", "Maltese",
  "Mandarin Chinese", "Marathi", "Nepali", "Norwegian", "Persian", "Polish",
  "Portuguese", "Punjabi", "Romanian", "Russian", "Serbian", "Slovak",
  "Spanish", "Swahili", "Swedish", "Thai", "Turkish", "Ukrainian", "Urdu",
  "Vietnamese",
];

export const COUNTRIES = [
  "Australia", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua & Deps", "Argentina", "Armenia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina", "Burundi", "Cambodia",
  "Cameroon", "Canada", "Cape Verde", "Central African Rep", "Chad", "Chile",
  "China", "Colombia", "Comoros", "Congo", "Congo (Democratic Rep)",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland (Republic)", "Israel",
  "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Palau",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russian Federation", "Rwanda",
  "St Kitts & Nevis", "St Lucia", "Saint Vincent & the Grenadines", "Samoa",
  "San Marino", "Sao Tome & Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga",
  "Trinidad & Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// Option labels reused by the eligibility copy.
export const NEVER_MET = "No, we have never met in-person";

const isAU = (a: Answers) => a.applicantCountry === "Australia";
const offshore = (a: Answers) =>
  !!a.applicantCountry && a.applicantCountry !== "Australia";

/** True when the stored ISO date is more than `days` days in the future. */
function moreThanDaysAhead(dateStr: AnswerValue | undefined, days: number) {
  if (typeof dateStr !== "string" || !dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return d.getTime() > cutoff.getTime();
}

export const FORM_STEPS: StepDef[] = [
  {
    id: "names",
    name: "About you",
    title: "Let's get started",
    fields: [
      {
        id: "applicantFirstName",
        type: "text",
        label: "Applicant first name",
        hint: "The applicant is the person whose name the visa will be in",
        maxLength: 100,
      },
      {
        id: "sponsorFirstName",
        type: "text",
        label: "Sponsor first name",
        hint: "The sponsor is the partner of the applicant",
        maxLength: 100,
      },
      {
        id: "completedBy",
        type: "radio",
        label: "Who is completing the quiz?",
        hint: "If you are doing this together, select applicant",
        options: ["Applicant", "Sponsor"],
      },
    ],
  },
  {
    id: "english",
    name: "English",
    title: "It's nice to meet you {applicant} and {sponsor} 👋",
    fields: [
      {
        id: "englishNative",
        type: "radio",
        label:
          "Is English the first/native language for both {applicant} and {sponsor}?",
        options: [
          "Yes, English is the first/native language for both of us",
          "No, English is the first/native language for one of us, but a second language for the other",
          "No, English is a second language for both of us",
        ],
      },
      {
        id: "interpreterNeed",
        type: "radio",
        label: "Will either {applicant} or {sponsor} require an interpreter?",
        options: [
          "Yes, one of us has poor English",
          "Maybe, we're not sure if our English is good enough",
          "No, both of our English is good enough",
          "No, both of our English is excellent",
        ],
        showWhen: (a) =>
          a.englishNative ===
            "No, English is the first/native language for one of us, but a second language for the other" ||
          a.englishNative === "No, English is a second language for both of us",
      },
      {
        id: "interpreterLanguage",
        type: "select",
        label:
          "For the person requiring an interpreter, what is their main language?",
        options: LANGUAGES,
        showWhen: (a) =>
          a.interpreterNeed === "Yes, one of us has poor English" ||
          a.interpreterNeed ===
            "Maybe, we're not sure if our English is good enough",
      },
    ],
  },
  {
    id: "location",
    name: "Applicant",
    title: "About {applicant}",
    fields: [
      {
        id: "applicantCountry",
        type: "select",
        label: "Where does {applicant} currently live?",
        options: COUNTRIES,
      },
      {
        id: "applicantState",
        type: "select",
        label: "What Australian state/territory does {applicant} live in?",
        options: AU_STATES,
        showWhen: isAU,
      },
      {
        id: "visaExpired",
        type: "radio",
        label: "Has {applicant}'s Australian visa expired?",
        options: ["Yes", "No"],
        showWhen: isAU,
      },
      {
        id: "substantiveVisa",
        type: "radio",
        label: "Is {applicant}'s Australian visa a substantive visa?",
        hint: "A substantive visa is any visa other than a bridging visa, criminal justice visa or enforcement visa",
        options: ["Yes", "No"],
        showWhen: (a) => isAU(a) && a.visaExpired === "No",
      },
      {
        id: "currentVisaTypeDetails",
        type: "textarea",
        label: "What type of visa is {applicant} currently holding?",
        maxLength: 300,
        showWhen: (a) => isAU(a) && a.substantiveVisa === "No",
      },
      {
        id: "visaExpiryDate",
        type: "date",
        label: "When does {applicant}'s current visa expire?",
        futureOnly: true,
        showWhen: (a) => isAU(a) && a.visaExpired === "No",
      },
      {
        id: "planningNewVisaSoon",
        type: "radio",
        label:
          "Is {applicant} planning to apply for a new Australian visa within the next 6 months?",
        options: ["Yes", "No"],
        showWhen: (a) =>
          isAU(a) &&
          a.visaExpired === "No" &&
          moreThanDaysAhead(a.visaExpiryDate, 182),
      },
      {
        id: "visaExpiredDetails",
        type: "text",
        label: "Give details on when and why the visa expired",
        maxLength: 300,
        showWhen: (a) => isAU(a) && a.visaExpired === "Yes",
      },
      {
        id: "arrivedOnPMV",
        type: "radio",
        label:
          "Did {applicant} arrive in Australia on a Prospective Marriage visa?",
        options: ["Yes", "No"],
        showWhen: isAU,
      },
      {
        id: "sponsorWasPMVSponsor",
        type: "radio",
        label:
          "Was {sponsor} the sponsor for this Prospective Marriage visa?",
        options: ["Yes", "No"],
        showWhen: (a) => isAU(a) && a.arrivedOnPMV === "Yes",
      },
      {
        id: "stillWithPMVSponsor",
        type: "radio",
        label:
          "Is {applicant} still in a relationship with the sponsor of the Prospective Marriage visa?",
        options: ["Yes", "No"],
        showWhen: (a) => isAU(a) && a.sponsorWasPMVSponsor === "No",
      },
      {
        id: "pmvRelationshipEndDate",
        type: "date",
        label: "When did the relationship end with the previous sponsor?",
        pastOnly: true,
        showWhen: (a) => isAU(a) && a.stillWithPMVSponsor === "No",
      },
      {
        id: "pmvPreviousSponsorCircumstances",
        type: "checkboxes",
        label:
          "Select any of the following that apply to the previous sponsor for the Prospective Marriage visa",
        options: [
          "The sponsor is now deceased",
          "The applicant experienced family violence by the sponsor",
          "There are children of the relationship with the sponsor",
          "None of the above apply",
        ],
        showWhen: (a) => isAU(a) && a.stillWithPMVSponsor === "No",
      },
      {
        id: "pmvCeased",
        type: "radio",
        label: "Has this Prospective Marriage visa ceased?",
        options: ["Yes", "No"],
        showWhen: (a) => isAU(a) && a.arrivedOnPMV === "Yes",
      },
      {
        id: "marriedBeforePMVCeased",
        type: "radio",
        label:
          "Did {applicant} marry the sponsor before the Prospective Marriage visa ceased?",
        options: ["Yes", "No"],
        showWhen: (a) => isAU(a) && a.pmvCeased === "Yes",
      },
      {
        id: "applicantLegalStatus",
        type: "radio",
        label: "What is {applicant}'s legal status in their country?",
        options: [
          "Citizen",
          "Permanent resident",
          "Work visa",
          "Visitor",
          "Student",
          "No legal status",
          "Other",
        ],
        showWhen: offshore,
      },
      {
        id: "applicantLegalStatusDetails",
        type: "textarea",
        label:
          "Give details on the previous answer. If relevant, include the expiry date of the current visa",
        maxLength: 300,
        showWhen: (a) =>
          offshore(a) &&
          !!a.applicantLegalStatus &&
          a.applicantLegalStatus !== "Citizen",
      },
    ],
  },
  {
    id: "sponsorStatus",
    name: "Sponsor",
    title: "About {sponsor}",
    fields: [
      {
        id: "sponsorResidencyStatus",
        type: "radio",
        label:
          "What best describes {sponsor}'s Australian residency status?",
        options: [
          "Australian citizen by birth",
          "Australian citizen by grant",
          "Australian permanent resident",
          "Eligible New Zealand citizen",
          "Visiting Australia temporarily",
          "None of the above",
        ],
      },
      {
        id: "sponsorPrPathway",
        type: "radio",
        label:
          "How did {sponsor} obtain permanent residency in Australia?",
        options: [
          "Partner visa",
          "Prospective marriage visa",
          "Contributory parent visa",
          "Aged contributory parent visa",
          "Humanitarian visa",
          "None of the above",
        ],
        showWhen: (a) =>
          a.sponsorResidencyStatus === "Australian permanent resident" ||
          a.sponsorResidencyStatus === "Australian citizen by grant",
      },
      {
        id: "sponsorPartnerVisaApplicationDate",
        type: "date",
        label: "When was the partner visa application submitted?",
        pastOnly: true,
        showWhen: (a) => a.sponsorPrPathway === "Partner visa",
      },
      {
        id: "sponsorParentVisaGrantDate",
        type: "date",
        label: "When was the visa granted?",
        pastOnly: true,
        showWhen: (a) =>
          a.sponsorPrPathway === "Contributory parent visa" ||
          a.sponsorPrPathway === "Aged contributory parent visa",
      },
      {
        id: "sponsorVisitingVisaDetails",
        type: "text",
        label: "What visa is {sponsor} currently using to visit Australia?",
        maxLength: 300,
        showWhen: (a) =>
          a.sponsorResidencyStatus === "Visiting Australia temporarily",
      },
      {
        id: "sponsorStatusExplanation",
        type: "text",
        label:
          "Why did you answer 'None of the above' to the previous question about {sponsor}'s Australian residency status?",
        maxLength: 500,
        showWhen: (a) => a.sponsorResidencyStatus === "None of the above",
      },
      {
        id: "sponsorCountry",
        type: "select",
        label: "Where does {sponsor} currently live?",
        options: COUNTRIES,
        showWhen: (a) => !!a.sponsorResidencyStatus,
      },
    ],
  },
  {
    id: "previousSponsorships",
    name: "Sponsorships",
    fields: [
      {
        id: "sponsorPreviouslySponsored",
        type: "radio",
        label:
          "Has {sponsor} previously sponsored/nominated a spouse, de facto, prospective spouse or interdependent partner?",
        options: ["Yes", "No"],
      },
      {
        id: "previousSponsorshipEnded",
        type: "radio",
        label:
          "Has the relationship ended between {sponsor} and the person they previously sponsored?",
        options: ["Yes", "No"],
        showWhen: (a) => a.sponsorPreviouslySponsored === "Yes",
      },
      {
        id: "previousSponsorshipCount",
        type: "radio",
        label: "How many times has {sponsor} previously sponsored someone?",
        options: ["1", "2 or more"],
        showWhen: (a) => a.sponsorPreviouslySponsored === "Yes",
      },
      {
        id: "previousSponsorshipLodgedDate",
        type: "date",
        label:
          "When did {sponsor} lodge their previous sponsorship or nomination?",
        pastOnly: true,
        showWhen: (a) => a.sponsorPreviouslySponsored === "Yes",
      },
    ],
  },
  {
    id: "visaIssues",
    name: "Visa history",
    fields: [
      {
        id: "visaIssues",
        type: "radio",
        label:
          "Have {applicant} or {sponsor} experienced any of the visa issues below in any country (including Australia)?",
        bullets: [
          "Had a visa application refused",
          "Had a visa cancelled",
          "Overstayed a visa",
          "Breached a visa condition",
        ],
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "offences",
    name: "Character",
    fields: [
      {
        id: "criminalOffences",
        type: "radio",
        label: "Have either {applicant} or {sponsor} ever been either:",
        bullets: [
          "Convicted of an offence in any country",
          "Charged with any offence that is currently awaiting legal action in any country",
        ],
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "technology",
    name: "Technology",
    fields: [
      {
        id: "techComfort",
        type: "radio",
        label:
          "How comfortable are you both using computers, mobile phones and modern technology?",
        options: ["Very comfortable", "Somewhat comfortable", "Not comfortable"],
      },
    ],
  },
  {
    id: "relationship",
    name: "Relationship",
    fields: [
      {
        id: "relationshipStatus",
        type: "radio",
        label:
          "What best describes the relationship between {applicant} and {sponsor}?",
        options: ["Married", "Engaged", "De facto", "Dating", "None of the above"],
      },
      {
        id: "marriageDate",
        type: "date",
        label: "Date of marriage",
        pastOnly: true,
        showWhen: (a) => a.relationshipStatus === "Married",
      },
      {
        id: "engagementDate",
        type: "date",
        label: "Date of engagement",
        pastOnly: true,
        showWhen: (a) => a.relationshipStatus === "Engaged",
      },
      {
        id: "intendedMarriageDate",
        type: "date",
        label: "Date of intended marriage",
        required: false,
        futureOnly: true,
        showWhen: (a) => a.relationshipStatus === "Engaged",
      },
      {
        id: "datingStartDate",
        type: "date",
        label:
          "When did {applicant} and {sponsor} start dating and the relationship began as an official couple?",
        pastOnly: true,
        showWhen: (a) =>
          a.relationshipStatus === "Married" ||
          a.relationshipStatus === "De facto" ||
          a.relationshipStatus === "Engaged",
      },
      {
        id: "willingToMarry",
        type: "radio",
        label:
          "Would {applicant} and {sponsor} be willing to marry each other in order to secure a partner visa?",
        options: [
          "Yes, we would get married if it enabled us to gain a partner visa",
          "No, we would rather remain unmarried, even if it meant not gaining a partner visa",
        ],
        showWhen: (a) =>
          a.relationshipStatus === "De facto" || a.relationshipStatus === "Dating",
      },
      {
        id: "exclusiveRelationship",
        type: "radio",
        label:
          "Are {applicant} and {sponsor} in a relationship that is exclusive/monogamous?",
        options: ["Yes", "No"],
        showWhen: (a) => !!a.relationshipStatus,
      },
      {
        id: "nonExclusiveExplanation",
        type: "text",
        label: "Explain why you're not in a monogamous/exclusive relationship",
        maxLength: 500,
        showWhen: (a) => a.exclusiveRelationship === "No",
      },
    ],
  },
  {
    id: "livingTogether",
    name: "Living together",
    fields: [
      {
        id: "liveTogetherNow",
        type: "radio",
        label:
          "Currently, do you and your partner live at the same permanent residence?",
        options: ["Yes", "No"],
      },
      {
        id: "livedTogetherBefore",
        type: "radio",
        label:
          "Previously, have you and your partner ever lived at the same permanent residence?",
        options: ["Yes", "No"],
        showWhen: (a) => a.liveTogetherNow === "No",
      },
      {
        id: "livingTogetherSince",
        type: "date",
        label:
          "When did you and your partner first begin living at the same permanent residence?",
        pastOnly: true,
        showWhen: (a) =>
          a.liveTogetherNow === "Yes" || a.livedTogetherBefore === "Yes",
      },
      {
        id: "apartOverMonth",
        type: "radio",
        label:
          "Since you first began living together, have you ever lived apart for more than 1 month?",
        options: ["Yes", "No"],
        showWhen: (a) => a.liveTogetherNow === "Yes",
      },
      {
        id: "apartReasons",
        type: "checkboxes",
        label: "Why have you lived apart for more than 1 month?",
        options: [
          "One of us was on vacation",
          "Our jobs/work needed us to live in separate cities/towns",
          "We broke up, but now we're back together",
          "Something else",
        ],
        showWhen: (a) => a.liveTogetherNow === "Yes" && a.apartOverMonth === "Yes",
      },
      {
        id: "willingToLiveTogether",
        type: "radio",
        label:
          "Would {applicant} and {sponsor} be willing to begin living together in order to secure a partner visa?",
        options: [
          "Yes, we would begin living together if it enabled us to gain a partner visa",
          "No, we would not move in with each other, even if it meant not gaining a partner visa",
        ],
        showWhen: (a) =>
          a.liveTogetherNow === "No" && a.livedTogetherBefore === "No",
      },
      {
        id: "neverLivedTogetherReasons",
        type: "checkboxes",
        label:
          "Why have you never lived together at the same permanent residence?",
        options: [
          "Our jobs need us to live in separate locations",
          "We have a purely online relationship",
          "Our religion required that we live apart",
          "In our culture it would have been unusual to live together so soon",
          "War and humanitarian reasons stopped us from living together",
          "Something else",
        ],
        showWhen: (a) => a.livedTogetherBefore === "No",
      },
      {
        id: "neverLivedTogetherOther",
        type: "textarea",
        label: 'Explain why you selected "something else" in the previous question',
        maxLength: 1000,
        showWhen: (a) =>
          Array.isArray(a.neverLivedTogetherReasons) &&
          a.neverLivedTogetherReasons.includes("Something else"),
      },
      {
        id: "metInPerson",
        type: "radio",
        label: "Have {applicant} and {sponsor} ever met in-person?",
        options: ["Yes, we have met in-person", NEVER_MET],
        showWhen: (a) =>
          a.liveTogetherNow === "No" && a.livedTogetherBefore === "No",
      },
      {
        id: "arrangedMarriage",
        type: "radio",
        label:
          "Has an arranged marriage been organised between {applicant} and {sponsor} by your families?",
        options: ["Yes", "No", "Not sure"],
        showWhen: (a) => a.metInPerson === NEVER_MET,
      },
      {
        id: "neverMetExplanation",
        type: "text",
        label: "Why have you never met in person?",
        maxLength: 500,
        showWhen: (a) =>
          a.metInPerson === NEVER_MET &&
          (a.arrangedMarriage === "No" || a.arrangedMarriage === "Not sure"),
      },
    ],
  },
  {
    id: "migratingMembers",
    name: "Family",
    fields: [
      {
        id: "additionalMigratingMembers",
        type: "radio",
        label:
          "Aside from {applicant}, how many members of the applicant's family unit are migrating to Australia who need to be included in this application?",
        options: ["0", "1", "2 or more"],
      },
    ],
  },
  {
    id: "health",
    name: "Health",
    fields: [
      {
        id: "seriousHealthConditions",
        type: "radio",
        label:
          "Do any of the applicants have any serious health conditions or diseases?",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "age",
    name: "Age",
    fields: [
      {
        id: "bothOver18",
        type: "radio",
        label: "Are both {applicant} and {sponsor} 18 years of age or older?",
        options: ["Yes", "No"],
      },
      {
        id: "under18Explanation",
        type: "text",
        label:
          "Explain why you are applying for a visa as someone who is younger than 18 years of age",
        maxLength: 500,
        showWhen: (a) => a.bothOver18 === "No",
      },
    ],
  },
  {
    id: "hdyhau",
    name: "Discovery",
    fields: [
      {
        id: "hearAboutUs",
        type: "radio",
        label: "How did you hear about us?",
        required: false,
        options: [
          "Instagram",
          "TikTok",
          "Facebook",
          "LinkedIn",
          "Google",
          "ChatGPT (or equivalent)",
          "Referral",
          "Other",
        ],
      },
      {
        id: "hearAboutUsOther",
        type: "text",
        label:
          "Understanding how you heard about us helps us give you a better service!",
        required: false,
        maxLength: 300,
        showWhen: (a) => a.hearAboutUs === "Other",
      },
    ],
  },
  {
    id: "referral",
    name: "Referral",
    fields: [
      {
        id: "referred",
        type: "radio",
        label: "Were you referred to us by someone?",
        required: false,
        options: ["Yes", "No"],
      },
      {
        id: "referralCode",
        type: "text",
        label: "Add the referral code from the person who referred you",
        required: false,
        maxLength: 100,
        showWhen: (a) => a.referred === "Yes",
      },
    ],
  },
  {
    id: "email",
    name: "Results",
    title: "Last step — where can we reach you?",
    fields: [
      {
        id: "email",
        type: "email",
        label: "What is your email address?",
        maxLength: 255,
      },
      {
        id: "consent",
        type: "consent",
        label: CONSENT_NOTICE,
        hint: "We need this before we can save your assessment.",
      },
    ],
  },
];
