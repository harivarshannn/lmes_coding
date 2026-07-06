const fs = require('fs');
const path = require('path');

function updateSkills() {
    const timestamp = new Date().toISOString();
    const skillsToUpdate = [
        path.join(__dirname, '../skills/lmes-project-context/SKILL.md'),
        path.join(__dirname, '../skills/prompt-enhancer-mongodb/SKILL.md')
    ];

    skillsToUpdate.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Update YAML date_added/last_updated
            content = content.replace(/last_updated: "[^"]*"/, `last_updated: "${timestamp}"`);
            content = content.replace(/date_added: "[^"]*"/, `date_added: "${timestamp.split('T')[0]}"`);
            
            // Also update any July 6, 2026 header text to the current date string
            const currentDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            content = content.replace(/Latest Status - [^)]+/, `Latest Status - ${currentDateStr}`);

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Successfully updated context timestamp in: ${path.basename(filePath)}`);
        } else {
            console.warn(`File not found: ${filePath}`);
        }
    });
}

if (require.main === module) {
    updateSkills();
}

module.exports = updateSkills;
