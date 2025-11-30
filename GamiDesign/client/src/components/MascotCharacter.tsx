import { useState } from "react";
import mascotImage from "@assets/generated_images/transparent_heart_mascot_character.png";

interface MascotCharacterProps {
  pose?: "default" | "celebrate" | "encourage" | "concerned" | "sleep";
  speech?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function MascotCharacter({
  pose = "default",
  speech,
  size = "md",
  className = "",
}: MascotCharacterProps) {
  const [showSpeech, setShowSpeech] = useState(!!speech);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const poseAnimation = {
    default: "animate-float",
    celebrate: "animate-bounce-in",
    encourage: "animate-pulse",
    concerned: "animate-shake",
    sleep: "",
  };

  return (
    <div className={`relative ${className}`} data-testid="mascot-character">
      <div
        className={`${sizeClasses[size]} ${poseAnimation[pose]} cursor-pointer`}
        onClick={() => setShowSpeech(!showSpeech)}
        data-testid={`mascot-${pose}`}
      >
        <img
          src={mascotImage}
          alt="Health Mascot"
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>

      {speech && showSpeech && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card border-2 border-primary px-4 py-2 rounded-full whitespace-nowrap shadow-lg animate-bounce-in z-10"
          data-testid="mascot-speech"
        >
          <p className="text-sm font-bold text-foreground">{speech}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary" />
        </div>
      )}
    </div>
  );
}
