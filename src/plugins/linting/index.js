const { analyzeJsDiff } = require('../../languages/javascript/analyze');
const lintingPlugin = {
    name: "Linting & Code Smells",

    async run(file) {
        if (file.language === 'javascript') {
            return analyzeJsDiff(file);
        }

        if (file.language === 'python') {
            console.log(`  -> Python support is pending. Skipping ${file.filename}.`);
            return null;
        }

        console.log(`  -> Unsupported language: ${file.language}. Skipping ${file.filename}.`);
        return null;
    }
};

module.exports = { lintingPlugin };