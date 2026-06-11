import React from "react";
import LyricaPublicLanding from "@/LyricaPublicLanding";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleEnterStudio = () => {
    navigate("/studio");
  };

  return <LyricaPublicLanding onEnterStudio={handleEnterStudio} />;
}
