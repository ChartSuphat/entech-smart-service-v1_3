import { AmbientConditions } from '../types/certificate.types';

export const DEFAULT_AMBIENT_CONDITIONS: AmbientConditions = {
  temperature: 25.0,
  humidity: 55.0,
  pressure: 1013.4,
  gasTemperature: 30.5,
  flowRate: 1000,
  gasPressure: 1023.5
};

export const validateAmbientConditions = (conditions: any): conditions is AmbientConditions => {
  return (
    typeof conditions === 'object' &&
    typeof conditions.temperature === 'number' &&
    typeof conditions.humidity === 'number' &&
    typeof conditions.pressure === 'number' &&
    typeof conditions.gasTemperature === 'number' &&
    typeof conditions.flowRate === 'number' &&
    typeof conditions.gasPressure === 'number'
  );
};
