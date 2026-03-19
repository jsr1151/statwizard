import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { solveOneSampleZPower } from '../src/power/solvers/oneSampleZ.js';
import { solveOneSampleTPower } from '../src/power/solvers/oneSampleT.js';
import { solvePairedTPower } from '../src/power/solvers/pairedT.js';
import { solveIndependentTPower } from '../src/power/solvers/independentT.js';
import { solveOneWayAnovaPower } from '../src/power/solvers/oneWayAnova.js';
import { solveAncovaPower } from '../src/power/solvers/ancova.js';
import { buildPowerCurveModel } from '../src/power/curves.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixtureDirectory = path.resolve(__dirname, '../src/power/fixtures');

const SOLVER_BY_TEST_ID = {
    one_sample_z: solveOneSampleZPower,
    one_sample_t: solveOneSampleTPower,
    paired_t: solvePairedTPower,
    independent_t: solveIndependentTPower,
    one_way_anova: solveOneWayAnovaPower,
    ancova: solveAncovaPower,
};

const REQUIRED_FORMAT_VERSION = 2;

const compareWithTolerance = (actual, expected, tolerance) => {
    if (typeof tolerance === 'number') {
        return Math.abs(actual - expected) <= tolerance;
    }

    return actual === expected;
};

const getNumericTolerance = (tolerances, field, fallback = 0.000001) =>
    typeof tolerances?.[field] === 'number' ? tolerances[field] : fallback;

const pushMirrorFailure = ({
    failures,
    fileName,
    caseId,
    sourceLabel,
    field,
    actual,
    expected,
    tolerance,
}) => {
    failures.push(
        `${fileName} -> ${caseId}: ${sourceLabel}.${field} expected ${expected} but got ${actual}` +
        (typeof tolerance === 'number' ? ` (tol ${tolerance})` : '')
    );
};

const validateFixtureFile = ({ fileName, content, failures }) => {
    if (content?.formatVersion !== REQUIRED_FORMAT_VERSION) {
        failures.push(`${fileName}: expected formatVersion ${REQUIRED_FORMAT_VERSION}.`);
    }

    if (!content?.parityTarget?.tool || !content?.parityTarget?.version) {
        failures.push(`${fileName}: parityTarget.tool and parityTarget.version are required.`);
    }

    if (!Array.isArray(content?.cases) || content.cases.length === 0) {
        failures.push(`${fileName}: cases must be a non-empty array.`);
        return;
    }

    const caseIds = new Set();
    for (const fixtureCase of content.cases) {
        if (!fixtureCase?.id) {
            failures.push(`${fileName}: every case must have an id.`);
            continue;
        }

        if (caseIds.has(fixtureCase.id)) {
            failures.push(`${fileName}: duplicate case id "${fixtureCase.id}".`);
        }
        caseIds.add(fixtureCase.id);

        if (!fixtureCase?.inputs?.mode) {
            failures.push(`${fileName} -> ${fixtureCase.id}: inputs.mode is required.`);
        }

        if (!fixtureCase?.expected || Object.keys(fixtureCase.expected).length === 0) {
            failures.push(`${fileName} -> ${fixtureCase.id}: expected outputs are required.`);
        }
    }
};

const validateCurveConsistency = ({
    solver,
    testId,
    fileName,
    caseId,
    result,
    tolerances,
    failures,
}) => {
    const testConfig = {
        id: testId,
        power: {
            status: 'available',
            solver,
        },
    };
    const actualPowerTolerance = getNumericTolerance(tolerances, 'actualPower');
    const effectSizeTolerance = getNumericTolerance(tolerances, 'effectSize', 0.0001);

    for (const curveType of ['sample_size', 'effect_size']) {
        const curveModel = buildPowerCurveModel({
            testConfig,
            result,
            curveType,
        });

        if (!curveModel?.ok || !Array.isArray(curveModel.points) || curveModel.points.length < 2) {
            failures.push(`${fileName} -> ${caseId}: ${curveType} curve model did not build correctly.`);
            continue;
        }

        const expectedX = curveType === 'sample_size' ? result.sampleSize : result.effectSize;
        const xTolerance = curveType === 'sample_size' ? 0 : effectSizeTolerance;

        if (!compareWithTolerance(curveModel.currentPoint?.x, expectedX, xTolerance)) {
            pushMirrorFailure({
                failures,
                fileName,
                caseId,
                sourceLabel: `${curveType} curve currentPoint`,
                field: 'x',
                actual: curveModel.currentPoint?.x,
                expected: expectedX,
                tolerance: xTolerance,
            });
        }

        if (!compareWithTolerance(curveModel.currentPoint?.power, result.actualPower, actualPowerTolerance)) {
            pushMirrorFailure({
                failures,
                fileName,
                caseId,
                sourceLabel: `${curveType} curve currentPoint`,
                field: 'power',
                actual: curveModel.currentPoint?.power,
                expected: result.actualPower,
                tolerance: actualPowerTolerance,
            });
        }

        const xValues = curveModel.points.map((point) => point.x);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        if (!(expectedX >= minX - xTolerance && expectedX <= maxX + xTolerance)) {
            failures.push(
                `${fileName} -> ${caseId}: ${curveType} curve range [${minX}, ${maxX}] does not contain the active design x = ${expectedX}.`
            );
        }
    }
};

