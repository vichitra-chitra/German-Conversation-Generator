/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Users, 
  Settings, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Languages,
  Info,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { GRAMMAR_TOPICS, LEVELS } from "./constants";
import { generateGermanScript, explainWord, ScriptParams } from "./services/geminiService";

type Step = "basic" | "people" | "grammar" | "result";

export default function App() {
  const [step, setStep] = useState<Step>("basic");
  const [params, setParams] = useState<ScriptParams>({
    numPeople: 2,
    names: ["Anna", "Lukas"],
    topic: "Im Café",
    level: "A1",
    grammarTopic: "Konjugation im Präsens",
    wordCount: 150,
  });

  const [script, setScript] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainingWord, setExplainingWord] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const handleParamChange = (key: keyof ScriptParams, value: any) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...params.names];
    newNames[index] = name;
    handleParamChange("names", newNames);
  };

  useEffect(() => {
    if (params.names.length !== params.numPeople) {
      const newNames = Array.from({ length: params.numPeople }, (_, i) => params.names[i] || `Person ${i + 1}`);
      handleParamChange("names", newNames);
    }
  }, [params.numPeople]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setStep("result");
    try {
      const result = await generateGermanScript(params);
      setScript(result || "Fehler beim Generieren des Skripts.");
    } catch (error) {
      setScript("Entschuldigung, etwas ist schief gelaufen. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = async (word: string, context: string) => {
    // Clean word from punctuation
    const cleanWord = word.replace(/[.,!?;:()]/g, "");
    if (!cleanWord || cleanWord.length < 2) return;

    setExplainingWord(cleanWord);
    setIsExplaining(true);
    setExplanation(null);
    try {
      const result = await explainWord(cleanWord, context, params.level);
      setExplanation(result || "Keine Erklärung gefunden.");
    } catch (error) {
      setExplanation("Fehler beim Laden der Erklärung.");
    } finally {
      setIsExplaining(false);
    }
  };

  const renderBasicStep = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="level" className="text-lg font-medium flex items-center gap-2">
            <Languages className="w-5 h-5 text-brand-blue" />
            Sprachniveau (Level)
          </Label>
          <Select 
            value={params.level} 
            onValueChange={(v) => {
              handleParamChange("level", v);
              handleParamChange("grammarTopic", GRAMMAR_TOPICS[v as keyof typeof GRAMMAR_TOPICS][0]);
            }}
          >
            <SelectTrigger id="level" className="h-12 text-lg border-2 border-brand-blue/20 focus:border-brand-blue">
              <SelectValue placeholder="Wähle dein Niveau" />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l} className="text-lg">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="topic" className="text-lg font-medium flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-orange" />
            Thema der Konversation
          </Label>
          <Input 
            id="topic"
            placeholder="z.B. Im Café, Im Urlaub, Vorstellungsgespräch..."
            value={params.topic}
            onChange={(e) => handleParamChange("topic", e.target.value)}
            className="h-12 text-lg border-2 border-brand-orange/20 focus:border-brand-orange"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="wordCount" className="text-lg font-medium flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-green" />
            Anzahl der Wörter (~{params.wordCount})
          </Label>
          <input 
            type="range"
            id="wordCount"
            min="50"
            max="500"
            step="50"
            value={params.wordCount}
            onChange={(e) => handleParamChange("wordCount", parseInt(e.target.value))}
            className="w-full h-2 bg-brand-green/20 rounded-lg appearance-none cursor-pointer accent-brand-green"
          />
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>Kurz (50)</span>
            <span>Mittel (250)</span>
            <span>Lang (500)</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => setStep("people")}
        className="w-full h-14 text-xl font-bold student-gradient text-white shadow-lg hover:scale-[1.02] transition-transform"
      >
        Weiter zu den Personen <ChevronRight className="ml-2 w-6 h-6" />
      </Button>
    </motion.div>
  );

  const renderPeopleStep = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="numPeople" className="text-lg font-medium flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-blue" />
            Wie viele Personen?
          </Label>
          <Select 
            value={params.numPeople.toString()} 
            onValueChange={(v) => handleParamChange("numPeople", parseInt(v))}
          >
            <SelectTrigger id="numPeople" className="h-12 text-lg border-2 border-brand-blue/20 focus:border-brand-blue">
              <SelectValue placeholder="Anzahl wählen" />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={n.toString()} className="text-lg">{n} Personen</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-lg font-medium">Namen der Personen</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {params.names.map((name, i) => (
              <div key={i} className="relative">
                <Input 
                  placeholder={`Name ${i + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  className="h-12 pl-10 border-2 border-brand-yellow/30 focus:border-brand-yellow"
                />
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-yellow/60" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep("basic")} className="h-14 px-6 border-2">
          <ChevronLeft className="mr-2 w-6 h-6" /> Zurück
        </Button>
        <Button 
          onClick={() => setStep("grammar")}
          className="flex-1 h-14 text-xl font-bold student-gradient text-white shadow-lg hover:scale-[1.02] transition-transform"
        >
          Grammatik wählen <ChevronRight className="ml-2 w-6 h-6" />
        </Button>
      </div>
    </motion.div>
  );

  const renderGrammarStep = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-red" />
            Grammatik-Fokus für {params.level}
          </Label>
          <ScrollArea className="h-[300px] rounded-xl border-2 border-brand-red/20 p-4 bg-white">
            <div className="grid gap-2">
              {GRAMMAR_TOPICS[params.level as keyof typeof GRAMMAR_TOPICS].map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleParamChange("grammarTopic", topic)}
                  className={`text-left p-4 rounded-lg transition-all border-2 ${
                    params.grammarTopic === topic 
                      ? "bg-brand-red/10 border-brand-red text-brand-red font-bold shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-muted"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep("people")} className="h-14 px-6 border-2">
          <ChevronLeft className="mr-2 w-6 h-6" /> Zurück
        </Button>
        <Button 
          onClick={handleGenerate}
          className="flex-1 h-14 text-xl font-bold student-gradient text-white shadow-lg hover:scale-[1.02] transition-transform"
        >
          Skript generieren <Sparkles className="ml-2 w-6 h-6" />
        </Button>
      </div>
    </motion.div>
  );

  const renderResultStep = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <Card className="border-2 border-brand-blue/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-brand-blue/5 border-b-2 border-brand-blue/10">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-brand-blue">{params.topic}</CardTitle>
              <CardDescription className="text-lg">
                {params.level} • {params.grammarTopic}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1 border-brand-blue text-brand-blue bg-white">
              {isLoading ? "Generiere..." : "Fertig!"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-xl font-medium text-muted-foreground animate-pulse">
                Dein Skript wird erstellt...
              </p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none">
              <div className="bg-white rounded-xl p-6 border-2 border-dashed border-muted-foreground/20 leading-relaxed text-lg">
                {script.split("\n").map((line, i) => {
                  if (!line.trim()) return <br key={i} />;
                  
                  // Simple logic to make words clickable
                  // We only wrap words that look like German words
                  const words = line.split(" ");
                  return (
                    <p key={i} className="mb-2">
                      {words.map((word, j) => (
                        <span 
                          key={j} 
                          onClick={() => handleWordClick(word, line)}
                          className="cursor-pointer hover:bg-brand-yellow/30 hover:text-brand-orange transition-colors rounded px-0.5"
                        >
                          {word}{" "}
                        </span>
                      ))}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 p-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Info className="w-4 h-4" /> Tipp: Klicke auf ein Wort für die Erklärung!
          </p>
          <Button variant="ghost" onClick={() => setStep("basic")} className="text-brand-blue hover:text-brand-blue hover:bg-brand-blue/10">
            <RotateCcw className="mr-2 w-4 h-4" /> Neues Skript
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl student-gradient shadow-xl mb-4"
          >
            <Languages className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black tracking-tight text-slate-900"
          >
            Deutsch<span className="text-brand-orange">Dialog</span>
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground font-medium"
          >
            Lerne Deutsch mit interaktiven Skripten! 🇩🇪
          </motion.p>
        </header>

        {/* Progress Bar */}
        {step !== "result" && (
          <div className="flex justify-between items-center max-w-md mx-auto mb-8">
            {[
              { id: "basic", label: "Thema", color: "bg-brand-blue" },
              { id: "people", label: "Personen", color: "bg-brand-yellow" },
              { id: "grammar", label: "Grammatik", color: "bg-brand-red" },
            ].map((s, i) => {
              const isActive = step === s.id;
              const isPast = (step === "people" && i < 1) || (step === "grammar" && i < 2);
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 relative flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 z-10 ${
                    isActive ? s.color + " scale-125 shadow-lg" : isPast ? s.color : "bg-slate-200"
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm font-bold ${isActive ? "text-slate-900" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                  {i < 2 && (
                    <div className="absolute left-1/2 w-full h-1 bg-slate-200 top-5 -z-0">
                      <div className={`h-full transition-all duration-500 ${isPast ? s.color : "w-0"}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Main Content */}
        <main className="relative">
          <AnimatePresence mode="wait">
            {step === "basic" && renderBasicStep()}
            {step === "people" && renderPeopleStep()}
            {step === "grammar" && renderGrammarStep()}
            {step === "result" && renderResultStep()}
          </AnimatePresence>
        </main>

        {/* Word Explanation Dialog */}
        <Dialog open={!!explainingWord} onOpenChange={(open) => !open && setExplainingWord(null)}>
          <DialogContent className="sm:max-w-[500px] border-4 border-brand-yellow rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-brand-orange flex items-center gap-2">
                <BookOpen className="w-8 h-8" /> {explainingWord}
              </DialogTitle>
              <DialogDescription className="text-lg font-medium">
                Wortschatz-Helfer
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4 pr-4">
              {isExplaining ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
                  <p className="font-bold text-brand-orange animate-pulse">Suche Erklärung...</p>
                </div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown>{explanation || ""}</ReactMarkdown>
                </div>
              )}
            </ScrollArea>
            <div className="mt-6">
              <Button 
                onClick={() => setExplainingWord(null)}
                className="w-full h-12 text-lg font-bold bg-brand-yellow hover:bg-brand-yellow/80 text-brand-orange border-b-4 border-brand-orange/30"
              >
                Verstanden!
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <footer className="text-center pt-8 pb-4">
          <p className="text-muted-foreground text-sm font-medium">
            Gemacht für Deutschlerner • Unterstützt durch Gemini AI
          </p>
        </footer>
      </div>
    </div>
  );
}
