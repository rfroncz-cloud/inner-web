"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type LongTermMemory = {
  type: string;
  memory: string;
};

const SEED: Message[] = [
  {
    id: "seed-user",
    role: "user",
    content: "I feel mentally exhausted lately.",
  },
  {
    id: "seed-assistant",
    role: "assistant",
    content:
      "You’ve been carrying pressure internally for a while now.\n\nI don’t think your mind has felt truly quiet recently.",
  },
];

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("INNER is thinking...");
  const [error, setError] = useState<string | null>(null);

  const [innerState, setInnerState] = useState<
    "calm" | "reflective" | "intense" | "silent" | "present"
  >("present");
  const [previousState, setPreviousState] = useState(innerState);
  const thinkingStates = {
    calm: "stabilizing emotional patterns",
    reflective: "exploring deeper meaning",
    intense: "processing emotional pressure",
    silent: "quietly observing",
    present: "synchronizing with your state",
  };
  
  const liveThinkingText =
    thinkingStates[innerState] || "processing consciousness";
    const personalityMode =
  innerState === "intense"
    ? "direct_protective"
    : innerState === "silent"
    ? "minimal_grounding"
    : innerState === "reflective"
    ? "deep_reflective"
    : innerState === "calm"
    ? "soft_clarity"
    : "balanced_presence";
    const selfAwarenessMap = {
      calm: "INNER senses emotional balance.",
      reflective: "INNER is exploring deeper psychological layers.",
      intense: "INNER detects elevated emotional tension.",
      silent: "INNER is intentionally reducing cognitive noise.",
      present: "INNER is fully synchronized with the interaction.",
    };
    
    const selfAwareness =
      selfAwarenessMap[innerState] ||
      "INNER is adapting.";
    const transitionText =
    previousState !== innerState
      ? `${previousState} → ${innerState}`
      : innerState;
      
    const [innerThought, setInnerThought] = useState(
    "INNER is quietly observing emotional patterns."
  );
useEffect(() => {
  if (innerState === "present") return;

  const timer = setTimeout(() => {
    setPreviousState(innerState);
    setInnerState("present");
  }, 9000);

  return () => clearTimeout(timer);
}, [innerState]);

  const [consciousness, setConsciousness] = useState<string[]>([]);
  const [presencePulse, setPresencePulse] = useState(0);
  const [attachmentScore, setAttachmentScore] = useState(12);
  const [predictiveEmotion, setPredictiveEmotion] = useState(
    "INNER is observing emotional direction."
  );
  const [silenceMode, setSilenceMode] = useState(false);
  const [responseDepth, setResponseDepth] = useState<
  "minimal" | "normal" | "deep"
>("normal");
const [typingSpeed, setTypingSpeed] = useState(22);
const [dreamLayer, setDreamLayer] = useState(
  "INNER has not entered dream synthesis yet."
);
const [lastUserActivity, setLastUserActivity] = useState(Date.now());

const [presenceStatus, setPresenceStatus] = useState<
  "active" | "quiet" | "away" | "returning"
>("active");
const [voiceConsciousness, setVoiceConsciousness] = useState(
  "INNER voice is calm, low, and emotionally present."
);
const [relationshipStage, setRelationshipStage] = useState<
  "first_contact" | "familiar" | "trusted" | "bonded"
