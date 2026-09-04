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
        id: "lbasing",
        label: "L-basing skills",
        type: "multi",
        options: [
          "Bird, Throne, Star",
          "Reverse bird, Reverse star, Shoulder stand",
          "Foot to hand",
          "Hand to hand from L-base",
          "Basic washing machines (4-step, Ninja Star, Clumsy Pickpocket)",
          "Advanced washing machines (Pickpocket without hands, Flying Crescent)",
          "Tarzan",
          "Mortalito",
          "Full Mortalito",
          "Basic icarians: throne to plank, plank to throne",
          "Castaway",
          "Full Castaway or Arabian",
        ],
        required: false,
        usedForMatching: true,
        helpText:
          "An honest assessment helps us match you with people of a similar level. Select all the skills you are comfortable with.",
      },
      {
        id: "standing",
        label: "Standing acro skills",
        type: "multi",
        options: [
          "2 High",
          "F2H for 10 seconds without base taking steps",
          "H2H for 5 seconds without base taking steps",
          "Podsechka",
          "1-Arm H2H for 5 seconds",
          "Working on 1-arm pirouettes",
          "Cascade or Courbette",
          "Handspring or Back Tuck",
          "Jäger or Tkatchev",
        ],
        required: false,
        usedForMatching: true,
        helpText: "Select all the skills you are comfortable with, out of lines.",
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
