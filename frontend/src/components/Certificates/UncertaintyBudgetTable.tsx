import React from 'react';

interface UncertaintyBudget {
  repeatability: number;
  resolution: number;
  standardUncertainty: number;
  gasTemperatureEffect: number;
  gasFlowRateEffect: number;
  combinedUncertainty: number;
  expandedUncertainty: number;
  coverageFactor: number;
}

interface UncertaintyBudgetTableProps {
  uncertaintyBudget: UncertaintyBudget;
  resolution: number;
  measurementType?: 'before' | 'after';
  className?: string;
}

const UncertaintyBudgetTable: React.FC<UncertaintyBudgetTableProps> = ({
  uncertaintyBudget,
  resolution,
  measurementType = 'before',
  className = ""
}) => {
  // Define colors and labels based on measurement type
  const typeConfig = {
    before: {
      borderColor: 'border-orange-200',
      bgColor: 'bg-orange-50',
      headerBgColor: 'bg-orange-200',
      textColor: 'text-orange-800',
      tableBorder: 'border-orange-300',
      label: 'Before Adjustment'
    },
    after: {
      borderColor: 'border-green-200', 
      bgColor: 'bg-green-50',
      headerBgColor: 'bg-green-200',
      textColor: 'text-green-800',
      tableBorder: 'border-green-300',
      label: 'After Adjustment'
    }
  };

  const config = typeConfig[measurementType];

  return (
    <div className={`p-4 ${config.borderColor} rounded-lg ${config.bgColor} ${className}`}>
      <h4 className={`text-md font-medium ${config.textColor} mb-3`}>
        <strong>Uncertainty Budget Table ({config.label})</strong>
      </h4>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`w-full text-xs border-collapse border ${config.tableBorder}`}>
          <thead>
            <tr className={config.headerBgColor}>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Symbol (ui)</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Type</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Source of uncertainty</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Value</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Probability distribution</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Divisor</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Ci</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Ui (Units)</th>
              <th className={`border ${config.tableBorder} px-2 py-1 text-left`}>Vi or Veff</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td className={`border ${config.tableBorder} px-2 py-1`}>δG_Rep</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>A</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>Repeatability of UUC</td>
              <td className={`border ${config.tableBorder} px-2 py-1 text-blue-600 font-mono`}>
                {uncertaintyBudget.repeatability.toFixed(6)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>normal</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>1.0</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>1.0</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-mono`}>
                {uncertaintyBudget.repeatability.toFixed(4)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>2</td>
            </tr>
            <tr>
              <td className={`border ${config.tableBorder} px-2 py-1`}>δG_Res</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>B</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>Resolution of UUC</td>
              <td className={`border ${config.tableBorder} px-2 py-1 text-blue-600 font-mono`}>
                {resolution.toFixed(2)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>rectangular</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>SQRT(3)</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>1.0</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-mono`}>
                {uncertaintyBudget.resolution.toFixed(3)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>∞</td>
            </tr>
            <tr>
              <td className={`border ${config.tableBorder} px-2 py-1`}>δG_Cal</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>B</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>Uncertainty of standard</td>
              <td className={`border ${config.tableBorder} px-2 py-1 text-green-600 font-mono`}>
                {uncertaintyBudget.standardUncertainty.toFixed(2)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>normal</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>2</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>1.0</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-mono`}>
                {(uncertaintyBudget.standardUncertainty / 2).toFixed(3)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>∞</td>
            </tr>
            <tr>
              <td className={`border ${config.tableBorder} px-2 py-1`}>δG_Temp</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>B</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>Gas Temperature Effect</td>
              <td className={`border ${config.tableBorder} px-2 py-1 text-blue-600 font-mono`}>
                {uncertaintyBudget.gasTemperatureEffect.toFixed(1)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>rectangular</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>SQRT(3)</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>1.0</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-mono`}>
                {(uncertaintyBudget.gasTemperatureEffect / Math.sqrt(3)).toFixed(3)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>∞</td>
            </tr>
            <tr>
              <td className={`border ${config.tableBorder} px-2 py-1`}>δG_Flow</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>B</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>Gas Flow rate Effect</td>
              <td className={`border ${config.tableBorder} px-2 py-1 text-blue-600 font-mono`}>
                {uncertaintyBudget.gasFlowRateEffect.toFixed(1)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>rectangular</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>SQRT(3)</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>1.0</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-mono`}>
                {(uncertaintyBudget.gasFlowRateEffect / Math.sqrt(3)).toFixed(3)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>∞</td>
            </tr>
            <tr className="bg-gray-100">
              <td className={`border ${config.tableBorder} px-2 py-1`}>uc</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>-</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-medium`}>Combined standard uncertainty</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}></td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>normal</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}></td>
              <td className={`border ${config.tableBorder} px-2 py-1`}></td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-bold ${config.textColor}`}>
                {uncertaintyBudget.combinedUncertainty.toFixed(3)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>
                {(() => {
                  // Calculate the condition: (uc^4) / ((u_repeatability^4) / 2)
                  const ucPower4 = Math.pow(uncertaintyBudget.combinedUncertainty, 4);
                  const uRepPower4 = Math.pow(uncertaintyBudget.repeatability, 4);
                  const ratio = ucPower4 / (uRepPower4 / 2);
                  
                  // If ratio > 500, show ">500", otherwise show the actual value
                  return ratio > 500 
                    ? ">500" 
                    : ratio.toFixed(0);
                })()}
              </td>
            </tr>
            <tr className={measurementType === 'before' ? 'bg-orange-100' : 'bg-green-100'}>
              <td className={`border ${config.tableBorder} px-2 py-1`}>U</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>-</td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-medium`}>Expanded uncertainty</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}></td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>normal ( k=...)</td>
              <td className={`border ${config.tableBorder} px-2 py-1`}></td>
              <td className={`border ${config.tableBorder} px-2 py-1`}></td>
              <td className={`border ${config.tableBorder} px-2 py-1 font-bold ${measurementType === 'before' ? 'text-orange-900' : 'text-green-900'}`}>
                {uncertaintyBudget.expandedUncertainty.toFixed(3)}
              </td>
              <td className={`border ${config.tableBorder} px-2 py-1`}>{(2).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Coverage Factor Note */}
      <div className={`mt-2 text-xs ${config.textColor}`}>
        <strong>Coverage Factor (k):</strong> {uncertaintyBudget.coverageFactor} 
        <span className="ml-2 text-gray-600">(Confidence level ≈ 95%)</span>
      </div>
    </div>
  );
};

export default UncertaintyBudgetTable;