const validateVisualizerConsistency = ({
    fileName,
    caseId,
    result,
    tolerances,
    failures,
}) => {
    const visualizer = result?.visualizer;
    const config = visualizer?.config;
    const powerMeta = config?.powerMeta;

    if (!visualizer || !config || !powerMeta) {
        failures.push(`${fileName} -> ${caseId}: result visualizer metadata is missing.`);
        return;
    }

    const checkMirror = (sourceLabel, sourceValue, resultField, tolerance) => {
        if (!compareWithTolerance(sourceValue, result[resultField], tolerance)) {
            pushMirrorFailure({
                failures,
                fileName,
                caseId,
                sourceLabel,
                field: resultField,
                actual: sourceValue,
                expected: result[resultField],
                tolerance,
            });
        }
    };

    checkMirror('visualizer.config', config.alpha, 'alpha');
    checkMirror('visualizer.powerMeta', powerMeta.alpha, 'alpha');
    checkMirror('visualizer.powerMeta', powerMeta.actualPower, 'actualPower', getNumericTolerance(tolerances, 'actualPower'));
    checkMirror('visualizer.powerMeta', powerMeta.criticalValue, 'criticalValue', getNumericTolerance(tolerances, 'criticalValue'));
    checkMirror('visualizer.powerMeta', powerMeta.noncentrality, 'noncentrality', getNumericTolerance(tolerances, 'noncentrality'));
    checkMirror('visualizer.powerMeta', powerMeta.effectSize, 'effectSize', getNumericTolerance(tolerances, 'effectSize', 0.0001));
    checkMirror('visualizer.powerMeta', powerMeta.sampleSize, 'sampleSize');

    if (result.tails != null) {
        checkMirror('visualizer.config', config.tails, 'tails');
        checkMirror('visualizer.powerMeta', powerMeta.tails, 'tails');
        if (config.h1Direction !== result.direction) {
            failures.push(`${fileName} -> ${caseId}: visualizer.config.h1Direction expected ${result.direction} but got ${config.h1Direction}.`);
        }
        if (powerMeta.direction !== result.direction) {
            failures.push(`${fileName} -> ${caseId}: visualizer.powerMeta.direction expected ${result.direction} but got ${powerMeta.direction}.`);
        }
    }

    if (result.df != null) {
        checkMirror('visualizer.powerMeta', powerMeta.df, 'df', getNumericTolerance(tolerances, 'df'));
    }

    if (result.group1SampleSize != null) {
        checkMirror('visualizer.powerMeta', powerMeta.group1SampleSize, 'group1SampleSize');
    }

    if (result.group2SampleSize != null) {
        checkMirror('visualizer.powerMeta', powerMeta.group2SampleSize, 'group2SampleSize');
    }

    if (result.groupCount != null) {
        checkMirror('visualizer.config', config.groupCount, 'groupCount');
        checkMirror('visualizer.powerMeta', powerMeta.groupCount, 'groupCount');
    }

    if (result.covariateCount != null) {
        checkMirror('visualizer.powerMeta', powerMeta.covariateCount, 'covariateCount');
    }

    if (result.perGroupSampleSize != null) {
        checkMirror('visualizer.config', config.perGroupSampleSize, 'perGroupSampleSize', getNumericTolerance(tolerances, 'perGroupSampleSize'));
        checkMirror('visualizer.powerMeta', powerMeta.perGroupSampleSize, 'perGroupSampleSize', getNumericTolerance(tolerances, 'perGroupSampleSize'));
    }

    if (result.isPerGroupExact != null) {
        checkMirror('visualizer.config', config.isPerGroupExact, 'isPerGroupExact');
        checkMirror('visualizer.powerMeta', powerMeta.isPerGroupExact, 'isPerGroupExact');
    }

    if (result.numeratorDf != null) {
        checkMirror('visualizer.config', config.numeratorDf, 'numeratorDf', getNumericTolerance(tolerances, 'numeratorDf'));
        checkMirror('visualizer.powerMeta', powerMeta.numeratorDf, 'numeratorDf', getNumericTolerance(tolerances, 'numeratorDf'));
    }

    if (result.denominatorDf != null) {
        checkMirror('visualizer.config', config.denominatorDf, 'denominatorDf', getNumericTolerance(tolerances, 'denominatorDf'));
        checkMirror('visualizer.powerMeta', powerMeta.denominatorDf, 'denominatorDf', getNumericTolerance(tolerances, 'denominatorDf'));
    }
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
        const fileName = path.basename(filePath);

        validateFixtureFile({ fileName, content, failures });

        if (typeof solver !== 'function') {
            failures.push(`${fileName}: no solver registered for test id "${content.testId}".`);
            continue;
        }

        const defaultTolerances = content.defaultTolerances || {};

        for (const fixtureCase of content.cases || []) {
            caseCount += 1;
            const result = solver(fixtureCase.inputs);

            if (!result?.ok) {
                failures.push(`${fileName} -> ${fixtureCase.id}: solver returned an error.`);
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
                        `${fileName} -> ${fixtureCase.id}: ${field} expected ${expected} but got ${actual}` +
                        (typeof tolerances[field] === 'number' ? ` (tol ${tolerances[field]})` : '')
                    );
                }
            }

            validateVisualizerConsistency({
                fileName,
                caseId: fixtureCase.id,
                result,
                tolerances,
                failures,
            });

            validateCurveConsistency({
                solver,
                testId: content.testId,
                fileName,
                caseId: fixtureCase.id,
                result,
                tolerances,
                failures,
            });
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
