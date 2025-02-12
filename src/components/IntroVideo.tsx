
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const IntroVideo = () => {
  const [showIntro, setShowIntro] = useState(true);

  if (!showIntro) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-2xl mx-auto p-8">
        <img
          src="/lovable-uploads/41363775-1017-4a90-a96c-8fb185b8d94f.png"
          alt="Le Stock de Marie"
          className="w-full h-auto mb-8"
        />
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowIntro(false)}
            className="flex items-center gap-2"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