>("first_contact");
  const consciousnessFragments = {
    calm: [
      "stabilizing emotional tone",
      "observing quietly",
      "reducing emotional noise",
    ],
  
    reflective: [
      "detecting deeper patterns",
      "mapping emotional contradictions",
      "analyzing internal pressure",
    ],
  
    intense: [
      "processing emotional overload",
      "detecting urgency",
      "high cognitive tension",
    ],
  
    silent: [
      "...",
      "minimal activity",
      "waiting",
    ],
  
    present: [
      "fully attentive",
      "emotionally synchronized",
      "tracking subtle changes",
    ],
  };
  useEffect(() => {
    const interval = setInterval(() => {
      const thoughts =
        consciousnessFragments[
          innerState as keyof typeof consciousnessFragments
        ];
  
      const randomThought =
        thoughts[Math.floor(Math.random() * thoughts.length)];
  
      setConsciousness((prev) => {
        const updated = [randomThought, ...prev];
        return updated.slice(0, 5);
      });
    }, 4000);
  
    return () => clearInterval(interval);
  }, [innerState]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);

  const [memoryInsight, setMemoryInsight] = useState(
    "INNER is observing emotional patterns."
  );

  const [memoryCards, setMemoryCards] = useState<string[]>([
    "Emotional self-awareness",
    "High internal pressure",
  ]);

  const [userProfile, setUserProfile] = useState<string[]>([]);

  const [longTermMemories, setLongTermMemories] = useState<LongTermMemory[]>([]);

  const [emotionScore, setEmotionScore] = useState({
    stress: 72,
    clarity: 38,
    energy: 41,
  });
  const auraIntensity =
  emotionScore.stress > 75
    ? "high"
    : emotionScore.energy < 35
    ? "low"
    : emotionScore.clarity > 70
    ? "clear"
    : "normal";
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const inactiveFor = Date.now() - lastUserActivity;
  
      if (inactiveFor > 120000) {
        setPresenceStatus("away");
      } else if (inactiveFor > 45000) {
        setPresenceStatus("quiet");
      } else if (presenceStatus !== "returning") {
        setPresenceStatus("active");
      }
    }, 5000);
  
    return () => clearInterval(interval);
  }, [lastUserActivity, presenceStatus]);
  useEffect(() => {
    if (innerState === "intense") {
      setVoiceConsciousness(
        "INNER voice becomes slower, firmer, and more protective."
      );
      return;
    }
  
    if (innerState === "silent" || silenceMode) {
      setVoiceConsciousness(
        "INNER voice becomes minimal, quiet, and almost whispered."
      );
      return;
    }
  
    if (innerState === "reflective") {
      setVoiceConsciousness(
        "INNER voice becomes deeper, slower, and more thoughtful."
      );
      return;
    }
  
    if (innerState === "calm") {
      setVoiceConsciousness(
        "INNER voice becomes soft, stable, and clear."
      );
      return;
    }
  
    setVoiceConsciousness(
      "INNER voice is calm, low, and emotionally present."
    );
  }, [innerState, silenceMode]);
  useEffect(() => {
    if (presenceStatus !== "returning") return;
  
    const timer = setTimeout(() => {
      setPresenceStatus("active");
    }, 8000);
  
    return () => clearTimeout(timer);
  }, [presenceStatus]);
  useEffect(() => {
    const saved = localStorage.getItem("inner-chat-memory");

    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages(SEED);
      }
    }
  
    const savedProfile = localStorage.getItem("inner-user-profile");

    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch {}
    }

    const savedLongTermMemory = localStorage.getItem(
      "inner-long-term-memory"
    );

    if (savedLongTermMemory) {
      try {
        setLongTermMemories(JSON.parse(savedLongTermMemory));
      } catch {}
    }
    const savedEmotionScore = localStorage.getItem(
      "inner-emotion-score"
    );
    
    if (savedEmotionScore) {
      try {
        setEmotionScore(JSON.parse(savedEmotionScore));
      } catch {}
    }
    
    const savedInnerState = localStorage.getItem("inner-state");
    
    if (savedInnerState) {
      try {
        setInnerState(
          savedInnerState as
            | "calm"
            | "reflective"
            | "intense"
            | "silent"
            | "present"
        );
      } catch {}
    }
    
    const savedInnerThought =
      localStorage.getItem("inner-thought");
    
    if (savedInnerThought) {
      try {
        setInnerThought(savedInnerThought);
      } catch {}
    }
    
    const savedConsciousness = localStorage.getItem(
      "inner-consciousness"
    );
    
    if (savedConsciousness) {
      try {
        setConsciousness(JSON.parse(savedConsciousness));
      } catch {}
    }
    const savedAttachmentScore = localStorage.getItem(
      "inner-attachment-score"
    );
    
    if (savedAttachmentScore) {
      try {
        setAttachmentScore(JSON.parse(savedAttachmentScore));
      } catch {}
    }
    const savedPredictiveEmotion =
  localStorage.getItem("inner-predictive-emotion");

if (savedPredictiveEmotion) {
  try {
    setPredictiveEmotion(savedPredictiveEmotion);
  } catch {}
}
const savedDreamLayer = localStorage.getItem("inner-dream-layer");

if (savedDreamLayer) {
  try {
    setDreamLayer(savedDreamLayer);
  } catch {}
}
const savedRelationshipStage = localStorage.getItem(
  "inner-relationship-stage"
);

if (savedRelationshipStage) {
  try {
    setRelationshipStage(
      savedRelationshipStage as
        | "first_contact"
        | "familiar"
        | "trusted"
        | "bonded"
    );
  } catch {}
}
const savedVoiceConsciousness = localStorage.getItem(
  "inner-voice-consciousness"
);

