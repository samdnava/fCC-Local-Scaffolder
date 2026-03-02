const fs = require('fs').promises;

async function getChallengeData() {
    // 1. Fetch the data
    let response = await fetch("https://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/refs/heads/main/curriculum/challenges/english/blocks/daily-coding-challenges-javascript/6814d8e1516e86b171929de4.md");
    let markdownText = await response.text();

    // 2. Split into sections
    let sections = markdownText.split("# --");

    // 3. Clean the starter code
    let cleanCode = sections[4].split("```js")[1].split("```")[0];

    // 4. Create the HTML Template
    let htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Challenge 1</title>
</head>
<body>
  <h1>Challenge 1: Vowel Balance</h1>
  <script src="script.js"></script>
</body>
</html>
  `;

    // 5. Build the directory and files
    await fs.mkdir("Challenge-1", {recursive: true});
    await fs.writeFile("Challenge-1/script.js", cleanCode);
    await fs.writeFile("Challenge-1/index.html", htmlTemplate);

    console.log("Workspace built successfully!");
}

getChallengeData();