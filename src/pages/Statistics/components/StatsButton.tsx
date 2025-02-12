import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";

interface StatsButtonProps {
  title: string;
  description: string;
  onClick: () => void;
}

export function StatsButton({ title, description, onClick }: StatsButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full flex items-start justify-between p-4 h-auto"
      onClick={onClick}
    >
      <div className="text-left">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <BarChart className="w-5 h-5 text-gray-400" />
    </Button>
  );
}