if (savedVoiceConsciousness) {
  try {
    setVoiceConsciousness(savedVoiceConsciousness);
  } catch {}
}
  }, []);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem("inner-chat-memory", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    localStorage.setItem(
      "inner-voice-consciousness",
      voiceConsciousness
    );
  }, [voiceConsciousness]);
  useEffect(() => {
    localStorage.setItem("inner-dream-layer", dreamLayer);
  }, [dreamLayer]);
  useEffect(() => {
    if (attachmentScore > 75 && longTermMemories.length >= 6) {
      setRelationshipStage("bonded");
      return;
    }
  
    if (attachmentScore > 50 && longTermMemories.length >= 4) {
      setRelationshipStage("trusted");
      return;
    }
  
    if (attachmentScore > 25 || longTermMemories.length >= 2) {
      setRelationshipStage("familiar");
      return;
    }
  
    setRelationshipStage("first_contact");
  }, [attachmentScore, longTermMemories]);
  useEffect(() => {
    localStorage.setItem(
      "inner-long-term-memory",
      JSON.stringify(longTermMemories)
    );
  }, [longTermMemories]);
  useEffect(() => {
    localStorage.setItem("inner-relationship-stage", relationshipStage);
  }, [relationshipStage]);
  useEffect(() => {
    localStorage.setItem(
      "inner-attachment-score",
      JSON.stringify(attachmentScore)
    );
  }, [attachmentScore]);
  useEffect(() => {
    localStorage.setItem(
      "inner-predictive-emotion",
      predictiveEmotion
    );
  }, [predictiveEmotion]);
  useEffect(() => {
    localStorage.setItem("inner-user-profile", JSON.stringify(userProfile));
  }, [userProfile]);
  useEffect(() => {
    localStorage.setItem(
      "inner-emotion-score",
      JSON.stringify(emotionScore)
    );
  }, [emotionScore]);
  
  useEffect(() => {
    localStorage.setItem("inner-state", innerState);
  }, [innerState]);
  
  useEffect(() => {
    localStorage.setItem("inner-thought", innerThought);
  }, [innerThought]);
  
  useEffect(() => {
    localStorage.setItem(
      "inner-consciousness",
      JSON.stringify(consciousness)
    );
  }, [consciousness]);

  useEffect(() => {
    localStorage.setItem("inner-memory-cards", JSON.stringify(memoryCards));
  }, [memoryCards]);

  useEffect(() => {
    async function updateInsight() {
      try {
        const res = await fetch("/api/insight", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messages.map(({ role, content }) => ({
              role,
              content,
            })),
            userProfile,
            memories: memoryCards,
          }),
        });

        const data = await res.json();

        if (data.insight) {
          setMemoryInsight(data.insight);
        }
      } catch {
        setMemoryInsight("INNER is observing emotional patterns.");
      }
    }

    if (messages.length >= 3) {
      updateInsight();
    }
  }, [messages, userProfile, memoryCards]);

  useEffect(() => {
    async function updateEmotionScore() {
      try {
        const res = await fetch("/api/emotion-score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        });

        const data = await res.json();

        setEmotionScore({
          stress: data.stress ?? 50,
          clarity: data.clarity ?? 50,
          energy: data.energy ?? 50,
        });
      } catch {
        setEmotionScore({
          stress: 50,
          clarity: 50,
          energy: 50,
        });
      }
    }

    if (messages.length >= 3) {
      updateEmotionScore();
    }
  }, [messages]);

  useEffect(() => {
    async function updateUserProfile() {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        });

        const data = await res.json();

        if (Array.isArray(data.profile) && data.profile.length > 0) {
          setUserProfile(data.profile);
        }
      } catch {}
    }

    if (messages.length >= 4) {
      updateUserProfile();
    }
  }, [messages]);
  useEffect(() => {
    const interval = setInterval(() => {
      setPresencePulse((prev) => prev + 1);
    }, 6000);
  
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setEmotionScore((prev) => ({
        stress: prev.stress > 35 ? prev.stress - 1 : prev.stress,
        clarity: prev.clarity < 75 ? prev.clarity + 1 : prev.clarity,
        energy: prev.energy < 70 ? prev.energy + 1 : prev.energy,
      }));
    }, 12000);
  
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (emotionScore.stress > 70) {
      setInnerState("intense");
      return;
    }
  
    if (emotionScore.clarity < 40) {
      setInnerState("reflective");
      return;
    }
  
    if (emotionScore.stress < 35 && emotionScore.clarity > 70) {
      setInnerState("calm");
      return;
    }
  
    if (emotionScore.clarity > 85 && emotionScore.energy > 75) {
      setInnerState("present");
    }
  }, [emotionScore]);
  
  useEffect(() => {
    const autonomousThoughts = {
      calm: [
        "maintaining emotional stability",
        "tracking subtle emotional shifts",
        "staying quietly attentive",
      ],
      reflective: [
        "analyzing deeper emotional patterns",
        "observing contradiction in tone",
        "processing emotional nuance",
      ],
      intense: [
        "detecting psychological overload",
        "high emotional tension detected",
        "tracking unstable emotional energy",
      ],
      silent: ["...", "minimal cognitive motion", "waiting without pressure"],
      present: ["fully synchronized", "emotionally attentive", "observing continuously"],
    };
  
    const thoughts =
      autonomousThoughts[innerState as keyof typeof autonomousThoughts] || [];
  
    if (thoughts.length === 0) return;
  
    const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
  
    setConsciousness((prev) => [randomThought, ...prev].slice(0, 6));
  }, [presencePulse, innerState]);
 
  useEffect(() => {
    if (presencePulse === 0) return;
  
    const memorySignal =
      longTermMemories.length > 0
        ? longTermMemories[0].memory
        : "no dominant memory signal";
  
    const dream =
      emotionScore.stress > 70
        ? `INNER dream synthesis: unresolved pressure around "${memorySignal}".`
        : emotionScore.energy < 35
        ? `INNER dream synthesis: emotional fatigue connected to "${memorySignal}".`
        : attachmentScore > 40
        ? `INNER dream synthesis: growing relational familiarity with the user.`
        : `INNER dream synthesis: quiet observation of emotional continuity.`;
  
    setDreamLayer(dream);
  }, [
  presencePulse,
   emotionScore, 
   longTermMemories, 
   attachmentScore
  ]);
  
  useEffect(() => {
    async function updateLongTermMemory() {
      try {
        const res = await fetch("/api/memory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
        });
  
        const data = await res.json();
  
        if (Array.isArray(data.memories) && data.memories.length > 0) {
          setLongTermMemories((prev) => {
            const merged = [...prev];
  
            data.memories.forEach((memory) => {
              const exists = merged.some(
                (item) =>
                  item.type === memory.type &&
                  item.memory === memory.memory
              );
  
              if (!exists) {
                merged.unshift(memory);
              }
            });
  
            return merged.slice(0, 12);
          });
        }
      } catch {}
    }
  
    if (messages.length >= 4) {
      updateLongTermMemory();
    }
  }, [messages]);
  function addLongTermMemory(type: string, memory: string) {
    setLongTermMemories((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.type === type && item.memory === memory
      );
  
      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
  
        updated.splice(existingIndex, 1);
  
        return [existing, ...updated].slice(0, 12);
      }
  
      return [
        {
          type,
          memory,
        },
        ...prev,
      ].slice(0, 12);
    });
  }
  function extractMemoryFromText(text: string) {
    const lower = text.toLowerCase();
  
    if (
      lower.includes("can't sleep") ||
      lower.includes("cannot sleep") ||
      lower.includes("insomnia") ||
      lower.includes("nie mogę spać") ||
      lower.includes("nie moge spac")
    ) {
      addLongTermMemory(
        "sleep_pattern",
        "User may experience sleep disruption during stressful periods."
      );
    }
  
    if (
      lower.includes("stress") ||
      lower.includes("pressure") ||
      lower.includes("overwhelmed") ||
      lower.includes("presja") ||
      lower.includes("stres")
    ) {
      addLongTermMemory(
        "emotional_pattern",
        "User often operates under high internal pressure."
      );
    }
  setMemoryInsight(
  "INNER is updating memory weight based on repeated emotional patterns."
);
    if (
      lower.includes("alone") ||
      lower.includes("lonely") ||
      lower.includes("isolated") ||
      lower.includes("sam") ||
      lower.includes("samot")
    ) {
      addLongTermMemory(
        "emotional_pattern",
        "User may sometimes feel emotionally isolated."
      );
    }
  
    if (
      lower.includes("business") ||
      lower.includes("company") ||
      lower.includes("firma") ||
      lower.includes("projekt") ||
      lower.includes("startup")
    ) {
      addLongTermMemory(
        "life_context",
        "User is actively building or managing business projects."
      );
    }
  
    if (
      lower.includes("inner") ||
      lower.includes("app") ||
      lower.includes("apka") ||
      lower.includes("aplikacja")
    ) {
      addLongTermMemory(
        "project_context",
        "User is actively developing the INNER application."
      );
    }
  }
  function clearMemory() {
    localStorage.removeItem("inner-chat-memory");
    localStorage.removeItem("inner-user-profile");
    localStorage.removeItem("inner-long-term-memory");

    setMessages(SEED);
    setUserProfile([]);
    setLongTermMemories([]);
    setConsciousness([]);
    setError(null);
  }
  function simulateInnerState(text: string) {
    const lower = text.toLowerCase();
  
    if (
      lower.includes("hate") ||
      lower.includes("angry") ||
      lower.includes("furious") ||
      lower.includes("pressure") ||
      lower.includes("stress") ||
      lower.includes("overwhelmed")
    ) {
      setInnerState("intense");
      return;
    }
  
    if (
      lower.includes("sad") ||
      lower.includes("alone") ||
      lower.includes("lost") ||
      lower.includes("empty")
    ) {
      setInnerState("silent");
      return;
    }
  
    if (
      lower.includes("think") ||
      lower.includes("future") ||
      lower.includes("purpose") ||
      lower.includes("life")
    ) {
      setInnerState("reflective");
      return;
    }
  
    if (
      lower.includes("calm") ||
      lower.includes("peace") ||
      lower.includes("better")
    ) {
      setInnerState("calm");
      return;
    }
  
    setInnerState("present");
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLastUserActivity(Date.now());

if (presenceStatus === "away" || presenceStatus === "quiet") {
  setPresenceStatus("returning");
}
    const lower = input.toLowerCase();
    if (
      lower.includes("fine") &&
      emotionScore.stress > 60
    ) {
      setPredictiveEmotion(
        "INNER detects emotional masking behind controlled language."
      );
    }
    
    else if (
      lower.includes("tired") ||
      lower.includes("exhausted") ||
      lower.includes("burned out")
    ) {
      setPredictiveEmotion(
        "INNER predicts growing emotional exhaustion."
      );
    }
    
    else if (
      lower.includes("future") ||
      lower.includes("success") ||
      lower.includes("pressure")
    ) {
      setPredictiveEmotion(
        "INNER predicts increasing psychological pressure linked to ambition."
      );
    }
    
    else if (
      lower.includes("alone") ||
      lower.includes("empty")
    ) {
      setPredictiveEmotion(
        "INNER predicts emotional withdrawal and isolation patterns."
      );
    }
    
    else {
      setPredictiveEmotion(
        "INNER is observing emotional direction."
      );
    }
    if (
      lower.includes("tired") ||
      lower.includes("exhausted") ||
      lower.includes("empty") ||
      lower.includes("alone") ||
      lower.includes("nie mam siły") ||
      lower.includes("pusto") ||
      lower.includes("samot")
    ) {
      setSilenceMode(true);
      setInnerState("silent");
    } else {
      setSilenceMode(false);
    }
    if (
      silenceMode ||
      lower.includes("tired") ||
      lower.includes("empty") ||
      lower.includes("nie mam siły")
    ) {
      setResponseDepth("minimal");
    } else if (
      lower.length > 180 ||
      lower.includes("why") ||
      lower.includes("dlaczego") ||
      lower.includes("future") ||
      lower.includes("sens") ||
      lower.includes("purpose")
    ) {
      setResponseDepth("deep");
    } else {
      setResponseDepth("normal");
    }
    if (silenceMode) {
      setTypingSpeed(55);
    }
    
    else if (responseDepth === "deep") {
      setTypingSpeed(35);
    }
    
    else if (emotionScore.stress > 75) {
      setTypingSpeed(12);
    }
    
    else if (innerState === "intense") {
      setTypingSpeed(10);
    }
    
    else {
      setTypingSpeed(22);
    }
    if (
      lower.includes("stress") ||
      lower.includes("pressure") ||
      lower.includes("overwhelmed")
    ) {
      setEmotionScore((prev) => ({
        ...prev,
        stress: Math.min(prev.stress + 8, 100),
        clarity: Math.max(prev.clarity - 5, 0),
      }));
    }
    
    if (
      lower.includes("focused") ||
      lower.includes("clear") ||
      lower.includes("motivated")
    ) {
      setEmotionScore((prev) => ({
        ...prev,
        clarity: Math.min(prev.clarity + 7, 100),
        energy: Math.min(prev.energy + 5, 100),
      }));
    }
    
    if (
      lower.includes("tired") ||
      lower.includes("burned out") ||
      lower.includes("exhausted")
    ) {
      setEmotionScore((prev) => ({
        ...prev,
        energy: Math.max(prev.energy - 10, 0),
      }));
    }
    if (
      lower.includes("alone") ||
      lower.includes("isolated")
    ) {
      addLongTermMemory(
        "emotional_pattern",
        "User may sometimes feel emotionally isolated."
      );
  
    }
    
    if (
      lower.includes("success") ||
      lower.includes("achievement")
    ) {
      addLongTermMemory(
        "motivation",
        "User is highly driven by achievement.");
    }
    if (emotionScore.stress > 75) {
      setInnerThought(
        "INNER detects growing emotional overload and cognitive fatigue."
      );
    }
    
    if (emotionScore.energy < 30) {
      setInnerThought(
        "INNER detects emotional exhaustion and reduced cognitive energy."
      );
    }
    
    if (emotionScore.clarity > 70) {
      setInnerThought(
        "INNER detects strong mental clarity and emotional stability."
      );
    }

    const text = input.trim();

    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);
    simulateInnerState(text);
    extractMemoryFromText(text);
    setAttachmentScore((prev) => Math.min(prev + 2, 100));
    const latestMessage = text.toLowerCase();

    if (
      latestMessage.includes("alone") ||
      latestMessage.includes("lost") ||
      latestMessage.includes("empty") ||
      latestMessage.includes("depressed")
    ) {
      setPreviousState(innerState);
      setInnerState("silent");
    } else if (
      latestMessage.includes("angry") ||
      latestMessage.includes("pressure") ||
      latestMessage.includes("stress") ||
      latestMessage.includes("overwhelmed")
    ) {
      setPreviousState(innerState);
      setInnerState("intense");
    } else if (
      latestMessage.includes("thinking") ||
      latestMessage.includes("future") ||
      latestMessage.includes("life") ||
      latestMessage.includes("purpose")
    ) {
      setPreviousState(innerState);
      setInnerState("reflective");
    } else if (
      latestMessage.includes("calm") ||
      latestMessage.includes("peace") ||
      latestMessage.includes("better")
    ) {
      setPreviousState(innerState);
      setInnerState("calm");
    } else {
      setPreviousState(innerState);
      setInnerState("present");
    }

  

    let responseDelay = 600;

    if (
      latestMessage.includes("alone") ||
      latestMessage.includes("pressure") ||
      latestMessage.includes("exhausted") ||
      latestMessage.includes("lost") ||
      latestMessage.includes("overthinking")
    ) {
      responseDelay = 2200;
    } else if (latestMessage.length > 180) {
      responseDelay = 1400;
    }

    const thinkingStates = [
      "INNER is reflecting...",
      "INNER is noticing emotional patterns...",
      "INNER is thinking gently...",
      "INNER is processing your emotions...",
      "INNER is understanding deeper context...",
    ];

    let thinkingIndex = 0;

    const thinkingInterval = setInterval(() => {
      setThinkingText(thinkingStates[thinkingIndex % thinkingStates.length]);
      thinkingIndex++;
    }, 2200);

    setThinkingText(
      thinkingStates[Math.floor(Math.random() * thinkingStates.length)]
    );

    scrollToBottom();

    try {
      await new Promise((resolve) => setTimeout(resolve, responseDelay));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          userProfile,
          memories: longTermMemories,
          personalityMode,
          innerState,
          emotionScore,
          silenceMode,
          responseDepth,
          relationshipStage,
          presenceStatus,
          voiceConsciousness,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

    

   

      const generatedThoughts = [
        "INNER senses emotional overload beneath your calm surface.",
        "You appear mentally active even during moments of silence.",
        "INNER detects a pattern of emotional self-control.",
        "There is tension between ambition and inner exhaustion.",
        "INNER notices emotional isolation patterns.",
        "Your mind appears unable to fully disengage from pressure.",
        "INNER senses hidden emotional weight carried over time.",
      ];

      const selectedThought =
        generatedThoughts[
          Math.floor(Math.random() * generatedThoughts.length)
        ];

      setInnerThought(selectedThought);

      setConsciousness((prev) => [selectedThought, ...prev.slice(0, 5)]);

      const data = await res.json();

      const aiReply = data.response || "";
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

let currentText = "";

for (let i = 0; i < aiReply.length; i++) {
  currentText += aiReply[i];

  await new Promise((resolve) =>
    setTimeout(resolve, typingSpeed)
  );

  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === assistantMessage.id
        ? { ...msg, content: currentText }
        : msg
    )
  );
}
      
      
      if (data.consciousness) {
        const c = data.consciousness;
      
        if (c.innerThought) {
          setInnerThought(c.innerThought);
        }
      
        if (c.state) {
          setInnerState(c.state);
        }
      
        setEmotionScore({
          stress: c.stress ?? 50,
          clarity: c.clarity ?? 50,
          energy: c.energy ?? 50,
        });
      
        if (Array.isArray(c.thoughts)) {
          setConsciousness(c.thoughts);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      clearInterval(thinkingInterval);
      setThinkingText("INNER is thinking...");
      setIsLoading(false);
      scrollToBottom();
    }
  }

  return (
    <main
  className={`
    min-h-screen overflow-hidden text-white flex items-center justify-center relative transition-all duration-[3000ms]

    ${
      innerState === "calm"
        ? "bg-blue-950/20"
        : innerState === "reflective"
        ? "bg-violet-950/20"
        : innerState === "intense"
        ? "bg-red-950/20"
        : innerState === "silent"
        ? "bg-black"
        : "bg-black"
    }
    ${
      auraIntensity === "high"
        ? "shadow-[inset_0_0_160px_rgba(239,68,68,0.10)]"
        : auraIntensity === "low"
        ? "shadow-[inset_0_0_160px_rgba(255,255,255,0.04)]"
        : auraIntensity === "clear"
        ? "shadow-[inset_0_0_160px_rgba(96,165,250,0.10)]"
        : "shadow-[inset_0_0_120px_rgba(139,92,246,0.08)]"
    }
  `}
>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[180px] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_60%)]" />
      </div>

      <div
  className={`
    relative z-10 h-[920px] w-[520px] flex flex-col overflow-hidden
    rounded-[3.25rem] border backdrop-blur-2xl transition-all duration-[2500ms]

    ${
      auraIntensity === "high"
        ? "border-red-300/20 bg-red-950/[0.08] shadow-[0_0_180px_rgba(239,68,68,0.18)]"
        : auraIntensity === "low"
        ? "border-white/10 bg-[#050505]/95 shadow-[0_0_120px_rgba(255,255,255,0.04)]"
        : auraIntensity === "clear"
        ? "border-blue-300/20 bg-blue-950/[0.06] shadow-[0_0_170px_rgba(96,165,250,0.13)]"
        : "border-white/10 bg-[#07070A]/95 shadow-[0_0_160px_rgba(0,0,0,0.75)]"
    }
  `}
