import { calculateXp, awardXp, completeTask, calculateXpToNextLevel, UserSkill } from './skills';
// Removed import fs from 'fs'; - No longer needed

// Initial state for testing
const getInitialUserSkills = (): UserSkill[] => [
    { user_id: 'user123', skill_id: 'reading', current_level: 1, current_xp: 0 },
    { user_id: 'user123', skill_id: 'coding', current_level: 1, current_xp: 0 },
    { user_id: 'user123', skill_id: 'memorization', current_level: 1, current_xp: 0 },
];

describe('calculateXp', () => {
    // Test cases assume timeSpent is in seconds now
    it('should calculate XP correctly for completed task (60 seconds)', () => {
        // 1 minute * 10 XP/min * 1.25 completion bonus = 12.5 XP
        const xp = calculateXp(60, true, 'reading');
        expect(xp).toBe(12.5);
    });

    it('should calculate XP correctly for incomplete task (300 seconds)', () => {
        // 5 minutes * 10 XP/min = 50 XP
        const xp = calculateXp(300, false, 'reading');
        expect(xp).toBe(50);
    });

     it('should return 0 XP for 0 seconds', () => {
        const xp = calculateXp(0, true, 'reading');
        expect(xp).toBe(0);
    });
});

describe('awardXp', () => {
    let userSkills: UserSkill[];

    beforeEach(() => {
        userSkills = getInitialUserSkills(); // Reset skills before each test
    });

    it('should award 12.5 xp to a user with 0 xp', () => {
        const updatedSkills = awardXp('user123', 'reading', 12.5, userSkills);
        const userSkill = updatedSkills.find(us => us.user_id === 'user123' && us.skill_id === 'reading');
        expect(userSkill?.current_xp).toBe(12.5);
        expect(userSkill?.current_level).toBe(1);
    });

    it('should award 100 xp to a user with 0 xp, keeping level 1', () => {
         // Level 1 -> 2 requires 100 + 1*50 = 150 XP
        const updatedSkills = awardXp('user123', 'reading', 100, userSkills);
        const userSkill = updatedSkills.find(us => us.user_id === 'user123' && us.skill_id === 'reading');
        expect(userSkill?.current_xp).toBe(100);
        expect(userSkill?.current_level).toBe(1);
    });

    it('should award 150 xp to a user with 0 xp, resulting in level 2 and 0 xp', () => {
        // Level 1 -> 2 requires 150 XP
        const updatedSkills = awardXp('user123', 'reading', 150, userSkills);
        const userSkill = updatedSkills.find(us => us.user_id === 'user123' && us.skill_id === 'reading');
        expect(userSkill?.current_xp).toBe(0);
        expect(userSkill?.current_level).toBe(2);
    });

    it('should award 100 xp to a user with 100 xp and level 1, resulting in level 2 and 50 xp', () => {
        // Start with 100 XP
        userSkills = awardXp('user123', 'reading', 100, userSkills);
        // Award another 100 XP (total 200)
        const updatedSkills = awardXp('user123', 'reading', 100, userSkills);
        const userSkill = updatedSkills.find(us => us.user_id === 'user123' && us.skill_id === 'reading');
        // Level 1 -> 2 requires 150 XP. 200 - 150 = 50 XP remaining.
        expect(userSkill?.current_xp).toBe(50);
        expect(userSkill?.current_level).toBe(2);
    });

    it('should award 600 xp to a user with 0 xp, resulting in level 4 and 0 xp', () => {
        // Lvl 1->2: 150 XP (Total: 150)
        // Lvl 2->3: 100 + 2*50 = 200 XP (Total: 350)
        // Lvl 3->4: 100 + 3*50 = 250 XP (Total: 600)
        const updatedSkills = awardXp('user123', 'reading', 600, userSkills);
        const userSkill = updatedSkills.find(us => us.user_id === 'user123' && us.skill_id === 'reading');
        expect(userSkill?.current_xp).toBe(0);
        expect(userSkill?.current_level).toBe(4);
    });

    it('should handle awarding XP to non-existent user/skill gracefully', () => {
        const originalSkills = [...userSkills]; // Copy before potentially modifying
        const updatedSkills = awardXp('nonexistent', 'reading', 100, userSkills);
        expect(updatedSkills).toEqual(originalSkills); // Skills should not change
        const updatedSkills2 = awardXp('user123', 'nonexistent', 100, userSkills);
        expect(updatedSkills2).toEqual(originalSkills); // Skills should not change
    });
});

describe('completeTask', () => {
    it('should award the correct xp to the user based on time and completion', () => {
        let userSkills = getInitialUserSkills();
        // Complete task spending 120 seconds (2 minutes)
        // XP = 2 min * 10 XP/min * 1.25 = 25 XP
        const updatedSkills = completeTask('user123', 'task1', 'coding', 120, userSkills);
        const userSkill = updatedSkills.find(us => us.user_id === 'user123' && us.skill_id === 'coding');
        expect(userSkill?.current_xp).toBe(25);
        expect(userSkill?.current_level).toBe(1);
    });
});

describe('calculateXpToNextLevel', () => {
    it('should return 150 for level 1', () => {
        expect(calculateXpToNextLevel(1)).toBe(150);
    });
     it('should return 200 for level 2', () => {
        expect(calculateXpToNextLevel(2)).toBe(200);
    });
    it('should return 350 for level 5', () => {
        expect(calculateXpToNextLevel(5)).toBe(350);
    });
});
