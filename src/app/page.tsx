"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePause, CirclePlay, RotateCcw } from "lucide-react";

const defaultWorkDuration = 25 * 60; // 25 minutes
const defaultBreakDuration = 5 * 60; // 5 minutes

const formSchema = z.object({
  workDuration: z
    .string({
      required_error: "Work duration is required.",
    })
    .refine((value) => {
      const numValue = Number(value);
      return !isNaN(numValue) && numValue > 0 && numValue <= 3600;
    }, {
      message: "Work duration must be a number between 1 and 3600 minutes.",
    }),
  breakDuration: z
    .string({
      required_error: "Break duration is required.",
    })
    .refine((value) => {
      const numValue = Number(value);
      return !isNaN(numValue) && numValue > 0 && numValue <= 3600;
    }, {
      message: "Break duration must be a number between 1 and 3600 minutes.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [timeRemaining, setTimeRemaining] = useState(defaultWorkDuration);
  const [isActive, setIsActive] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [language, setLanguage] = useState("en"); // 'en' for English, 'pt' for Portuguese

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workDuration: "25",
      breakDuration: "5",
    },
  });

  const { watch } = form;

  const workDuration = Number(watch("workDuration")) * 60;
  const breakDuration = Number(watch("breakDuration")) * 60;

  useEffect(() => {
    setTimeRemaining(workDuration);
  }, [workDuration]);

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
      workDuration: "Work Duration (minutes)",
      breakDuration: "Break Duration (minutes)",
    },
    pt: {
      work: "Trabalho",
      break: "Pausa",
      start: "Começar",
      pause: "Pausar",
      reset: "Reiniciar",
      sessions: "Sessões Concluídas",
      language: "Idioma",
      workDuration: "Duração do Trabalho (minutos)",
      breakDuration: "Duração da Pausa (minutos)",
    },
  };

  const t = translations[language];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-secondary">
      <div className="container max-w-md p-8 rounded-2xl shadow-lg bg-card">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">
          Pomodoro Focus
        </h1>

        <Form {...form}>
          <form className="space-y-4">
            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="workDuration"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>{t.workDuration}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="25"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breakDuration"
                render={({ field }) => (
                  <FormItem className="w-1/2">
                    <FormLabel>{t.breakDuration}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}

                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <div className="mb-8 rounded-xl p-4 bg-muted">
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            {isWorkSession ? t.work : t.break}
          </h2>
          <div className="text-5xl font-bold text-center text-primary">
            {formatTime(timeRemaining)}
          </div>
          <Progress value={progress} className="h-3 w-full mt-4" />
        </div>

        <div className="flex space-x-4 mb-6 justify-center">
          <Button variant="accent" size="lg" onClick={toggleTimer}>
            {isActive ? (
              <>
                <CirclePause className="mr-2 h-5 w-5" />
                {t.pause}
              </>
            ) : (
              <>
                <CirclePlay className="mr-2 h-5 w-5" />
                {t.start}
              </>
            )}
          </Button>
          <Button size="lg" onClick={resetTimer}>
            <RotateCcw className="mr-2 h-5 w-5" />
            {t.reset}
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-lg">
            {t.sessions}: {pomodoroCount}
          </div>
          <Button variant="outline" onClick={switchLanguage}>
            {t.language}: {language === "en" ? "English" : "Português"}
          </Button>
        </div>
      </div>
    </div>
  );
}
