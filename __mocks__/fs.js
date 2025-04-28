const fs = jest.createMockFromModule('fs');


let mockedFiles = {};

fs.readFileSync = jest.fn((path) => {
    if (path === 'src/data/user_skills.json') {
        return `{ "user_skills": [ { "user_id": "user123", "skill_id": "reading", "current_level": 1, "current_xp": 0 }, { "user_id": "user123", "skill_id": "coding", "current_level": 1, "current_xp": 0 }, { "user_id": "user123", "skill_id": "memorization", "current_level": 1, "current_xp": 0 } ] }`;
    } else if (path === 'src/data/skills.json') {
        return `{ "skills": [ { "id": "reading", "name": "Reading", "level_cap": 10 }, { "id": "coding", "name": "Coding", "level_cap": 10 }, { "id": "memorization", "name": "Memorization", "level_cap": 10 } ] }`;
    } else {
        return "";
    }
});

fs.writeFileSync = jest.fn((path, data) => {
  mockedFiles[path] = data;
});


fs.__getMockedFile = (path) => {
  return mockedFiles[path] || null;
};

fs.__clearMockedFiles = () => {
    mockedFiles = {};
};

module.exports = fs;
