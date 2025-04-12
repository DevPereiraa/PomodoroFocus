"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const defaultWorkDuration = 25 * 60; // 25 minutes
const defaultBreakDuration = 5 * 60; // 5 minutes

export default function Home() {
  const [workDuration, setWorkDuration] = useState(defaultWorkDuration);
  const [breakDuration, setBreakDuration] = useState(defaultBreakDuration);
  const [timeRemaining, setTimeRemaining] = useState(workDuration);
  const [isActive, setIsActive] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [language, setLanguage] = useState("en"); // 'en' for English, 'pt' for Portuguese

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(interval);
            // Session switch logic
            if (isWorkSession) {
              setPomodoroCount((count) => count + 1);
              setTimeRemaining(breakDuration);
              setIsWorkSession(false);
            } else {
              setTimeRemaining(workDuration);
              setIsWorkSession(true);
            }
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, isWorkSession, workDuration, breakDuration]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(isWorkSession ? workDuration : breakDuration);
  };

  const switchLanguage = () => {
    setLanguage(language === "en" ? "pt" : "en");
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const progress = isWorkSession
    ? (1 - timeRemaining / workDuration) * 100
    : (1 - timeRemaining / breakDuration) * 100;

  // Language-based content
  const translations = {
    en: {
      work: "Work",
      break: "Break",
      start: "Start",
      pause: "Pause",
      reset: "Reset",
      sessions: "Sessions Completed",
      language: "Language",
    },
    pt: {
      work: "Trabalho",
      break: "Pausa",
      start: "Começar",
      pause: "Pausar",
      reset: "Reiniciar",
      sessions: "Sessões Concluídas",
      language: "Idioma",
    },
  };

  const t = translations[language];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">Pomodoro Focus</h1>

      <div className="mb-8">
        <h2>{isWorkSession ? t.work : t.break}</h2>
        <div className="text-4xl font-bold">{formatTime(timeRemaining)}</div>
        <Progress value={progress} className="h-2 w-64" />
      </div>

      <div className="flex space-x-4 mb-4">
        <Button variant="accent" onClick={toggleTimer}>
          {isActive ? t.pause : t.start}
        </Button>
        <Button onClick={resetTimer}>{t.reset}</Button>
      </div>

      <div className="mb-4">
        {t.sessions}: {pomodoroCount}
      </div>

      <Button onClick={switchLanguage}>
        {t.language}: {language === "en" ? "English" : "Português"}
      </Button>
    </div>
  );
}
