"use client";

import { useState, useEffect, useRef } from "react";
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
import { CirclePause, CirclePlay, RotateCcw, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from 'next-themes';
import { Sun, Moon, ClipboardList } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [language, setLanguage] = useState("en"); 
  const [customDuration, setCustomDuration] = useState<number | null>(null); 
  const [isAlarming, setIsAlarming] = useState(false);
  const [alarmVolume, setAlarmVolume] = useState(0.5);
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { setTheme } = useTheme();
  const { theme } = useTheme();
  const [sessionHistoryOpen, setSessionHistoryOpen] = useState(false); 
  const [pomodoroSessions, setPomodoroSessions] = useState<Date[]>([]); 

  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

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

  const initialWorkDurationRef = useRef(workDuration);
  const initialBreakDurationRef = useRef(breakDuration);

  useEffect(() => {
    initialWorkDurationRef.current = workDuration;
    initialBreakDurationRef.current = breakDuration;
  }, [workDuration, breakDuration]);

  useEffect(() => {
    setTimeRemaining(workDuration);
  }, [workDuration]);

  const addPomodoroSession = () => {
    setPomodoroSessions((prevSessions) => [...prevSessions, new Date()]);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(interval);
            
            if (isWorkSession) {
              setPomodoroCount((count) => count + 1);
              addPomodoroSession(); 
              setIsWorkSession(false);
            }
            setTimeRemaining(isWorkSession ? breakDuration : workDuration);
            setIsWorkSession(!isWorkSession);
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
    if (isAlarming) {
      stopAlarm();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeRemaining(
      isWorkSession ? initialWorkDurationRef.current : initialBreakDurationRef.current
    );
    stopAlarm();
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
      settings: "Settings",
      volume: "Volume",
      alarmSound: "Alarm Sound",
      stopAlarm: "Stop Alarm",
      chooseSound: "Choose Sound",
      uploadSound: "Upload Sound",
      skipBreak: "Skip Break",
      theme: "Theme",
      comingSoon: "Coming Soon",
    },
    pt: {
      work: "Trabalho",
      break: "Pausa",
      reset: "Reiniciar",
      start: "Começar",
      pause: "Pausar",
      sessions: "Sessões Concluídas",
      language: "Idioma",
      workDuration: "Duração do Trabalho (minutos)",
      breakDuration: "Duração da Pausa (minutos)",
      settings: "Configurações",
      volume: "Volume",
      alarmSound: "Som do Alarme",
      stopAlarm: "Parar Alarme",
      chooseSound: "Escolher Som",
      uploadSound: "Carregar Som",
      skipBreak: "Pular Pausa",
      theme: "Tema",
      comingSoon: "Em breve", 
    },
  };

  const t = translations[language];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAlarmSound(url);
    }
  };

  const skipBreak = () => {
    setTimeRemaining(workDuration);
    setIsWorkSession(true);
    setIsActive(true);

    toast({
      title: "Break Skipped!",
      description: "You're back to work.",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-secondary">
      <div className="container max-w-md p-8 rounded-2xl shadow-lg bg-card">

        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t.settings}</DialogTitle>
                <DialogDescription>{t.chooseSound}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="volume" className="text-right">
                    {t.volume}
                  </Label>
                  <Slider
                    id="volume"
                    defaultValue={[alarmVolume * 100]}
                    max={100}
                    step={1}
                    className="col-span-3"
                    onValueChange={(value) => setAlarmVolume(value[0] / 100)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alarmSound" className="text-right">
                    {t.uploadSound}
                  </Label>
                  <Input
                    type="file"
                    id="alarmSound"
                    accept="audio/*"
                    className="col-span-3"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="theme" className="text-right">
                    {t.theme}
                  </Label>
                  <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <h1 className="text-3xl font-bold mb-6 text-center text-primary">
          Pomodoro Focus
        </h1>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="workDuration"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t.workDuration}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="breakDuration"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t.breakDuration}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="mb-8 mt-8 rounded-xl p-4 bg-muted">
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

        {/* Skip Break Button */}
        {!isWorkSession && (
          <div className="flex justify-center mb-4">
            <Button variant="secondary" onClick={skipBreak}>
              {t.skipBreak}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <Dialog open={sessionHistoryOpen} onOpenChange={setSessionHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <ClipboardList className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t.sessions}</DialogTitle>
                <DialogDescription>
                  {t.comingSoon}
                </DialogDescription>
              </DialogHeader>
              {/*
              <div className="grid gap-4 py-4">
                <ScrollArea className="h-[300px] w-full">
                  {pomodoroSessions.map((date, index) => (
                    <div key={index} className="py-2 border-b last:border-b-0">
                      Session {index + 1}: {date.toLocaleDateString()} - {date.toLocaleTimeString()}
                    </div>
                  ))}
                </ScrollArea>
              </div>
              */}
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={switchLanguage}>
            {t.language}: {language === "en" ? "English" : "Português"}
          </Button>
        </div>
      </div>
    </div>
  );
}