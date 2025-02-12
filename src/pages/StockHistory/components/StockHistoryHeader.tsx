import React from "react";

export function StockHistoryHeader() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historique des mouvements de stock
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Consultez l'historique complet des entrées et sorties de stock
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}
