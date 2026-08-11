// Central, configurable product settings (PRD: keep limits configurable)

export const CREDITS = {
  anonymousPerDay: parseInt(process.env.CREDITS_ANON_PER_DAY ?? "3", 10),
  loggedInPerDay: parseInt(process.env.CREDITS_USER_PER_DAY ?? "6", 10),
};

export interface NewsletterList {
  id: string;
  title: string;
  description: string;
}

// Newsletter recommendations shown at the email gate (must join at least one)
export const NEWSLETTER_LISTS: NewsletterList[] = [
  { id: "weekly_printable_club", title: "Weekly Printable Club", description: "New free worksheets every week" },
  { id: "alphabet_numbers", title: "Alphabet & Numbers Practice", description: "Letter and number worksheets by age" },
  { id: "seasonal_holiday", title: "Seasonal & Holiday Printables", description: "Christmas, Halloween and more" },
  { id: "teacher_pack", title: "Teacher Resource Pack", description: "Classroom-ready printable packs" },
];

export const ANON_COOKIE = "kiwiz_anon_id";
