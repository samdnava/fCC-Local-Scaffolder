const fs = require('node:fs').promises;

async function getChallengeData() {

    // Safety check for missing URL
    if (!process.argv[2]) {
        console.log("\nPlease provide a freeCodeCamp URL like such:\nhttps://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/refs/heads/main/curriculum/challenges/english/blocks/daily-coding-challenges-javascript/challengeId.md\nFind all challenges and their URLs here:\nhttps://github.com/freeCodeCamp/freeCodeCamp/tree/main/curriculum/challenges/english/blocks/daily-coding-challenges-javascript\n");

        return;
    }

    // Fetching the data
    let response = await fetch(process.argv[2]);
    // Putting data into text
    let markdownText = await response.text();

    // Splitting into sections
    let sections = markdownText.split("# --");

    // Cleaning the starter code
    let starterCode = sections[4].split("```js\n")[1].split("\n```")[0];

    // Cleaning the test markdown
    let testsMarkdown = sections[2].split("hints--\n\n");

    // Creating the HTML Template
    let htmlTemplate =
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Challenge 1</title>
</head>
<body>
<h1>Challenge 1: Vowel Balance</h1>
<script src="script.js"></script>
</body>
</html>`
    ;

    // Creating the Test Runner Template
    let testRunnerTemplate =
        `const fs = require('fs').promises;

async function runTests() {
    let userCode = await fs.readFile("script.js", "utf8");
    let testMarkdown = await fs.readFile("tests.md", "utf8");

    let dirtyTests = testMarkdown.split("\`\`\`js");
    let cleanTests = [];

    for (let i = 1; i < dirtyTests.length; i++) {
        cleanTests.push(dirtyTests[i].split("\`\`\`")[0]);
    }

    for (let i = 0; i < cleanTests.length; i++) {
        try {
            eval(userCode + "\\n" + cleanTests[i]);
            console.log("✅ Passed Test: \\n" + cleanTests[i]);
        } catch (error) {
            console.log("❌ Failed Test: \\n" + cleanTests[i]);
        }
    }
}

runTests();`
    ;

    // Building the directory
    await fs.mkdir("Challenge-1", {recursive: true});

    // Building files
    let fileExists;
    // Building script.js
    try { // Check if file already exists
        await fs.access("Challenge-1/script.js");
        fileExists = true; // It succeeded, so the file is there!
    } catch (error) {
        fileExists = false; // It threw an error, meaning the file is missing.
    }
    if (!fileExists) { // if file does not exist already then write it.
        await fs.writeFile("Challenge-1/script.js", starterCode);
    }
    // Building index.html
    try {
        await fs.access("Challenge-1/index.html");
        fileExists = true;
    } catch (error) {
        fileExists = false;
    }
    if (!fileExists) {
        await fs.writeFile("Challenge-1/index.html", htmlTemplate);
    }

    // Building test.md
    try {
        await fs.access("Challenge-1/tests.md");
        fileExists = true;
    } catch (error) {
        fileExists = false;
    }
    if (!fileExists) {
        await fs.writeFile("Challenge-1/tests.md", testsMarkdown);
    }

    // Building test-runner.js
    try {
        await fs.access("Challenge-1/test-runner.js");
        fileExists = true;
    } catch (error) {
        fileExists = false;
    }
    if (!fileExists) {
        await fs.writeFile("Challenge-1/test-runner.js", testRunnerTemplate);
    }

    console.log("Workspace built successfully!");
}

getChallengeData();