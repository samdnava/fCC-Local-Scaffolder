const fs = require('node:fs').promises;

// Entry point: Parses command line arguments and iterates through the list of URLs.
async function run() {
    // Collect all arguments passed after the script name in the terminal
    let challengeUrls = process.argv.slice(2);

    // If the user typed --all, replace the empty list with the full directory
    if (challengeUrls[0] === "--all") {
        console.log("📂 Fetching full challenge list...");
        challengeUrls = await fetchAllUrls();
    }

    // Stop execution if no URLs were provided
    if (challengeUrls.length === 0) {
        console.log("Please provide at least one freeCodeCamp URL!");
        return;
    }

    for (let url of challengeUrls) {
        // Perform the network request to get the raw markdown
        let markdownText = await fetchChallengeData(url);
        if (!markdownText) continue; // Skip to the next URL if this one fails

        // Extract specific fields and generate file templates
        let challengeData = parseChallengeData(markdownText);

        // Create the directory and save the files to the disk
        await buildChallengeFiles(challengeData);

        console.log(`✅ Ready: ${challengeData.challengeTitle}`);
    }
}

// Performs an asynchronous fetch request and returns the response body as text.
// Returns null if the status is not 200 or if a network error occurs.
async function fetchChallengeData(url) {
    try {
        let response = await fetch(url);
        if (!response.ok) {
            console.log(`⚠️ Failed to fetch: ${url} (Status: ${response.status})`);
            return null;
        }
        return await response.text();
    } catch (error) {
        console.log(`❌ Connection error for: ${url}`);
        return null;
    }
}

// Splits the raw Markdown string using freeCodeCamp's section delimiters (# --).
// Extracts title, code, and tests, then generates HTML/JS boilerplate.
function parseChallengeData(markdownText) {
    // freeCodeCamp uses "# --" to separate metadata from content sections
    let sections = markdownText.split("# --");

    // Grab the raw title line
    let rawTitle = sections[0].split("title:")[1].split("\n")[0];

    // Remove anything that isn't a letter, number, space, or hyphen
    let challengeTitle = rawTitle.replace(/[^a-zA-Z0-9\s-]/g, "").trim();

    // Safely find the sections by looking for how they start
    let rawDescription = sections.find(sec => sec.startsWith("description--")) || "";

    // Clean off the internal freeCodeCamp tags and trim whitespace
    let challengeDescription = rawDescription.replace("description--", "").trim();

    // Build a beautiful Markdown string for our new README file
    let readmeTemplate = `# ${challengeTitle}\n\n## Description\n${challengeDescription}\n\n`;

    // Isolates the starter JavaScript code found within backticks
    let codeTemplate = sections[4].split("```js")[1].split("```")[0].trim();

    // Preserves the markdown-formatted test cases for reference
    let testMarkdown = sections[2].trim();

    // Creates the index.html string with the challenge title injected
    let htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${challengeTitle}</title>
</head>
<body>
    <h1>${challengeTitle}</h1>
    
    <h2>Description</h2>
    <div>${challengeDescription}</div>
    
    <script src="script.js"></script>
</body>
</html>`;

    // Creates the test-runner.js string containing the automated testing logic
    let testRunnerTemplate = `const fs = require('fs').promises;
const assert = require('assert'); // Brings in Node's assertion library

async function runTests() {
    let userCode = await fs.readFile("script.js", "utf8");
    let testMarkdown = await fs.readFile("tests.md", "utf8");

    // Split the Markdown into chunks based on where JS code blocks start
    let blocks = testMarkdown.split("\`\`\`js");

    // Start at 1, because index 0 is the text before the very first test
    for (let i = 1; i < blocks.length; i++) {
        // Grab the description from the END of the previous block
        let description = blocks[i - 1].split("\`\`\`").pop().replace("hints--", "").trim();

    // Grab the executable test code from the START of the current block
    let testCode = blocks[i].split("\`\`\`")[0];

    console.log("\\n📋 " + description);

    try {
        eval(userCode + "\\n" + testCode);
        console.log("   ✅ Passed");
    } catch (error) {
        console.log("   ❌ Failed");

        // If the assertion error contains actual/expected values, print them!
        if ('actual' in error && 'expected' in error) {
            console.log("      Expected:", error.expected);
            console.log("      Actual:     ", error.actual);
        } else {
            // Fallback for syntax errors or simple boolean assertions
            console.log("      Error:   ", error.message);
        }
    }
}
}

runTests().catch(err => {
    console.error("❌ A top-level error occurred:", err);
    process.exit(1);
});`;

    // Returns a structured object containing all extracted and generated data
    return {
        challengeTitle,
        codeTemplate,
        htmlTemplate,
        testRunnerTemplate,
        testMarkdown,
        readmeTemplate
    };
}

// Ensures the target directory exists and triggers individual file writes.
async function buildChallengeFiles(challengeData) {
    const {challengeTitle, codeTemplate, htmlTemplate, testRunnerTemplate, testMarkdown, readmeTemplate} = challengeData;
    const folderName = `Challenge-${challengeTitle}`;

    await fs.mkdir(folderName, {recursive: true});

    await writeFileSafely(`${folderName}/script.js`, codeTemplate);
    await writeFileSafely(`${folderName}/index.html`, htmlTemplate);
    await writeFileSafely(`${folderName}/test-runner.js`, testRunnerTemplate);
    await writeFileSafely(`${folderName}/tests.md`, testMarkdown);
    await writeFileSafely(`${folderName}/README.md`, readmeTemplate);
}

// Checks for file existence using fs.access.
// Only writes the file if the access check throws an error (meaning file is missing).
async function writeFileSafely(filePath, content) {
    try {
        // If this succeeds, the file is already there
        await fs.access(filePath);
        console.log(`- Skipping ${filePath} (already exists)`);
    } catch (error) {
        // If access fails, it's safe to create the new file
        await fs.writeFile(filePath, content);
    }
}

// Fetches the directory listing from GitHub API and extracts all raw file URLs.
async function fetchAllUrls() {
    const apiUrl = "https://api.github.com/repos/freeCodeCamp/freeCodeCamp/contents/curriculum/challenges/english/blocks/daily-coding-challenges-javascript/";

    try {
        let response = await fetch(apiUrl);
        let files = await response.json();

        // Filter to only include markdown files and grab their raw download links
        return files
            .filter(file => file.name.endsWith('.md'))
            .map(file => {
                const {download_url} = file;
                return download_url;
            });
    } catch (error) {
        console.error("❌ Failed to fetch the challenge list.");
        return [];
    }
}

// Executes the main process
run().catch(err => {
    console.error("❌ A top-level error occurred:", err);
    process.exit(1);
});