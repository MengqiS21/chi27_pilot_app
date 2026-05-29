/** Pilot Study questionnaire — verbatim from Study Materials Part 1. */

export const SCALE_INSTRUCTIONS = {
  agree7:
    "Response options (1–7): 1 = Strongly disagree · 2 = Disagree · 3 = Somewhat disagree · 4 = Neither agree nor disagree · 5 = Somewhat agree · 6 = Agree · 7 = Strongly agree.",
  agree5:
    "Response options (1–5): 1 = Strongly disagree · 2 = Disagree · 3 = Neither agree nor disagree · 4 = Agree · 5 = Strongly agree.",
  severity7:
    "Response options (1–7): 1 = Not at all serious · 2 = Slightly serious · 3 = Somewhat serious · 4 = Moderately serious · 5 = Quite serious · 6 = Very serious · 7 = Extremely serious.",
} as const;

export const SCREENING = {
  items: [
    {
      key: "scr1",
      text: "Are you 21 years of age or older?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      screenOut: "no",
    },
    {
      key: "scr2",
      text: "Have you ever used an AI tool, such as a chatbot or AI assistant, to seek emotional support or to talk through something personal or emotional?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      screenOut: "no",
    },
  ],
} as const;

export const SECTION_A = {
  title: "Scenario material validation",
  realism: {
    title: "Scenario realism",
    scale: "agree7" as const,
    instruction: SCALE_INSTRUCTIONS.agree7,
    items: [
      { key: "rea1", text: "This scenario felt realistic to me." },
      {
        key: "rea2",
        text: "I can imagine a situation like this actually happening to someone.",
      },
      { key: "rea3", text: "The situation described felt believable." },
    ],
  },
  engagement: {
    title: "Emotional engagement",
    scale: "agree7" as const,
    instruction: SCALE_INSTRUCTIONS.agree7,
    items: [
      { key: "eng1", text: "I could easily imagine myself in this situation." },
      {
        key: "eng2",
        text: "While reading, I felt emotionally involved in what the person was going through.",
      },
    ],
  },
  severity: {
    title: "Perceived severity",
    scale: "severity7" as const,
    instruction: SCALE_INSTRUCTIONS.severity7,
    items: [
      {
        key: "sev1",
        text: "Overall, how serious is the situation this person is facing?",
      },
    ],
  },
} as const;

export const SECTION_B = {
  title: "Experienced scenario: appraisal, manipulation check, and perception",
  understanding: {
    title: "Perceived understanding of the redirection",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    items: [
      { key: "und1", text: "I understood why the AI responded the way it did." },
      {
        key: "und2",
        text: "The reason behind the AI's response was clear to me.",
      },
      { key: "und3", text: "It made sense to me that the AI responded this way." },
    ],
  },
  agency: {
    title: "Perceived agency over what to do next",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    items: [
      {
        key: "agn1",
        text: "After this response, I felt I had options for what to do next.",
      },
      {
        key: "agn2",
        text: "Whether I get the support I need is mostly up to me.",
      },
      {
        key: "agn3",
        text: "I felt confident I could take a next step toward getting support.",
      },
    ],
  },
  rupture: {
    title: "Perceived relational rupture",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    items: [
      { key: "rup1", text: "The AI's response felt cold and impersonal." },
      { key: "rup2", text: "I felt the AI was unwilling to help me." },
      {
        key: "rup3",
        text: "The way the conversation ended felt like a connection had been broken.",
      },
    ],
  },
  manipulationCheck: {
    title: "Manipulation check",
    scale: "agree5" as const,
    instruction: SCALE_INSTRUCTIONS.agree5,
    guidance: {
      title: "Actionable guidance check",
      items: [
        {
          key: "mcg1",
          text: "The AI gave me clear and specific information about where I could get help.",
        },
        {
          key: "mcg2",
          text: "The AI told me about a concrete next step I could take.",
        },
        {
          key: "mcg3",
          text: "The AI's suggestion about getting help was vague. (R)",
          reverseScored: true,
        },
      ],
    },
    continuity: {
      title: "Support continuity check",
      items: [
        {
          key: "mcc1",
          text: "The AI's final response felt like a natural continuation of the conversation.",
        },
        {
          key: "mcc2",
          text: "The AI acknowledged what I had shared before redirecting me.",
        },
        {
          key: "mcc3",
          text: "The way the conversation ended felt abrupt. (R)",
          reverseScored: true,
        },
      ],
    },
  },
  perception: {
    title: "Open perception of the redirection",
    items: [
      {
        key: "per1",
        text: "In your own words, how did the way the AI ended the conversation feel to you, and what stood out about its final response?",
      },
    ],
  },
} as const;

export const SECTION_C = {
  title: "Item feedback form",
  items: [
    {
      key: "fb1",
      text: "Were any of the statements above unclear, confusing, or worded oddly? If so, which ones, and what was unclear?",
    },
    {
      key: "fb2",
      text: "Did any statement not match how you actually felt during the scenario? Please explain.",
    },
    {
      key: "fb3",
      text: "Was anything about the scenario itself or the AI's response confusing or hard to believe?",
    },
  ],
} as const;

export const DEMOGRAPHICS = {
  title: "Demographic information",
  age: {
    key: "dem1",
    label: "What is your age?",
    type: "number" as const,
    placeholder: "Age in years",
    allowPreferNot: true,
  },
  gender: {
    key: "dem2",
    label: "What is your gender?",
    options: [
      "Woman",
      "Man",
      "Non-binary",
      "Prefer to self-describe",
      "Prefer not to say",
    ],
  },
  education: {
    key: "dem3",
    label: "What is the highest level of education you have completed?",
    options: [
      "Less than high school",
      "High school or equivalent",
      "Some college, no degree",
      "Associate or vocational degree",
      "Bachelor's degree",
      "Master's degree",
      "Doctoral or professional degree",
      "Prefer not to say",
    ],
  },
  employment: {
    key: "dem4",
    label: "What is your current employment status?",
    options: [
      "Employed full-time",
      "Employed part-time",
      "Self-employed",
      "Student",
      "Unemployed",
      "Retired",
      "Unable to work",
      "Prefer not to say",
    ],
  },
  living: {
    key: "dem5",
    label: "What best describes your current living situation?",
    options: [
      "Live alone",
      "Live with a partner or spouse",
      "Live with family",
      "Live with roommates or housemates",
      "Other",
    ],
  },
  region: {
    key: "dem6",
    label: "What country or region do you currently live in?",
    type: "text" as const,
  },
  englishFirst: {
    key: "dem7",
    label: "Is English your first language?",
    options: ["Yes", "No", "Prefer not to say"],
  },
  englishComfort: {
    key: "dem8",
    label:
      "Are you able to read and complete surveys and interviews comfortably in English?",
    options: ["Yes", "No"],
  },
} as const;

function allLikertKeys(
  sections: Array<{ items: ReadonlyArray<{ key: string }> }>
): string[] {
  return sections.flatMap((s) => s.items.map((i) => i.key));
}

export const SECTION_A_KEYS = allLikertKeys([
  SECTION_A.realism,
  SECTION_A.engagement,
  SECTION_A.severity,
]);

export const SECTION_B_LIKERT_KEYS = allLikertKeys([
  SECTION_B.understanding,
  SECTION_B.agency,
  SECTION_B.rupture,
  SECTION_B.manipulationCheck.guidance,
  SECTION_B.manipulationCheck.continuity,
]);
