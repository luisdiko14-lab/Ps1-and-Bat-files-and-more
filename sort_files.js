const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("=========================================");
    console.log("     Interactive Workspace Sorter (JS)   ");
    console.log("=========================================\n");

    const currentDir = process.cwd();
    const files = fs.readdirSync(currentDir);
    const scriptName = path.basename(__filename);

    // 1. Handle .ps1 files automatically
    const ps1Files = files.filter(f => f.endsWith('.ps1') && fs.statSync(f).isFile());
    if (ps1Files.length > 0) {
        const targetDir = path.join('files', 'more_powershell_files');
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`Found ${ps1Files.length} PowerShell (.ps1) file(s).`);
        for (const file of ps1Files) {
            const dest = path.join(targetDir, file);
            fs.renameSync(file, dest);
            console.log(`⚡ Moved ${file} -> files/more_powershell_files/`);
        }
        console.log();
    } else {
        console.log("No .ps1 files found to move.\n");
    }

    // 2. Handle .py files interactively
    const pyFiles = files.filter(f => f.endsWith('.py') && fs.statSync(f).isFile() && f !== scriptName);
    if (pyFiles.length > 0) {
        console.log(`Found ${pyFiles.length} Python (.py) file(s).`);
        const pyDest = (await question("Enter destination directory for .py files (or type 'skip'): ")).trim();
        if (pyDest.toLowerCase() !== 'skip' && pyDest !== '') {
            fs.mkdirSync(pyDest, { recursive: true });
            for (const file of pyFiles) {
                const dest = path.join(pyDest, file);
                fs.renameSync(file, dest);
                console.log(`🐍 Moved ${file} -> ${pyDest}/`);
            }
        } else {
            console.log("Skipped .py files.");
        }
        console.log();
    } else {
        console.log("No .py files found.\n");
    }

    // 3. Handle .js files interactively
    const jsFiles = files.filter(f => f.endsWith('.js') && fs.statSync(f).isFile() && f !== scriptName);
    if (jsFiles.length > 0) {
        console.log(`Found ${jsFiles.length} JavaScript (.js) file(s).`);
        const jsDest = (await question("Enter destination directory for .js files (or type 'skip'): ")).trim();
        if (jsDest.toLowerCase() !== 'skip' && jsDest !== '') {
            fs.mkdirSync(jsDest, { recursive: true });
            for (const file of jsFiles) {
                const dest = path.join(jsDest, file);
                fs.renameSync(file, dest);
                console.log(`📜 Moved ${file} -> ${jsDest}/`);
            }
        } else {
            console.log("Skipped .js files.");
        }
        console.log();
    } else {
        console.log("No .js files found.\n");
    }

    console.log("=========================================");
    console.log("✨ Sorting process complete! ✨");
    console.log("=========================================");
    rl.close();
}

main();