import { useState, useEffect, useMemo, useRef } from 'react';
import { getGaussianPoints, getTPoints } from '../../utils/mathHelpers';
import { pointsToPath } from '../../utils/svgHelpers';
import { calculateOneSampleTest, summarizeRawSample } from '../../stats/oneSampleTest';
import useTutor from '../../hooks/useTutor';
import DistributionChart from '../distribution/DistributionChart';
import DistributionControls from '../distribution/DistributionControls';

const NormalDistributionVisual = ({ highlight = null, label = "Distribution", type = "z", darkMode, onTutorUpdate, onStatsUpdate, powerViewConfig = null }) => {
  const [val, setVal] = useState(0);
  const [alpha, setAlpha] = useState(powerViewConfig?.alpha ?? 0.05);
  const [tails, setTails] = useState(powerViewConfig?.tails ?? 2);
  const [showPopulation, setShowPopulation] = useState(powerViewConfig?.showPopulation ?? false);
  const [visualMode, setVisualMode] = useState(powerViewConfig?.visualMode || 'p-value'); // 'p-value' or 'power'
  const [showPModal, setShowPModal] = useState(false);
  const [showPowerLabels, setShowPowerLabels] = useState(powerViewConfig?.showPowerLabels ?? true);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [calcMode, setCalcMode] = useState(powerViewConfig?.calcMode ?? false);
  const [calcData, setCalcData] = useState(() => ({ xBar: 105, mu: 100, sigma: 15, n: 30, ...(powerViewConfig?.calcData || {}) }));
  const [h1Direction, setH1Direction] = useState(powerViewConfig?.h1Direction || 'greater'); // 'greater' or 'less'
  const [precision, setPrecision] = useState(2);
  const [showCI, setShowCI] = useState(false);
  const [altH1Dir, setAltH1Dir] = useState(powerViewConfig?.h1Direction || 'greater'); // For two-tailed power view
  const [showBothH1, setShowBothH1] = useState(powerViewConfig?.showBothH1 ?? false);
  const [targetEffect, setTargetEffect] = useState(powerViewConfig?.targetEffect ?? 0.5); // Hypothesized Cohen's d for H1
  const [df, setDf] = useState(powerViewConfig?.df ?? 29);
  const [ciType, setCiType] = useState('two-sided'); // 'two-sided' or 'one-sided'
  const [dataInputMode, setDataInputMode] = useState('summary'); // 'summary' or 'raw'
  const [rawData, setRawData] = useState("");

  // Sync df with n when in t-test mode and calculator is active
  useEffect(() => {
    if (type === 't' && calcMode) {
      const newDf = Math.max(1, calcData.n - 1);
      if (df !== newDf) setDf(newDf);
    }
  }, [calcData.n, type, calcMode, df]);
  const [showTailGap, setShowTailGap] = useState(false);
  const [isHovering, setIsHovering] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);
  const isPowerCompactPreset = powerViewConfig?.uiPreset === 'power_compact';
  const powerMeta = powerViewConfig?.powerMeta || null;

  useEffect(() => {
    if (!powerViewConfig) return;

    if (powerViewConfig.visualMode) setVisualMode(powerViewConfig.visualMode);
    if (typeof powerViewConfig.alpha === 'number') setAlpha(powerViewConfig.alpha);
    if (typeof powerViewConfig.tails === 'number') setTails(powerViewConfig.tails);
    if (typeof powerViewConfig.showPopulation === 'boolean') setShowPopulation(powerViewConfig.showPopulation);
    if (typeof powerViewConfig.showPowerLabels === 'boolean') setShowPowerLabels(powerViewConfig.showPowerLabels);
    if (typeof powerViewConfig.targetEffect === 'number') setTargetEffect(powerViewConfig.targetEffect);
    if (typeof powerViewConfig.calcMode === 'boolean') setCalcMode(powerViewConfig.calcMode);
    if (typeof powerViewConfig.showBothH1 === 'boolean') setShowBothH1(powerViewConfig.showBothH1);
    if (typeof powerViewConfig.h1Direction === 'string') {
      setH1Direction(powerViewConfig.h1Direction);
      setAltH1Dir(powerViewConfig.h1Direction);
    }
    if (typeof powerViewConfig.df === 'number') setDf(powerViewConfig.df);
    if (typeof powerViewConfig.val === 'number') setVal(powerViewConfig.val);
    if (powerViewConfig.calcData) {
      setCalcData(prev => ({ ...prev, ...powerViewConfig.calcData }));
    }
  }, [powerViewConfig]);

  useEffect(() => {
    if (!isPowerCompactPreset) return;
    setVisualMode('power');
    setShowPModal(false);
  }, [isPowerCompactPreset]);

  // --- REORGANIZED CALCULATIONS ---

  const testResult = calculateOneSampleTest({
    alpha,
    ciType,
    df,
    direction: h1Direction,
    mean: calcData.xBar,
    n: calcData.n,
    nullMean: calcData.mu,
    spread: calcData.sigma,
    statistic: val,
    tails,
    type,
  });
  const {
    criticalValue,
    delta,
    effectSize: cohenD,
    isSignificant,
    pValue: pTail,
    standardError: stdError,
  } = testResult;
  const { lower: ciLower, upper: ciUpper } = testResult.confidenceInterval;

  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        xBar: calcData.xBar,
        "x̄": calcData.xBar,
        mu: calcData.mu,
        "μ": calcData.mu,
        n: calcData.n,
        sigma: calcData.sigma,
        "σ": calcData.sigma,
        s: calcData.sigma,
        df: df,
        se: stdError,
        "SE": stdError,
        "SEz": stdError,
        "SEt": stdError,
        z: val,
        t: val,
        val,
        p: pTail,
        isSignificant,
        crit: criticalValue
      });
    }
  }, [calcData, stdError, val, pTail, isSignificant, criticalValue, df, onStatsUpdate]);

  const parseRawData = (text) => {
    const summary = summarizeRawSample(text, precision);
    if (!summary) return;
    setCalcData(prev => ({
      ...prev,
      n: summary.n,
      xBar: summary.mean,
      sigma: summary.standardDeviation,
    }));
  };

  const reportStatistic = type === 't'
    ? `t(${Number.isInteger(df) ? df : df.toFixed(2)})`
    : 'z';
  const reportSpread = type === 't' ? `s=${calcData.sigma}` : `σ=${calcData.sigma}`;
  const reportString = `One-sample ${type === 't' ? 't' : 'z'}-test, ${reportStatistic} = ${val.toFixed(precision)}, p = ${pTail < 0.001 ? '< .001' : pTail.toFixed(precision === 2 ? 3 : 4)}, α = ${alpha}, ${isSignificant ? 'reject H₀' : 'fail to reject H₀'}. (x̄=${calcData.xBar}, μ₀=${calcData.mu}, n=${calcData.n}, ${reportSpread})`;

  const stdDev = 35;
  const mean = 150;
  const plotAlpha = isPowerCompactPreset && typeof powerViewConfig?.alpha === 'number' ? powerViewConfig.alpha : alpha;
  const plotTails = isPowerCompactPreset && typeof powerViewConfig?.tails === 'number' ? powerViewConfig.tails : tails;
  const plotDirection = isPowerCompactPreset && typeof powerViewConfig?.h1Direction === 'string' ? powerViewConfig.h1Direction : h1Direction;
  const plotShowPopulation = showPopulation;
  const plotShowBothH1 = isPowerCompactPreset && typeof powerViewConfig?.showBothH1 === 'boolean' ? powerViewConfig.showBothH1 : showBothH1;
  const plotEffectSize = isPowerCompactPreset && Number.isFinite(powerMeta?.effectSize) ? Math.abs(Number(powerMeta.effectSize)) : targetEffect;
  const plotSampleSize = isPowerCompactPreset && Number.isFinite(powerMeta?.sampleSize) ? Math.max(2, Number(powerMeta.sampleSize)) : calcData.n;
  const plotNoncentrality = isPowerCompactPreset && Number.isFinite(powerMeta?.noncentrality)
    ? Math.abs(Number(powerMeta.noncentrality))
    : plotEffectSize * Math.sqrt(plotSampleSize);
  const plotCriticalMagnitude = isPowerCompactPreset && Number.isFinite(powerMeta?.criticalValue)
    ? Math.abs(Number(powerMeta.criticalValue))
    : Math.abs(criticalValue);
  const plotCriticalValue = plotTails === 2
    ? plotCriticalMagnitude
    : (plotDirection === 'greater' ? plotCriticalMagnitude : -plotCriticalMagnitude);
  const plotCalcData = isPowerCompactPreset
    ? { ...calcData, ...(powerViewConfig?.calcData || {}), n: plotSampleSize }
    : calcData;
  const plotVisualMode = isPowerCompactPreset ? 'power' : visualMode;
  const h1Sign = plotTails === 1
    ? (plotDirection === 'greater' ? 1 : -1)
    : (isPowerCompactPreset ? 1 : (altH1Dir === 'greater' ? 1 : -1));
  const altMeanZ = h1Sign * plotNoncentrality;
  const altDistributionCenter = mean + altMeanZ * stdDev;

  // --- HOOKS ---

  const tutorState = useMemo(() => ({
    n: calcData.n,
    alpha,
    tails,
    direction: h1Direction,
    val,
    p: pTail,
    isSignificant,
    targetEffect,
    calcMode,
    xBar: calcData.xBar,
    mu: calcData.mu,
    df,
    showCI,
    ciLower,
    ciUpper,
    crit: Math.abs(criticalValue).toFixed(3)
  }), [calcData, alpha, tails, h1Direction, val, pTail, isSignificant, targetEffect, calcMode, df, criticalValue, showCI, ciLower, ciUpper]);

  const tutor = useTutor(type === 't' ? 't_test' : 'z_test', tutorState);

  useEffect(() => {
    if (onTutorUpdate && tutor.activeScript) {
      onTutorUpdate(tutor.activeScript);
    }
  }, [tutor.activeScript, onTutorUpdate]);

  useEffect(() => {
    if (calcMode) {
      const seCalc = calcData.sigma / Math.sqrt(calcData.n);
      const computedZ = (calcData.xBar - calcData.mu) / seCalc;
      setVal(parseFloat(computedZ.toFixed(precision)));
      const deltaCalc = calcData.xBar - calcData.mu;
      const dCalc = Math.abs(deltaCalc / calcData.sigma);
      setTargetEffect(Math.min(1.2, parseFloat(dCalc.toFixed(2))));
    }
  }, [calcMode, calcData, precision]);

  useEffect(() => {
    if (highlight === 't_score' || highlight === 'z_score') setVal(2.2);
  }, [highlight]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    let relativeX = svgP.x;

    // Clamp to statistical display range (-4.5 to 4.5 SD)
    const minX = mean - 4.5 * stdDev;
    const maxX = mean + 4.5 * stdDev;
    relativeX = Math.max(minX, Math.min(maxX, relativeX));

    const newVal = (relativeX - mean) / stdDev;

    if (calcMode) {
      const seCalc = calcData.sigma / Math.sqrt(calcData.n);
      const newXBar = newVal * seCalc + calcData.mu;

      // Update calcData with rounded value for the calculator logic
      setCalcData(prev => ({ ...prev, xBar: parseFloat(newXBar.toFixed(precision)) }));
      // Keep val high-precision for smooth marker following
      setVal(newVal);

      const dCalc = Math.abs((newXBar - calcData.mu) / calcData.sigma);
      setTargetEffect(Math.min(1.2, parseFloat(dCalc.toFixed(2))));
    } else {
      setVal(newVal);
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
  };

  const points = useMemo(() => {
    if (type === 't') return getTPoints(mean, stdDev, df, 120, 300);
    return getGaussianPoints(mean, stdDev, 120, 300);
  }, [mean, stdDev, df, type]);

  const zPoints = useMemo(() => getGaussianPoints(mean, stdDev, 120, 300), [mean, stdDev]);

  const altPoints = useMemo(() => {
    if (type === 't') return getTPoints(mean + altMeanZ * stdDev, stdDev, df, 120, 300);
    return getGaussianPoints(mean + altMeanZ * stdDev, stdDev, 120, 300);
  }, [altMeanZ, mean, stdDev, df, type]);

  const altPointsNeg = useMemo(() => {
    if (type === 't') return getTPoints(mean - plotNoncentrality * stdDev, stdDev, df, 120, 300);
    return getGaussianPoints(mean - plotNoncentrality * stdDev, stdDev, 120, 300);
  }, [plotNoncentrality, mean, stdDev, df, type]);

  const pathData = pointsToPath(points);
  const zPathData = pointsToPath(zPoints);
  const altPathData = pointsToPath(altPoints);
  const altPathDataNeg = pointsToPath(altPointsNeg);

  const getOpacity = (part) => {
    if (!highlight) {
      if (isHovering && isHovering !== part) return 0.3;
      return 1;
    }
    if (highlight === 'all') return 1;
    if (highlight === part || (highlight === 't_score' && part === 'val') || (highlight === 'z_score' && part === 'val')) return 1;
    return 0.2;
  };

  return (
    <div className="w-full flex">
      <div className={`flex-1 flex flex-col items-center transition-all duration-500`}>
        <DistributionChart
          {...{
            altDistributionCenter,
            altH1Dir,
            altMeanZ,
            altPathData,
            altPathDataNeg,
            altPoints,
            altPointsNeg,
            calcMode,
            darkMode,
            df,
            getOpacity,
            h1Sign,
            h1Direction,
            handlePointerDown,
            handlePointerMove,
            handlePointerUp,
            hoveredRegion,
            isDragging,
            isPowerCompactPreset,
            isSignificant,
            label,
            mean,
            pTail,
            pathData,
            plotAlpha,
            plotCalcData,
            plotCriticalValue,
            plotDirection,
            plotEffectSize,
            plotNoncentrality,
            plotSampleSize,
            plotShowBothH1,
            plotShowPopulation,
            plotTails,
            plotVisualMode,
            points,
            powerMeta,
            setAltH1Dir,
            setHoveredRegion,
            setShowBothH1,
            setShowPModal,
            setShowPopulation,
            setShowPowerLabels,
            setTargetEffect,
            setVisualMode,
            showBothH1,
            showPModal,
            showPopulation,
            showPowerLabels,
            showTailGap,
            stdDev,
            svgRef,
            tails,
            targetEffect,
            type,
            val,
            visualMode,
            zPathData,
          }}
        />

        {!isPowerCompactPreset && (
          <DistributionControls
            {...{
              alpha,
              calcData,
              calcMode,
              ciLower,
              ciType,
              ciUpper,
              cohenD,
              darkMode,
              dataInputMode,
              delta,
              df,
              h1Direction,
              isSignificant,
              parseRawData,
              precision,
              rawData,
              reportString,
              setAlpha,
              setCalcData,
              setCalcMode,
              setCiType,
              setDataInputMode,
              setDf,
              setH1Direction,
              setPrecision,
              setRawData,
              setShowCI,
              setShowTailGap,
              setTails,
              setVal,
              showCI,
              showTailGap,
              stdError,
              tails,
              type,
              val,
            }}
          />
        )}
      </div>
    </div>
  );
};

// B. Independent Samples T-Test Visual

export default NormalDistributionVisual;
