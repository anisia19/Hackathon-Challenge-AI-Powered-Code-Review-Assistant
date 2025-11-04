const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function run(filesToReview) {
    const jsFiles = filesToReview
        .filter(file => file.language === 'javascript' || file.language === 'typescript')
        .map(file => file.filename);

    if (jsFiles.length === 0) {
        return "No relevant JavaScript/TypeScript files were found for static analysis.";
    }

    const filesString = jsFiles.join(' ');
    const command = `npx eslint ${filesString} --format json || true`;

    console.log(`Running ESLint on files: ${filesString}`);

    try {
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Warning')) {
            console.error("Error running ESLint command:", stderr);
            return `###  Error running ESLint\n\nThe command failed. Check CI logs.\nDetails: \`\`\`\n${stderr}\n\`\`\``;
        }

        const results = JSON.parse(stdout.trim());

        let output = `###  Linting Results (ESLint)\n\n`;
        let totalErrors = 0;
        let totalWarnings = 0;

        const detailedResults = results.map(fileResult => {
            if (fileResult.messages.length === 0) return '';

            totalErrors += fileResult.errorCount;
            totalWarnings += fileResult.warningCount;

            let fileOutput = `####  \`${fileResult.filePath}\`\n\n`;
            fileResult.messages.forEach(msg => {
                const severity = msg.severity === 2 ? ' ERROR' : ' WARNING';
                fileOutput += `- [Line ${msg.line}:${msg.column}] ${severity}: ${msg.message} (\`${msg.ruleId || 'N/A'}\`)\n`;
            });
            return fileOutput;
        }).join('');

        if (totalErrors === 0 && totalWarnings === 0) {
            output += " Code is clean! No ESLint errors or warnings found.";
        } else {
            output += `**Summary:** ${totalErrors} errors and ${totalWarnings} warnings found.\n\n`;
            output += detailedResults;
        }

        return output;

    } catch (error) {
        console.error("Unexpected error in linting plugin:", error.message);
        return `###  Linting Error\n\nStatic analysis could not be performed. Verify that \`eslint\` is correctly installed and configured in the project's dependencies.\nDetails: \`\`\`\n${error.message}\n\`\`\``;
    }
}

module.exports = { run };