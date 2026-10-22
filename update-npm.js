/**
 * Node.js script to automatically update all npm packages (local project or global) using bash commands.
 * 
 * Features:
 * - Updates local project packages (via `npm update` or `npm-check-updates`).
 * - Supports updating global packages (`npm update -g`).
 * - Handles errors gracefully and logs output.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function runCommand(command, description) {
    console.log(`
[INFO] ${description}...`);
    console.log(`Running: ${command}`);
    try {
        const output = execSync(command, { stdio: 'inherit' });
        console.log(`[SUCCESS] ${description} completed successfully.`);
        return true;
    } catch (error) {
        console.error(`[ERROR] Failed during: ${description}`);
        console.error(error.message);
        return false;
    }
}

function updateLocalPackages(useNCU = false) {
    console.log('=== Updating Local NPM Packages ===');
    
    if (useNCU) {
        // Using npm-check-updates (ncu) for major/minor updates beyond semver
        try {
            console.log('Checking if npm-check-updates is installed...');
            execSync('ncu --version', { stdio: 'ignore' });
        } catch (e) {
            console.log('npm-check-updates (ncu) not found. Installing globally...');
            runCommand('npm install -g npm-check-updates', 'Installing npm-check-updates');
        }
        
        if (runCommand('ncu -u', 'Upgrading package.json dependencies')) {
            runCommand('npm install', 'Installing updated dependencies');
        }
    } else {
        // Standard npm update respecting package.json semver ranges
        runCommand('npm update', 'Updating local packages via npm update');
    }
}

function updateGlobalPackages() {
    console.log('=== Updating Global NPM Packages ===');
    runCommand('npm update -g', 'Updating global packages');
}

function main() {
    rl.question('Do you want to update (1) Local project packages, (2) Global packages, or (3) Both? [1/2/3]: ', (answer) => {
        const choice = answer.trim();

        if (choice === '1' || choice === '3') {
            rl.question('Use npm-check-updates (ncu) to bypass semver limits in package.json? (y/N): ', (ncuAnswer) => {
                const useNCU = ncuAnswer.trim().toLowerCase() === 'y';
                updateLocalPackages(useNCU);
                
                if (choice === '3') {
                    updateGlobalPackages();
                }
                rl.close();
            });
        } else if (choice === '2') {
            updateGlobalPackages();
            rl.close();
        } else {
            console.log('Invalid choice. Exiting.');
            rl.close();
        }
    });
}

main();