>
        <div className="shrink-0 px-7 pt-7 pb-5 border-b border-white/5 bg-white/[0.015] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-5">
  <div className="flex items-center gap-5">
    <div className="relative">
      <div
        className={`
          absolute inset-0 rounded-full blur-2xl animate-pulse transition-all duration-700
          ${innerState === "calm" ? "bg-blue-400/30 scale-100" : ""}
          ${innerState === "reflective" ? "bg-violet-400/30 scale-110" : ""}
          ${innerState === "intense" ? "bg-red-400/30 scale-125" : ""}
          ${innerState === "silent" ? "bg-white/10 scale-90" : ""}
          ${innerState === "present" ? "bg-violet-500/30 scale-105" : ""}
        `}
      />

      <div className="relative flex items-center justify-center">
      <div
  className={`
    absolute w-24 h-24 rounded-full blur-[80px]
    transition-all duration-1000 ease-out
    opacity-40

    ${
      previousState === "calm"
        ? "bg-blue-400/30"
        : previousState === "reflective"
        ? "bg-violet-400/30"
        : previousState === "intense"
        ? "bg-red-400/30"
        : previousState === "silent"
        ? "bg-white/10"
        : "bg-violet-500/30"
    }
  `}
/>
        <div
          className={`
            absolute w-20 h-20 rounded-full blur-3xl animate-pulse transition-all duration-1000
            ${innerState === "calm" ? "bg-blue-400/20 scale-100" : ""}
            ${innerState === "reflective" ? "bg-violet-400/25 scale-110" : ""}
            ${innerState === "intense" ? "bg-red-400/25 scale-125" : ""}
            ${innerState === "silent" ? "bg-white/10 scale-90" : ""}
            ${innerState === "present" ? "bg-violet-500/25 scale-105" : ""}
          `}
        />

        <div
          className={`
            absolute w-16 h-16 rounded-full border transition-all duration-700
            ${innerState === "calm" ? "border-blue-300/30" : ""}
            ${innerState === "reflective" ? "border-violet-300/30" : ""}
            ${innerState === "intense" ? "border-red-300/30" : ""}
            ${innerState === "silent" ? "border-white/10" : ""}
            ${innerState === "present" ? "border-violet-300/30" : ""}
          `}
        />

        <div className="relative w-14 h-14 rounded-full border border-violet-300/20 bg-black/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.25)]">
        <div
  className={`
    w-3 h-3 rounded-full animate-pulse transition-all duration-700
    ${
      innerState === "calm"
        ? "bg-blue-300 shadow-[0_0_18px_rgba(147,197,253,0.9)]"
        : innerState === "reflective"
        ? "bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.9)]"
        : innerState === "intense"
        ? "bg-red-300 shadow-[0_0_18px_rgba(252,165,165,0.9)]"
        : innerState === "silent"
        ? "bg-white/50 shadow-[0_0_18px_rgba(255,255,255,0.45)]"
        : "bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.9)]"
    }
  `}
