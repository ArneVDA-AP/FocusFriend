// Removed import * as fs from 'fs';

export interface UserSkill {
  user_id: string;
  skill_id: string;
  current_level: number;
  current_xp: number;
}

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    level_cap: number;
}

// Removed file path constants

// Constants for XP calculation
const BASE_XP_PER_MINUTE = 10;
const COMPLETION_MULTIPLIER = 1.25;
const XP_LEVEL_BASE = 100;
const XP_LEVEL_FACTOR = 50;


/**
 * Calculates the XP earned for a given time spent and completion status.
 * @param timeSpent Time spent in minutes.
 * @param isComplete Whether the task/session was completed.
 * @param skillId The ID of the skill being trained (currently unused but kept for potential future use).
 * @returns The amount of XP earned.
 */
function calculateXp(timeSpent: number, isComplete: boolean, skillId: string): number {
  // Convert timeSpent from seconds (as it comes from timer) to minutes for calculation
  const timeInMinutes = timeSpent / 60;
  let xp = timeInMinutes * BASE_XP_PER_MINUTE;
  if (isComplete) {
    xp *= COMPLETION_MULTIPLIER;
  }
  // console.log(`Calculated XP: ${xp} for ${timeSpent} seconds (${timeInMinutes} mins), completed: ${isComplete}`);
  return xp;
}

/**
 * Awards XP to a specific user skill, handling level ups.
 * Modifies the passed userSkills array directly.
 * @param userId The ID of the user.
 * @param skillId The ID of the skill to award XP to.
 * @param xp The amount of XP to award.
 * @param userSkills The array of all user skills.
 * @returns The updated userSkills array (or the original if user/skill not found).
 */
function awardXp(userId: string, skillId: string, xp: number, userSkills: UserSkill[]): UserSkill[] {
  const userSkillIndex = userSkills.findIndex(
    (us) => us.user_id === userId && us.skill_id === skillId
  );

  if (userSkillIndex === -1) {
    console.error(`User skill not found for userId: ${userId}, skillId: ${skillId}`);
    return userSkills; // Return original array if not found
  }

  const updatedSkill = { ...userSkills[userSkillIndex] }; // Create a copy to modify
  updatedSkill.current_xp += xp;
  // console.log(`Awarding ${xp} XP to ${skillId}. New total XP before level check: ${updatedSkill.current_xp}`);


  // Calculate XP needed for the *next* level
  let xpToNextLevel = XP_LEVEL_BASE + updatedSkill.current_level * XP_LEVEL_FACTOR;

  while (updatedSkill.current_xp >= xpToNextLevel) {
    updatedSkill.current_xp -= xpToNextLevel;
    updatedSkill.current_level++;
    // console.log(`Level Up! Reached level ${updatedSkill.current_level}. Remaining XP: ${updatedSkill.current_xp}`);
    // Recalculate XP needed for the new next level
    xpToNextLevel = XP_LEVEL_BASE + updatedSkill.current_level * XP_LEVEL_FACTOR;
    // console.log(`XP needed for level ${updatedSkill.current_level + 1}: ${xpToNextLevel}`);

    // Add a level cap check if needed based on SkillDefinition
  }

  // Update the array with the modified skill
  userSkills[userSkillIndex] = updatedSkill;

  // This function no longer writes to file, it modifies the array in memory.
  // The calling component is responsible for persisting this change (e.g., to localStorage or state).

  return userSkills;
}

/**
 * Processes task completion, calculating and awarding XP.
 * @param userId The user ID.
 * @param taskId The ID of the completed task (currently unused).
 * @param skillId The relevant skill ID for the task.
 * @param timeSpent Time spent in seconds.
 * @param userSkills The current array of user skills.
 * @returns The updated userSkills array after awarding XP.
 */
function completeTask(userId: string, taskId: string, skillId: string, timeSpent: number, userSkills: UserSkill[]): UserSkill[] {
  const xp = calculateXp(timeSpent, true, skillId);
  return awardXp(userId, skillId, xp, userSkills);
}

/**
 * Calculates the XP required to reach the next level for a given current level.
 * @param currentLevel The current level of the skill.
 * @returns The total XP needed to reach the level *after* the current one.
 */
function calculateXpToNextLevel(currentLevel: number): number {
    return XP_LEVEL_BASE + currentLevel * XP_LEVEL_FACTOR;
}


export { calculateXp, awardXp, completeTask, calculateXpToNextLevel };
