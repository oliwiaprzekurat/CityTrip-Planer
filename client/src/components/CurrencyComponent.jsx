import React from "react";
import './style/style.css';

const CurrencyComponent = ({ currencyData }) => {
  if (!currencyData) return null;

  const isPln = currencyData.code === 'PLN';

  return (
    <div className={`p-4 rounded-xl shadow-sm border ${isPln ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
      <h3 className={`text-lg font-semibold flex items-center gap-2 ${isPln ? 'text-blue-800' : 'text-green-800'}`}>
        {isPln ? 'Waluta Lokalna' : 'Finanse (NBP)'}
      </h3>
      
      <div className="mt-2">
        {isPln ? (
          <p className="text-gray-700 font-medium">W tym kraju zapłacisz w <b>PLN</b>.</p>
        ) : (
          <>
            <p className="text-gray-600 text-sm italic mb-1">Przelicznik dla 100 PLN:</p>
            <p className="text-3xl font-bold text-green-700">
              {(100 / currencyData.mid_rate).toFixed(2)} {currencyData.code}
            </p>
            <p className="text-xs text-green-600 mt-2">
              Kurs średni: 1 {currencyData.code} = {currencyData.mid_rate} PLN
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CurrencyComponent;