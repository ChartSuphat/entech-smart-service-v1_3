export const calculateCalibrationValues = (data: {
  standardValue: number;
  measurement1: number;
  measurement2: number;
  measurement3: number;
  resolution: number;
  uncertaintyStandard: number;
}) => {
  const measurements = [data.measurement1, data.measurement2, data.measurement3];
  const meanValue = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  const error = data.standardValue - meanValue;
  
  // Calculate repeatability
  const variance = measurements.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / (measurements.length - 1);
  const stdDev = Math.sqrt(variance);
  const repeatability = stdDev / Math.sqrt(2);
  
  // Calculate resolution uncertainty
  const resolutionUncertainty = data.resolution / Math.sqrt(3);
  
  // Calculate combined uncertainty
  const combinedUncertainty = Math.sqrt(
    Math.pow(repeatability, 2) + 
    Math.pow(resolutionUncertainty, 2) + 
    Math.pow(data.uncertaintyStandard, 2)
  );
  
  // Calculate expanded uncertainty (k=2)
  const expandedUncertainty = combinedUncertainty * 2;
  
  return {
    meanValue,
    error,
    repeatability,
    combinedUncertainty,
    expandedUncertainty
  };
};