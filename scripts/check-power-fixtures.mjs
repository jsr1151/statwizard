import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { solveOneSampleZPower } from '../src/power/solvers/oneSampleZ.js';
import { solveOneSampleTPower } from '../src/power/solvers/oneSampleT.js';
import { solvePairedTPower } from '../src/power/solvers/pairedT.js';
import { solveIndependentTPower } from '../src/power/solvers/independentT.js';
import { solveOneWayAnovaPower } from '../src/power/solvers/oneWayAnova.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixtureDirectory = path.resolve(__dirname, '../src/power/fixtures');

const SOLVER_BY_TEST_ID = {
    one_sample_z: solveOneSampleZPower,
    one_sample_t: solveOneSampleTPower,
    paired_t: solvePairedTPower,
    independent_t: solveIndependentTPower,
    one_way_anova: solveOneWayAnovaPower,
};

const compareWithTolerance = (actual, expected, tolerance) => {
    if (typeof tolerance === 'number') {
        return Math.abs(actual - expected) <= tolerance;
    }

    return actual === expected;
};

const loadFixtureFiles = async () => {
    const entries = await fs.readdir(fixtureDirectory, { withFileTypes: true });
    const jsonFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => path.join(fixtureDirectory, entry.name))
        .sort();

    return Promise.all(jsonFiles.map(async (filePath) => ({
        filePath,
        content: JSON.parse(await fs.readFile(filePath, 'utf8')),
    })));
};

const run = async () => {
    const fixtureFiles = await loadFixtureFiles();
    const failures = [];
    let caseCount = 0;

    for (const fixtureFile of fixtureFiles) {
        const { filePath, content } = fixtureFile;
        const solver = SOLVER_BY_TEST_ID[content.testId];

        if (typeof solver !== 'function') {
            failures.push(`${path.basename(filePath)}: no solver registered for test id "${content.testId}".`);
            continue;
        }

        const defaultTolerances = content.defaultTolerances || {};

        for (const fixtureCase of content.cases || []) {
            caseCount += 1;
            const result = solver(fixtureCase.inputs);

            if (!result?.ok) {
                failures.push(`${path.basename(filePath)} -> ${fixtureCase.id}: solver returned an error.`);
                continue;
            }

            const tolerances = {
                ...defaultTolerances,
                ...(fixtureCase.tolerances || {}),
            };

            for (const [field, expected] of Object.entries(fixtureCase.expected || {})) {
                const actual = result[field];
                const passed = compareWithTolerance(actual, expected, tolerances[field]);

                if (!passed) {
                    failures.push(
                        `${path.basename(filePath)} -> ${fixtureCase.id}: ${field} expected ${expected} but got ${actual}` +
                        (typeof tolerances[field] === 'number' ? ` (tol ${tolerances[field]})` : '')
                    );
                }
            }
        }
    }

    if (failures.length > 0) {
        console.error(`Power fixture check failed with ${failures.length} issue(s):`);
        failures.forEach((failure) => console.error(`- ${failure}`));
        process.exit(1);
    }

    console.log(`Power fixture check passed for ${caseCount} case(s).`);
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
