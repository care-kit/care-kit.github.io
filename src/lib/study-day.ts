/**
 * Calculate the current study day (1-based) from the study start date
 * @param studyStartDate ISO string of when the study started
 * @returns The current study day (1, 2, 3, ...)
 */
export function getStudyDay(studyStartDate: string): number {
  const startDate = new Date(studyStartDate);
  const today = new Date();

  // Reset both dates to start of day for accurate day calculation
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Study day is 1-based (day 1, day 2, etc.)
  return diffDays + 1;
}

/**
 * Calculate the affirmation index based on study day and time of day
 * Formula: (studyDay % 7) × 2 + (isMorning ? 0 : 1)
 * Morning affirmations: 0, 2, 4, 6, 8, 10, 12
 * Evening affirmations: 1, 3, 5, 7, 9, 11, 13
 *
 * @param studyStartDate ISO string of when the study started
 * @param isMorning Whether it's a morning session
 * @returns The affirmation index (0-13)
 */
export function getAffirmationIndex(studyStartDate: string, isMorning: boolean): number {
  const studyDay = getStudyDay(studyStartDate);

  // Use modulo to cycle through days 0-6 (representing day 1-7 in the cycle)
  const cycleDay = (studyDay - 1) % 7;

  // Calculate affirmation index
  const affirmationIndex = cycleDay * 2 + (isMorning ? 0 : 1);

  return affirmationIndex;
}

/**
 * Check if the user has completed at least 7 days of the study
 * @param studyStartDate ISO string of when the study started
 * @returns True if user has completed 7+ days
 */
export function hasCompletedSevenDays(studyStartDate: string): boolean {
  const studyDay = getStudyDay(studyStartDate);
  return studyDay >= 7;
}