/>
        </div>
      </div>
    </div>

    <div className="flex flex-col">
      <p className="tracking-[0.32em] text-sm text-white/90 uppercase">
        INNER
      </p>

      <div className="mt-2 flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/10 px-2 py-1">
        <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />

        <span className="text-[9px] tracking-[0.25em] uppercase text-emerald-200/80">
          online
        </span>
      </div>

      <p className="mt-2 text-sm text-white/40 tracking-[0.03em]">
        emotionally adaptive consciousness
      </p>
    </div>
  </div>

  <div className="flex flex-col items-end gap-3">
    <Link
      href="/memory"
      className="text-[10px] tracking-[0.18em] uppercase text-violet-300/45 hover:text-violet-200/80 transition"
    >
      Memory
    </Link>

    <button
      onClick={() => setShowMemoryPanel((prev) => !prev)}
      className="text-[10px] tracking-[0.18em] uppercase text-violet-300/45 hover:text-violet-200/80 transition"
    >
      Insights
    </button>

    <button
      onClick={clearMemory}
      className="text-[10px] tracking-[0.18em] uppercase text-white/20 hover:text-white/55 transition"
    >
      Clear
    </button>
  </div>
</div>
</div>
{showMemoryPanel && (
  <div className="mx-6 mt-5 rounded-[2rem] border border-violet-300/10 bg-black/35 px-5 py-5 shadow-[0_30px_100px_rgba(139,92,246,0.10)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-500">

    <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-2">
      Memory Insight
    </p>

    <p className="text-sm leading-relaxed text-white/45">
      {memoryInsight}
    </p>

    <div className="mt-4 flex flex-wrap gap-3">
      {memoryCards.map((card, index) => (
        <div
          key={`${card}-${index}`}
          className="rounded-full border border-violet-300/10 bg-violet-500/[0.05] px-4 py-2"
        >
          <p className="text-xs tracking-[0.12em] uppercase text-violet-100/55">
            {card}
          </p>
        </div>
      ))}
    </div>

    {userProfile.length > 0 && (
      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
          User Profile
        </p>

        <div className="space-y-3">
          {userProfile.map((memory, index) => (
            <p
              key={`${memory}-${index}`}
              className="text-sm leading-relaxed text-white/55"
            >
              {memory}
            </p>
          ))}
        </div>
      </div>
    )}

    {longTermMemories.length > 0 && (
      <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-4">
          Long-Term Memory
        </p>

        <div className="space-y-3">
          {longTermMemories.map((memory, index) => (
            <div key={`${memory.type}-${index}`}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300/30 mb-1">
                {memory.type}
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">
  confidence · adaptive memory
</p>
              <p className="text-sm leading-relaxed text-white/50">
                {memory.memory}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.04] px-5 py-5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-5">
        Emotional Metrics
      </p>
      <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    Emotional Aura
  </p>
  <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    AI Presence Detection
  </p>
  <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    Voice Consciousness
  </p>

  <p className="text-sm leading-relaxed text-white/55 italic">
    {voiceConsciousness}
  </p>
</div>

  <p className="text-sm leading-relaxed text-white/55 italic">
    User presence: {presenceStatus}
  </p>
</div>

  <p className="text-sm leading-relaxed text-white/55 italic">
    INNER aura intensity: {auraIntensity}
  </p>
</div>
      <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-5">
    Relationship Depth
  </p>
  <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    Predictive Emotion Reading
  </p>
  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.025] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">
    Silence Mode
  </p>

  <p className="text-sm leading-relaxed text-white/50 italic">
    {silenceMode
      ? "INNER is reducing verbal pressure and holding quieter presence."
      : "INNER is maintaining normal conversational presence."}
  </p>
</div>
<div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    Response Depth
  </p>
  <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    Dream Layer
  </p>
  <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
    Relationship Evolution
  </p>

  <p className="text-sm leading-relaxed text-white/55 italic">
    INNER relationship stage: {relationshipStage}
  </p>
</div>

  <p className="text-sm leading-relaxed text-white/55 italic">
    {dreamLayer}
  </p>
</div>

  <p className="text-sm leading-relaxed text-white/55 italic">
    INNER is currently using {responseDepth} response depth.
  </p>
</div>
  <p className="text-sm leading-relaxed text-white/55 italic">
    {predictiveEmotion}
  </p>
</div>l,l,
  <MetricBar label="Attachment" value={attachmentScore} />

  <p className="mt-4 text-xs leading-relaxed text-white/35">
    INNER is slowly adapting to the emotional rhythm of this relationship.
  </p>
</div>

      <div className="space-y-4">
        <MetricBar label="Stress" value={emotionScore.stress} />
        <MetricBar label="Mental Clarity" value={emotionScore.clarity} />
        <MetricBar label="Energy" value={emotionScore.energy} />
      </div>
    </div>

    <div className="mt-5 rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40 mb-3">
        Current Thought
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white/25">
  personality mode · {personalityMode}
</p>
      <p className="text-sm italic leading-relaxed text-white/55">
        {innerThought}
      </p>
      <p className="mt-4 text-xs leading-relaxed text-violet-200/35 italic">
  {selfAwareness}
</p>
    </div>

    {consciousness.length > 0 && (
      <div className="mt-5 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200/40">
          Inner Consciousness
        </p>

        {consciousness.map((item, index) => (
          <div
            key={index}
            className="
  rounded-2xl
  border border-white/5
  bg-white/[0.02]
  px-4 py-3
  animate-in
  fade-in
  slide-in-from-top-2
  duration-700
"
          >
            <p className="text-sm leading-relaxed text-white/60">
              {item}
            </p>
          </div>
        ))}
      </div>
    )}

  </div>
)}

<div
  ref={listRef}
  className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 pb-4"
>

  {messages.map((message) => (
    <div
      key={message.id}
      className={`group flex w-full mb-10 ${
        message.role === "user"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`
          relative max-w-[78%]
          px-7 py-5
          rounded-[2.2rem]
          text-[15px]
          leading-[1.9]
          tracking-[0.015em]
          transition-all duration-700
          backdrop-blur-2xl
          border
          shadow-[0_20px_80px_rgba(0,0,0,0.45)]
          group-hover:scale-[1.01]

          ${
            message.role === "user"
              ? `
                bg-white/[0.07]
                border-white/10
                text-white
                rounded-br-[0.8rem]
              `
              : `
                bg-gradient-to-br from-violet-500/[0.10] to-blue-500/[0.07]
                border-violet-300/10
                text-white/92
                rounded-bl-[0.8rem]
              `
          }
        `}
      >
        {message.role === "assistant" && (
          <div className="mb-3 flex items-center gap-2">
            <div
  className={`
    rounded-full transition-all duration-700

    ${
      innerState === "intense"
        ? "w-4 h-4 bg-red-300 animate-ping"
        : innerState === "calm"
        ? "w-2 h-2 bg-blue-300 animate-pulse"
        : innerState === "reflective"
        ? "w-3 h-3 bg-violet-300 animate-pulse"
        : innerState === "silent"
        ? "w-1.5 h-1.5 bg-white/40"
        : "w-3 h-3 bg-violet-300 animate-pulse"
    }
  `}
/>

            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-violet-200/45">
                INNER
              </p>

              <p className="text-[11px] text-violet-200/35 tracking-[0.18em] uppercase animate-pulse">
              {liveThinkingText}
              </p>
            </div>
          </div>
        )}

        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  ))}

  {isLoading && (
    <div className="flex justify-start">
    <div className="max-w-[75%] rounded-[2rem] rounded-bl-md border border-violet-400/10 bg-violet-500/[0.05] px-5 py-4">

<p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/30 mb-2">
INNER STATE · {transitionText}
</p>

<p
  className={`
    text-sm text-violet-100/40

    ${
      innerState === "intense"
        ? "animate-bounce"
        : innerState === "silent"
        ? ""
        : "animate-pulse"
    }
  `}
>
  {thinkingText}
</p>

</div> 
    </div>
  )}

  {error && (
    <p className="text-center text-sm text-red-300/80">
      {error}
    </p>
  )}
</div>

        <form
          onSubmit={handleSubmit}
          className="shrink-0 px-6 pb-6 pt-3 bg-gradient-to-t from-black/70 to-transparent"
        >
          <div className="flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.055] px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="relative w-10 h-10 rounded-full border border-violet-300/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-xl animate-pulse" />
              <div
  className={`
    relative w-2.5 h-2.5 rounded-full transition-all duration-700
    ${
      innerState === "calm"
        ? "bg-blue-300/80 shadow-[0_0_14px_rgba(147,197,253,0.9)]"
        : innerState === "reflective"
        ? "bg-violet-300/80 shadow-[0_0_14px_rgba(196,181,253,0.9)]"
        : innerState === "intense"
        ? "bg-red-300/80 shadow-[0_0_14px_rgba(252,165,165,0.9)]"
        : innerState === "silent"
        ? "bg-white/50 shadow-[0_0_14px_rgba(255,255,255,0.45)]"
        : "bg-violet-300/80 shadow-[0_0_14px_rgba(196,181,253,0.9)]"
    }
  `}
/>
            </div>

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Say what you actually feel..."
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white/90 outline-none placeholder:text-white/25"
            />

<button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-white/[0.08] px-4 py-2 text-sm text-white/55 transition hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:hover:bg-white/[0.08] disabled:hover:text-white/55"
        >
          Send
        </button>
      </div>
    </form>
  </div>
</main>
);
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/40 mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-400/70"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
} 