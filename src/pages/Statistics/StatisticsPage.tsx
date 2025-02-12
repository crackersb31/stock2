import { useNavigate } from "react-router-dom";
import { QuantityDifferenceStats } from "./components/QuantityDifferenceStats";
import { MovementAnalysisStats } from "./components/MovementAnalysisStats";

export function StatisticsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Statistiques
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Visualisez les statistiques de votre stock
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-6">
          <QuantityDifferenceStats />
          <MovementAnalysisStats />
        </div>
      </div>
    </div>
  );
}
