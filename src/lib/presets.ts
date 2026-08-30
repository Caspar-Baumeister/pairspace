import type { EventCategory, EventQuestion } from "./types";

export interface CategoryPreset {
  id: string;
  name: string;
  blurb: string;
  categories: EventCategory[];
  questions: EventQuestion[];
}

const level: EventQuestion = {
  id: "level",
  label: "Experience level",
  type: "single",
  options: ["Beginner", "Improver", "Intermediate", "Advanced"],
  required: true,
  usedForMatching: true,
  helpText: "Participants see this on every profile.",
};

const availability: EventQuestion = {
  id: "availability",
  label: "Availability",
  type: "multi",
  options: ["Friday", "Saturday", "Sunday", "Full weekend"],
  required: false,
  usedForMatching: true,
};

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: "acro",
    name: "Acro festival",
    blurb: "Bases and Flyers, plus everyone who does both.",
    categories: [
      { id: "base", label: "Base", matchesWith: ["flyer", "both"] },
      { id: "flyer", label: "Flyer", matchesWith: ["base", "both"] },
      { id: "both", label: "Both", matchesWith: ["base", "flyer", "both"] },
    ],
    questions: [
      level,
      availability,
      {
        id: "height",
        label: "Height",
        type: "single",
        options: ["Under 160 cm", "160 to 170 cm", "170 to 180 cm", "Over 180 cm"],
        required: false,
        usedForMatching: true,
      },
    ],
  },
  {
    id: "dance",
    name: "Dance event",
    blurb: "Leaders and Followers with a switch option.",
    categories: [
      { id: "leader", label: "Leader", matchesWith: ["follower", "switch"] },
      { id: "follower", label: "Follower", matchesWith: ["leader", "switch"] },
      { id: "switch", label: "Switch", matchesWith: ["leader", "follower", "switch"] },
    ],
    questions: [level, availability],
  },
  {
    id: "workshop",
    name: "Workshop or training",
    blurb: "Practice partners of a similar level.",
    categories: [
      { id: "partner", label: "Practice partner", matchesWith: ["partner"] },
      { id: "mentor", label: "Mentor", matchesWith: ["mentee"] },
      { id: "mentee", label: "Mentee", matchesWith: ["mentor"] },
    ],
    questions: [level, availability],
  },
  {
    id: "team",
    name: "Team or hackathon",
    blurb: "Roles that build a team rather than a pair.",
    categories: [
      { id: "builder", label: "Builder", matchesWith: ["designer", "domain", "builder"] },
      { id: "designer", label: "Designer", matchesWith: ["builder", "domain"] },
      { id: "domain", label: "Domain expert", matchesWith: ["builder", "designer"] },
    ],
    questions: [
      {
        id: "teamsize",
        label: "Preferred team size",
        type: "single",
        options: ["2", "3", "4", "5 or more"],
        required: true,
        usedForMatching: true,
      },
      availability,
    ],
  },
  {
    id: "custom",
    name: "Start from scratch",
    blurb: "Name your own categories and questions.",
    categories: [],
    questions: [],
  },
];
