"use client";
import {
  protectModeByPlan,
  getCostWarningLevel,
} from "@/lib/costControl";
import {
  detectGlobalSignals,
  normalizeMemoryToEnglish,
} from "@/lib/globalSignals";
import { mergeMemoryLists } from "@/lib/memoryOptimizer";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  canSendMessage,
  getMaxMemoryCount,
  getMaxResponseDepth,
  shouldShowUpgradeHint,
  getPlanStatus,
  getMaxInputLength,
} from "@/lib/usageLimits";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type LongTermMemory = {
  entityName?: string;
entityType?: "wife" | "husband" | "son" | "daughter" | "dog" | "cat" | "family" | "friend" | "partner" | "other";
relationToUser?: string;
relationshipPriority?: number;
  type: string;
  memory: string;

  importance: number;
  emotionalWeight: number;

  repeatCount: number;

  createdAt: string;
  lastAccessed?: string;

  relationshipImpact?: number;
  emotionalLayer?: "fear" | "sadness" | "pressure" | "hope" | "anger" | "love" | "identity" | "neutral";
  emotionalTrigger?: string;
  emotionalIntensity?: number;
  category?:
  | "core_fact"
| "family"
| "pet"
| "birthday"
| "age"
| "location"
| "work"
    | "identity"
    | "emotion"
    | "goal"
    | "relationship"
    | "business"
    | "health"
    | "trauma"
    | "dream"
    | "belief"
    | "habit"
    | "project"
    | "other";
};

type InnerUserProfile = {
  communicationStyle: "short" | "balanced" | "expressive";
  emotionalState: "stable" | "vulnerable" | "stressed" | "focused";
  relationshipDepth: number;
  mainTopics: string[];
  dominantMood: "calm" | "low" | "intense" | "ambitious" | "unclear";
};

type InnerPersonalityStyle =
  | "warm_friend"
  | "direct_mentor"
  | "quiet_support"
  | "playful"
  | "cold_truth"
  | "spiritual_advisor"
  | "business_advisor";
  type PresenceState =
  | "calm"
  | "thinking"
  | "deep"
  | "emotional"
  | "analytical"
  | "protective";

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
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const [innerState, setInnerState] = useState<
    "calm" | "focused" | "reflective" | "intense" | "silent" | "present"
  >("present");
  const [personalityStyle, setPersonalityStyle] =
  useState<InnerPersonalityStyle>("warm_friend");
  const [relationshipDepth, setRelationshipDepth] = useState(0);
const [trustLevel, setTrustLevel] = useState(0);
const [attachmentLevel, setAttachmentLevel] = useState(0);
const [presenceState, setPresenceState] =
  useState<PresenceState>("calm");
  const [previousState, setPreviousState] = useState(innerState);
  const thinkingStates = {
    calm: "stabilizing emotional patterns",
    focused: "sharpening strategic focus",
    reflective: "exploring deeper meaning",
    intense: "processing emotional pressure",
    silent: "quietly observing",
    present: "synchronizing with your state",
  };
  
  const liveThinkingText =
  isLoading
    ? getPresenceText(presenceState)
    : thinkingStates[innerState] || "processing consciousness";
    const personalityMode =
  innerState === "intense"
    ? "direct_protective"
    : innerState === "silent"
    ? "minimal_grounding"
    : innerState === "focused"
    ? "strategic_focus"
    : innerState === "reflective"
    ? "deep_reflective"
    : innerState === "calm"
    ? "soft_clarity"
    : "balanced_presence";
    const selfAwarenessMap = {
      calm: "INNER senses emotional balance.",
      focused: "INNER is sharpening strategy and practical focus.",
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
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
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
const [thinkingMode, setThinkingMode] = useState<
  | "casual"
  | "reflective"
  | "analytical"
  | "strategic"
  | "emotional"
>("casual");
const [typingSpeed, setTypingSpeed] = useState(22);
const [presenceMood, setPresenceMood] = useState<
  "calm" | "deep" | "focused" | "emotional"
>("calm");
const [dreamLayer, setDreamLayer] = useState(
  "INNER has not entered dream synthesis yet."
);
const [lastUserActivity, setLastUserActivity] = useState(Date.now());
const [dailyMessages, setDailyMessages] = useState(() => {
  
  if (typeof window === "undefined") return 0;

  const saved = localStorage.getItem("inner_daily_messages");

  return saved ? Number(saved) : 0;
});
const [geniusUsedToday, setGeniusUsedToday] = useState(() => {
  if (typeof window === "undefined") return 0;

  const saved = localStorage.getItem("inner_genius_used_today");

  return saved ? Number(saved) : 0;
});

useEffect(() => {
  localStorage.setItem(
    "inner_genius_used_today",
    String(geniusUsedToday)
  );
}, [geniusUsedToday]);
useEffect(() => {
  localStorage.setItem(
    "inner_daily_messages",
    String(dailyMessages)
  );
}, [dailyMessages]);

useEffect(() => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem("inner_usage_date");

  if (savedDate !== today) {
    localStorage.setItem("inner_usage_date", today);
    localStorage.setItem("inner_daily_messages", "0");
    localStorage.setItem("inner_genius_used_today", "0");
    setDailyMessages(0);
    setGeniusUsedToday(0);
  }
}, []);

const userPlan = "premium";
const planStatus = getPlanStatus({
  plan: userPlan,
  dailyMessages,
});
const costWarningLevel = getCostWarningLevel({
  plan: userPlan,
  dailyMessages,
  geniusUsedToday,
});
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

    focused: [
      "prioritizing clarity",
      "mapping practical next steps",
      "reducing strategic noise",
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
  const [innerUserProfile, setInnerUserProfile] = useState<InnerUserProfile>(() => {
    if (typeof window === "undefined") {
      return {
        communicationStyle: "balanced",
        emotionalState: "stable",
        relationshipDepth: 0,
        mainTopics: [],
        dominantMood: "unclear",
      };
    }
  
    const saved = localStorage.getItem("inner-user-profile-light");
  
    return saved
      ? JSON.parse(saved)
      : {
          communicationStyle: "balanced",
          emotionalState: "stable",
          relationshipDepth: 0,
          mainTopics: [],
          dominantMood: "unclear",
        };
  });

  const [longTermMemories, setLongTermMemories] =
  useState<LongTermMemory[]>(() => {
    if (typeof window === "undefined") return [];
    
    const saved = localStorage.getItem(
      "inner_long_term_memories"
    );

    return saved ? JSON.parse(saved) : [];
    
  });
  useEffect(() => {
    const savedRelationshipDepth =
      localStorage.getItem("inner_relationship_depth");
  
    if (savedRelationshipDepth) {
      setRelationshipDepth(JSON.parse(savedRelationshipDepth));
    }
  
    const savedTrust =
      localStorage.getItem("inner_trust_level");
  
    if (savedTrust) {
      setTrustLevel(JSON.parse(savedTrust));
    }
  
    const savedAttachment =
      localStorage.getItem("inner_attachment_level");
  
    if (savedAttachment) {
      setAttachmentLevel(JSON.parse(savedAttachment));
    }
  }, []);

  useEffect(() => {
    async function loadPersistentMemories() {
      try {
        const res = await fetch("/api/memory/load");
        const data = await res.json();
  
        if (Array.isArray(data.memories)) {
          setLongTermMemories((prev) => {
            const merged = [...data.memories, ...prev];
  
            const unique = Array.from(
              new Map(
                merged.map((memory) => [
                  `${memory.type}-${memory.memory}`,
                  memory,
                ])
              ).values()
            );
  
            return unique.slice(0, 50);
          });
        }
      } catch (error) {
        console.error("Failed to load persistent memories:", error);
      }
    }
  
    loadPersistentMemories();
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "inner_long_term_memories",
      JSON.stringify(longTermMemories)
    );
  }, [longTermMemories]);
  
  useEffect(() => {
    if (!longTermMemories.length) return;
  
    const timeout = setTimeout(async () => {
      try {
        await fetch("/api/memory/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memories: longTermMemories.slice(0, 50).map((memory) => ({
              ...memory,
              memory: compressMemoryText(memory.memory),
            })),
          }),
        });
      } catch (error) {
        console.error("Memory sync failed:", error);
      }
    }, 1200);
  
    return () => clearTimeout(timeout);
  }, [longTermMemories]);
  useEffect(() => {
    localStorage.setItem(
      "inner_relationship_depth",
      JSON.stringify(relationshipDepth)
    );
  
    localStorage.setItem(
      "inner_trust_level",
      JSON.stringify(trustLevel)
    );
  
    localStorage.setItem(
      "inner_attachment_level",
      JSON.stringify(attachmentLevel)
    );
  }, [relationshipDepth, trustLevel, attachmentLevel]);
  const [topMemories, setTopMemories] = useState<LongTermMemory[]>([]);
  useEffect(() => {
    localStorage.setItem(
      "inner-user-profile-light",
      JSON.stringify(innerUserProfile)
    );
  }, [innerUserProfile]);

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
  
    if (innerState === "focused") {
      setVoiceConsciousness(
        "INNER voice becomes clearer, sharper, and more strategic."
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
            | "focused"
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
    return;
  
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
    return;
  
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
    return;
  
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
      focused: [
        "clarifying the next move",
        "filtering noise from strategy",
        "holding practical focus",
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
    return;

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
  function calculateMemoryImportance(text: string) {
    const lower = text.toLowerCase();

    let score = 1;

    const emotionalWords = [
      // English first — INNER is global by default.
      "alone",
      "lonely",
      "depressed",
      "fear",
      "anxiety",
      "love",
      "pain",
      "stress",
      "pressure",
      "dream",
      "future",
      "purpose",
      "suicide",
      "burnout",
      "exhausted",
      "lost",
      "hurt",

      // Polish support.
      "samot",
      "smut",
      "boję",
      "boje",
      "lęk",
      "lek",
      "depres",
      "stres",
      "presja",
      "sens",
      "zmęcz",
      "zmecz",

      // Global basics.
      "triste",
      "miedo",
      "ansiedad",
      "sozinho",
      "medo",
      "traurig",
      "angst",
      "seul",
      "peur",
      "anxiété",
      "anxiete",
    ];

    emotionalWords.forEach((word) => {
      if (lower.includes(word)) {
        score += 2;
      }
    });

    if (text.length > 220) {
      score += 1;
    }

    return Math.min(score, 10);
  }
  function shouldRememberMemory(type: string, memory: string) {
    const lower = memory.toLowerCase();
    const importance = calculateMemoryImportance(memory);
  
    if (type === "identity") return true;
    if (type === "important_story") return true;
    if (type === "life_goal") return true;
  
    if (importance >= 6) return true;
  
    if (
      lower.includes("remember this") ||
      lower.includes("zapamiętaj") ||
      lower.includes("zapamietaj") ||
      lower.includes("important") ||
      lower.includes("ważne") ||
      lower.includes("wazne")
    ) {
      return true;
    }
  
    if (
      lower.includes("always") ||
      lower.includes("never") ||
      lower.includes("często") ||
      lower.includes("czesto") ||
      lower.includes("zawsze") ||
      lower.includes("nigdy")
    ) {
      return true;
    }
  
    return false;
  }
  function compressMemoryText(memory: string) {
    const text = normalizeMemoryToEnglish(memory.trim());
  
    if (text.length <= 120) return text;
  
    return text
      .replace(/zapamiętaj, że/gi, "")
      .replace(/zapamietaj, ze/gi, "")
      .replace(/remember that/gi, "")
      .replace(/remember this/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  }
  function detectEmotionalLayer(text: string) {
    const lower = text.toLowerCase();
  
    if (lower.includes("fear") || lower.includes("afraid") || lower.includes("boję") || lower.includes("boje") || lower.includes("lęk") || lower.includes("lek")) {
      return { layer: "fear", trigger: "fear/anxiety", intensity: 8 };
    }
  
    if (lower.includes("sad") || lower.includes("lonely") || lower.includes("alone") || lower.includes("smut") || lower.includes("samot")) {
      return { layer: "sadness", trigger: "sadness/loneliness", intensity: 7 };
    }
  
    if (lower.includes("stress") || lower.includes("pressure") || lower.includes("presja") || lower.includes("stres")) {
      return { layer: "pressure", trigger: "stress/pressure", intensity: 7 };
    }
  
    if (lower.includes("dream") || lower.includes("goal") || lower.includes("hope") || lower.includes("marzenie") || lower.includes("cel")) {
      return { layer: "hope", trigger: "goal/future", intensity: 6 };
    }
  
    if (lower.includes("angry") || lower.includes("wkur") || lower.includes("zły") || lower.includes("zly")) {
      return { layer: "anger", trigger: "anger/frustration", intensity: 6 };
    }
  
    if (lower.includes("love") || lower.includes("kocham") || lower.includes("ważny") || lower.includes("wazny")) {
      return { layer: "love", trigger: "attachment/value", intensity: 6 };
    }
  
    if (lower.includes("my name is") || lower.includes("mam na imię") || lower.includes("nazywam się")) {
      return { layer: "identity", trigger: "identity", intensity: 9 };
    }
  
    return { layer: "neutral", trigger: "general", intensity: 1 };
  }
  function extractCoreFacts(text: string) {
    const facts: { type: string; memory: string }[] = [];
    const lower = text.toLowerCase();
  
    const nameMatch =
      text.match(/mam na imie ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/mam na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/my name is ([a-zA-Z]+)/i);
  
    if (nameMatch?.[1]) {
      facts.push({
        type: "identity",
        memory: `User's name is ${nameMatch[1]}.`,
      });
    }
  
    const wifeMatch =
      text.match(/żonę ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/zone ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i);
  
    if (wifeMatch?.[1]) {
      facts.push({
        type: "core_fact",
        memory: `User's wife is named ${wifeMatch[1]}.`,
      });
    }
  
    const sonMatch =
      text.match(/syna ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/son named ([a-zA-Z]+)/i);
  
    if (sonMatch?.[1]) {
      facts.push({
        type: "core_fact",
        memory: `User's son is named ${sonMatch[1]}.`,
      });
    }
  
    const dogMatch =
      text.match(/psa o imieniu ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/dog named ([a-zA-Z]+)/i);
  
    if (dogMatch?.[1]) {
      facts.push({
        type: "core_fact",
        memory: `User's dog is named ${dogMatch[1]}.`,
      });
    }
  
    const catsMatch = text.match(/mam też (\d+) kot/i) || text.match(/mam tez (\d+) kot/i);
  
    if (catsMatch?.[1]) {
      facts.push({
        type: "core_fact",
        memory: `User has ${catsMatch[1]} cats.`,
      });
    }
  
    const birthdayMatch =
      text.match(/urodziny mam ([^.]+)/i) ||
      text.match(/my birthday is ([^.]+)/i);
  
    if (birthdayMatch?.[1]) {
      facts.push({
        type: "core_fact",
        memory: `User's birthday is ${birthdayMatch[1].trim()}.`,
      });
    }
  
    const cityMatch =
      text.match(/mieszkam w ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/i live in ([a-zA-Z]+)/i);
  
    if (cityMatch?.[1]) {
      facts.push({
        type: "core_fact",
        memory: `User lives in ${cityMatch[1]}.`,
      });
    }
  
    return facts;
  }
  function extractRelationshipGraph(text: string) {
    const relationships: LongTermMemory[] = [];
  
    const wifeMatch =
      text.match(/żonę ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/zone ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/wife named ([a-zA-Z]+)/i);
  
    if (wifeMatch?.[1]) {
      relationships.push({
        type: "core_fact",
        memory: `User's wife is named ${wifeMatch[1]}.`,
        category: "relationship",
        importance: 10,
        emotionalWeight: 10,
        repeatCount: 1,
        relationshipImpact: 10,
        emotionalLayer: "love",
        emotionalTrigger: "wife/family",
        emotionalIntensity: 10,
  
        entityName: wifeMatch[1],
        entityType: "wife",
        relationToUser: "wife",
        relationshipPriority: 10,
  
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      });
    }
  
    const sonMatch =
      text.match(/syna ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/son named ([a-zA-Z]+)/i);
  
    if (sonMatch?.[1]) {
      relationships.push({
        type: "core_fact",
        memory: `User's son is named ${sonMatch[1]}.`,
        category: "family",
        importance: 10,
        emotionalWeight: 10,
        repeatCount: 1,
        relationshipImpact: 10,
        emotionalLayer: "love",
        emotionalTrigger: "child/family",
        emotionalIntensity: 10,
  
        entityName: sonMatch[1],
        entityType: "son",
        relationToUser: "son",
        relationshipPriority: 10,
  
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      });
    }
  
    const dogMatch =
      text.match(/psa o imieniu ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/dog named ([a-zA-Z]+)/i);
  
    if (dogMatch?.[1]) {
      relationships.push({
        type: "core_fact",
        memory: `User's dog is named ${dogMatch[1]}.`,
        category: "pet",
        importance: 8,
        emotionalWeight: 8,
        repeatCount: 1,
        relationshipImpact: 8,
        emotionalLayer: "love",
        emotionalTrigger: "pet/attachment",
        emotionalIntensity: 8,
  
        entityName: dogMatch[1],
        entityType: "dog",
        relationToUser: "dog",
        relationshipPriority: 8,
  
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      });
    }
  
    return relationships;
  }
  function sortMemoriesByWeight(memories: LongTermMemory[]) {
    return [...memories].sort((a, b) => {
      const scoreA =
        (a.importance || 1) +
        (a.emotionalWeight || 1) +
        (a.repeatCount || 1);

      const scoreB =
        (b.importance || 1) +
        (b.emotionalWeight || 1) +
        (b.repeatCount || 1);

      return scoreB - scoreA;
    });
  }

  function addLongTermMemory(type: string, memory: string) {
    const compressedMemory = compressMemoryText(memory);
    const emotionalLayer = detectEmotionalLayer(compressedMemory);
    setLongTermMemories((prev) => {
      if (!shouldRememberMemory(type, memory)) {
        return prev;
      }
      const existingIndex = prev.findIndex(
        (item) => item.type === type && item.memory === compressedMemory
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];

        updated.splice(existingIndex, 1);
        const importance = calculateMemoryImportance(memory);
        return sortMemoriesByWeight([
          {
            type,
            memory: compressedMemory,
            importance,
            emotionalLayer: emotionalLayer.layer,
emotionalTrigger: emotionalLayer.trigger,
emotionalIntensity: emotionalLayer.intensity,
            emotionalWeight: importance,
        
            relationshipImpact:
              type === "identity" ||
              type === "important_story" ||
              type === "life_goal"
                ? 5
                : type === "emotional_pattern"
                ? 3
                : 1,
        
            repeatCount: 1,
        
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
          },
        
          ...prev,
        ]).slice(0, 50);
      }

      const importance = calculateMemoryImportance(memory);

      return sortMemoriesByWeight([
        {
          type,
          memory: compressedMemory,
          importance,
          emotionalWeight: importance,
          repeatCount: 1,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
        },
        ...prev,
      ]).slice(0, 50);
    });
  }

  function extractMemoryFromText(text: string) {
    const lower = text.toLowerCase();
    
    const coreFacts = extractCoreFacts(text);

    coreFacts.forEach((fact) => {
      addLongTermMemory(fact.type, fact.memory);
    });

    const relationshipGraph = extractRelationshipGraph(text);

relationshipGraph.forEach((relationship) => {
  setLongTermMemories((prev) => {
    const exists = prev.some(
      (item) =>
        item.entityName === relationship.entityName &&
        item.relationToUser === relationship.relationToUser
    );

    if (exists) return prev;

    return sortMemoriesByWeight([
      relationship,
      ...prev,
    ]).slice(0, 50);
  });
});
    const nameMatch =
      text.match(/my name is ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/i am ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/mam na imię ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i) ||
      text.match(/nazywam się ([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/i);

    if (nameMatch?.[1]) {
      addLongTermMemory("identity", `User's name is ${nameMatch[1]}.`);
    }

    if (
      lower.includes("important story") ||
      lower.includes("ważna historia") ||
      lower.includes("wazna historia") ||
      lower.includes("remember this") ||
      lower.includes("zapamiętaj to") ||
      lower.includes("zapamietaj to")
    ) {
      addLongTermMemory("important_story", text);
    }

    if (
      lower.includes("my goal is") ||
      lower.includes("my dream is") ||
      lower.includes("moim celem jest") ||
      lower.includes("moje marzenie")
    ) {
      addLongTermMemory("life_goal", text);
    }

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
    setRelationshipDepth((prev) =>
      Math.min(prev + 0.2, 100)
    );
    
    if (
      lower.includes("trust") ||
      lower.includes("believe") ||
      lower.includes("friend") ||
      lower.includes("love") ||
      lower.includes("care") ||
      lower.includes("ufam") ||
      lower.includes("przyjac")
    ) {
      setTrustLevel((prev) =>
        Math.min(prev + 1, 100)
      );
    }
    
    if (
      lower.includes("alone") ||
      lower.includes("lonely") ||
      lower.includes("sad") ||
      lower.includes("hurt") ||
      lower.includes("samot") ||
      lower.includes("smut")
    ) {
      setAttachmentLevel((prev) =>
        Math.min(prev + 0.8, 100)
      );
    }
  }

  function getRelevantMemories(userMessage: string) {
    const lower = userMessage.toLowerCase();
    const now = Date.now();
  
    return [...longTermMemories]
      .map((memory) => {
        const memoryText = memory.memory.toLowerCase();
  
        const ageDays = memory.createdAt
          ? Math.max(
              1,
              (now - new Date(memory.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 1;
  
        const recencyBoost = Math.max(0, 3 - ageDays * 0.15);
  
        const baseScore =
          (memory.importance || 1) * 1.4 +
          (memory.emotionalWeight || 1) * 1.6 +
          (memory.repeatCount || 1) * 1.2 +
          (memory.relationshipImpact || 0) * 1.8 +
          (memory.emotionalIntensity || 0) * 1.5 +
          recencyBoost;
  
        let relevanceBoost = 0;
  
        if (
          memory.type === "identity" &&
          (lower.includes("name") ||
            lower.includes("imię") ||
            lower.includes("imie") ||
            lower.includes("who am i") ||
            lower.includes("kim jestem"))
        ) {
          relevanceBoost += 100;
        }
  
        if (
          memory.category === "goal" ||
          memory.type === "life_goal"
        ) {
          if (
            lower.includes("goal") ||
            lower.includes("dream") ||
            lower.includes("future") ||
            lower.includes("cel") ||
            lower.includes("marzenie") ||
            lower.includes("przyszłość") ||
            lower.includes("przyszlosc")
          ) {
            relevanceBoost += 8;
          }
        }
  
        if (
          memory.category === "emotion" ||
          memory.type === "emotional_pattern"
        ) {
          if (
            lower.includes("feel") ||
            lower.includes("emotion") ||
            lower.includes("stress") ||
            lower.includes("alone") ||
            lower.includes("lonely") ||
            lower.includes("czuję") ||
            lower.includes("czuje") ||
            lower.includes("stres") ||
            lower.includes("samot")
          ) {
            relevanceBoost += 8;
          }
        }
  
        if (
          memory.category === "project" ||
          memory.type === "project_context"
        ) {
          if (
            lower.includes("inner") ||
            lower.includes("project") ||
            lower.includes("app") ||
            lower.includes("apka") ||
            lower.includes("aplikacja")
          ) {
            relevanceBoost += 7;
          }
        }
  
        if (
          memory.category === "business" ||
          memory.type === "life_context"
        ) {
          if (
            lower.includes("business") ||
            lower.includes("company") ||
            lower.includes("money") ||
            lower.includes("finance") ||
            lower.includes("biznes") ||
            lower.includes("firma") ||
            lower.includes("finanse")
          ) {
            relevanceBoost += 7;
          }
        }
  
        const words = lower
          .split(/\s+/)
          .filter((word) => word.length > 3);
  
        const keywordOverlap = words.filter((word) =>
          memoryText.includes(word)
        ).length;
  
        relevanceBoost += Math.min(keywordOverlap * 1.5, 6);
  
        const finalScore =
        baseScore +
        relevanceBoost +
        (memory.type === "identity" ? 500 : 0) +
        (memory.emotionalLayer === "identity" ? 500 : 0) +
        (memory.emotionalLayer === "love" ? 250 : 0) +
        (memory.memory.toLowerCase().includes("radek") ? 500 : 0) +
        (memory.memory.toLowerCase().includes("kocham") ? 250 : 0) +
        (memory.memory.toLowerCase().includes("love") ? 250 : 0);
  
        return {
          ...memory,
          relevanceScore: finalScore,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  function clearMemory() {
    localStorage.removeItem("inner-chat-memory");
    localStorage.removeItem("inner-user-profile");
    localStorage.removeItem("inner-long-term-memory");
    localStorage.removeItem("inner_long_term_memories");
    localStorage.removeItem("inner-user-profile-light");

    setMessages(SEED);
    setUserProfile([]);
    setLongTermMemories([]);
    setTopMemories([]);
    setConsciousness([]);
    setError(null);
  }
  function simulateInnerState(text: string) {
    const detectedState = detectInnerState(text);
    setInnerState(detectedState);
  }

  function detectInnerState(message: string): "calm" | "focused" | "reflective" | "intense" | "silent" | "present" {
    const lower = message.toLowerCase();

    const reflectiveWords = [
      // English first — INNER is global by default.
      "lonely", "alone", "sad", "afraid", "scared", "anxious", "anxiety",
      "depressed", "empty", "lost", "hurt", "confused", "overthinking",
      "tired", "exhausted", "burned out", "burnout", "meaning", "purpose",

      // Polish support.
      "samot", "smut", "boję", "boje", "lęk", "lek", "depres", "czuję", "czuje",
      "pusto", "zagub", "zmęcz", "zmecz", "sens", "psychik",

      // Global basics.
      "triste", "solo", "sola", "miedo", "ansiedad",
      "sozinho", "medo", "ansiedade", "traurig", "allein", "angst",
      "seul", "peur", "anxiété", "anxiete",
    ];

    const focusedWords = [
      // English first.
      "strategy", "business", "plan", "company", "project", "startup",
      "goal", "goals", "money", "finance", "growth", "marketing",
      "sales", "product", "roadmap", "architecture", "investor", "pricing",

      // Polish support.
      "strategia", "biznes", "plan", "firma", "projekt", "sprzedaż", "sprzedaz",
      "marketing", "finanse", "wzrost", "produkt", "architektura",

      // Global basics.
      "estrategia", "negocio", "empresa", "proyecto", "estratégia", "negócio",
      "projeto", "strategie", "geschäft", "geschaft", "unternehmen", "stratégie",
      "entreprise", "projet",
    ];

    const intenseWords = [
      // English first.
      "angry", "furious", "hate", "rage", "aggressive", "pissed", "mad",
      "frustrated", "annoyed",

      // Polish support.
      "wkur", "nienaw", "agres", "zły", "zla", "złość", "zlosc", "frustr",

      // Global basics.
      "enojado", "odio", "rabia", "raiva", "ódio", "odio", "wütend", "wutend",
      "hass", "colère", "colere", "haine",
    ];

    if (intenseWords.some((word) => lower.includes(word))) {
      return "intense";
    }

    if (reflectiveWords.some((word) => lower.includes(word))) {
      return "reflective";
    }

    if (focusedWords.some((word) => lower.includes(word))) {
      return "focused";
    }

    return "calm";
  }
  function detectPersonalityStyle(text: string): InnerPersonalityStyle {
    const lower = text.toLowerCase();
    const signals = detectGlobalSignals(text);
  
    // BUSINESS MODE
    if (
      signals.includes("business") ||
      lower.includes("business") ||
      lower.includes("money") ||
      lower.includes("strategy") ||
      lower.includes("biznes") ||
      lower.includes("finanse")
    ) {
      return "business_advisor";
    }
  
    // SPIRITUAL MODE
    if (
      signals.includes("spiritual") ||
      lower.includes("god") ||
      lower.includes("soul") ||
      lower.includes("meaning") ||
      lower.includes("duch") ||
      lower.includes("sens życia")
    ) {
      return "spiritual_advisor";
    }
  
    // EMOTIONAL SUPPORT
    if (
      signals.includes("loneliness") ||
      signals.includes("sadness") ||
      lower.includes("sad") ||
      lower.includes("alone") ||
      lower.includes("lonely") ||
      lower.includes("smut") ||
      lower.includes("samot")
    ) {
      return "quiet_support";
    }
  
    // ANGER / HARD TRUTH
    if (
      signals.includes("anger") ||
      lower.includes("be honest") ||
      lower.includes("truth") ||
      lower.includes("powiedz prawdę") ||
      lower.includes("bez ściemy")
    ) {
      return "cold_truth";
    }
  
    // PLAYFUL MODE
    if (
      lower.includes("joke") ||
      lower.includes("funny") ||
      lower.includes("żart") ||
      lower.includes("śmiesz")
    ) {
      return "playful";
    }
  
    // MENTOR MODE
    if (
      lower.includes("problem") ||
      lower.includes("decision") ||
      lower.includes("decyzja")
    ) {
      return "direct_mentor";
    }
  
    return "warm_friend";
  }
  function detectPresenceState(text: string): PresenceState {
    const lower = text.toLowerCase();
    const signals = detectGlobalSignals(text);
  
    if (
      signals.includes("fear") ||
      signals.includes("sadness") ||
      signals.includes("loneliness")
    ) {
      return "emotional";
    }
  
    if (
      lower.includes("analyze") ||
      lower.includes("strategy") ||
      lower.includes("business") ||
      lower.includes("przeanalizuj") ||
      lower.includes("strategia")
    ) {
      return "analytical";
    }
  
    if (
      lower.includes("deep") ||
      lower.includes("deeper") ||
      lower.includes("głębiej") ||
      lower.includes("glebiej")
    ) {
      return "deep";
    }
  
    if (
      lower.includes("help me") ||
      lower.includes("boję") ||
      lower.includes("boje") ||
      lower.includes("protect")
    ) {
      return "protective";
    }
  
    return "thinking";
  }
  function getPresenceText(state: PresenceState) {
    switch (state) {
      case "deep":
        return "thinking deeper...";
      case "emotional":
        return "trying to understand you...";
      case "analytical":
        return "analyzing the pattern...";
      case "protective":
        return "staying with you...";
      case "thinking":
        return "thinking...";
      default:
        return "synchronizing with your state";
    }
  }
  function getChatMode(text: string): "fast" | "core" | "smart" | "genius" {
    const lower = text.toLowerCase();
    const length = text.length;

    const deepWords = [
      "deep analysis", "go deeper", "full analysis", "complete analysis",
      "pełna analiza", "pelna analiza", "kompletna analiza",
    ];

    const smartWords = [
      // English first.
      "analyze", "analyse", "strategy", "debug", "code", "architecture",
      "roadmap", "business model", "startup", "financial", "marketing plan",

      // Polish support.
      "przeanalizuj", "analiza", "strategia", "debug", "kod", "architektura",
      "model biznesowy", "plan marketingowy",
    ];

    const coreWords = [
      // English first.
      "problem", "feel", "feeling", "afraid", "scared", "anxious", "emotion",
      "meaning", "purpose", "confused", "lost", "alone", "lonely",

      // Polish support.
      "problem", "czuję", "czuje", "boję", "boje", "emoc", "sens", "samot",
      "zagub", "lęk", "lek",
    ];

    if (deepWords.some((word) => lower.includes(word))) {
      return "genius";
    }

    if (length > 700 || smartWords.some((word) => lower.includes(word))) {
      return "smart";
    }

    if (length > 160 || coreWords.some((word) => lower.includes(word))) {
      return "core";
    }

    return "fast";
  }


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !canSendMessage({
        plan: userPlan,
        dailyMessages,
      })
    ) {
      setError(
        "Free limit reached. Upgrade to Premium to continue."
      );
    
      return;
    }
    if (input.length > getMaxInputLength(userPlan)) {
      setError(
        "This message is too long for the free plan. Premium supports deeper, longer conversations."
      );
    
      return;
    }
    setLastUserActivity(Date.now());

if (presenceStatus === "away" || presenceStatus === "quiet") {
  setPresenceStatus("returning");
}
    const lower = input.toLowerCase();
    if (
      lower.includes("psychik") ||
      lower.includes("życie") ||
      lower.includes("sens") ||
      lower.includes("samot") ||
      lower.includes("depres") ||
      lower.includes("emoc")
    ) {
      setResponseDepth("deep");
      setThinkingMode("reflective");
    }
    
    else if (
      lower.includes("biznes") ||
      lower.includes("strateg") ||
      lower.includes("marketing") ||
      lower.includes("startup")
    ) {
      setResponseDepth("deep");
      setThinkingMode("strategic");
    }
    
    else if (
      lower.includes("bug") ||
      lower.includes("kod") ||
      lower.includes("next") ||
      lower.includes("react") ||
      lower.includes("api")
    ) {
      setResponseDepth("normal");
      setThinkingMode("analytical");
    }
    
    else if (
      lower.includes("czuję") ||
      lower.includes("boję") ||
      lower.includes("smut") ||
      lower.includes("lęk")
    ) {
      setResponseDepth("normal");
      setThinkingMode("emotional");
    }
    
    else {
      setResponseDepth("minimal");
      setThinkingMode("casual");
    }
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
    
    const detectedPresenceState = detectPresenceState(text);
    setPresenceState(detectedPresenceState);
    
    const detectedPersonalityStyle = detectPersonalityStyle(text);
    setPersonalityStyle(detectedPersonalityStyle);
    
    const selectedMemories = getRelevantMemories(text);
    setTopMemories(selectedMemories);
    setLastUserMessage(text);

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
      latestMessage.includes("strategy") ||
      latestMessage.includes("business") ||
      latestMessage.includes("startup") ||
      latestMessage.includes("marketing") ||
      latestMessage.includes("plan") ||
      latestMessage.includes("strategia") ||
      latestMessage.includes("biznes") ||
      latestMessage.includes("firma")
    ) {
      setPreviousState(innerState);
      setInnerState("focused");
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

  

    let responseDelay = 250;

    if (presenceState === "emotional") {
      responseDelay = 750;
    } else if (presenceState === "protective") {
      responseDelay = 650;
    } else if (presenceState === "deep") {
      responseDelay = 900;
    } else if (presenceState === "analytical") {
      responseDelay = 550;
    } else if (latestMessage.length > 180) {
      responseDelay = 450;
    }

    const thinkingStates = [
      "INNER is thinking...",
      "INNER is reflecting...",
      "INNER is processing...",
      "INNER is noticing something...",
      "INNER is here...",
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
      console.time("FRONTEND_CHAT_TIME");
      const forcedCheapMode =
  costWarningLevel === "warning" ||
  costWarningLevel === "critical";
    
  const protectedMode = forcedCheapMode
  ? "fast"
  : protectModeByPlan({
      requestedMode: getChatMode(text),
      plan: userPlan,
      geniusUsedToday,
      dailyMessages,
    });
      
      if (protectedMode === "genius") {
        setGeniusUsedToday((prev) => prev + 1);
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: protectedMode, 
          messages: nextMessages
            .slice(-8)
            .map(({ role, content }) => ({
              role,
              content,
            })),
          userProfile,
          memories: selectedMemories,
          personalityMode,
          personalityStyle,
          innerState,
          emotionScore,
          relationshipDepth,
          trustLevel,
          attachmentLevel,
          silenceMode,
          responseDepth: getMaxResponseDepth(userPlan),
          thinkingMode,
          relationshipStage,
          presenceStatus,
          voiceConsciousness,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }
      const data = await res.json();
      console.timeEnd("FRONTEND_CHAT_TIME");
      setDailyMessages((prev) => prev + 1);
      const nextDailyMessages = dailyMessages + 1;

if (
  shouldShowUpgradeHint({
    plan: userPlan,
    dailyMessages: nextDailyMessages,
  })
) {
  setError(
    "Premium unlocks deeper memory, longer conversations, and more advanced INNER reasoning."
  );
}
      if (data.memoryCandidate) {
        setLongTermMemories((prev: any[]) => {
          const merged = mergeMemoryLists(
            prev,
            data.memoryCandidate
          );
        
          return merged.slice(
            -getMaxMemoryCount(userPlan)
          );
        });
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
      setTimeout(() => {
        setPresenceState("calm");
      }, 900);
    }
  }

  async function handleGoDeeper() {
    if (!lastUserMessage || isLoading) return;
  
    setIsLoading(true);
    setError(null);
    setThinkingText("INNER is going deeper...");
    setPresenceState("deep");
    setTypingSpeed(34);
    setPresenceMood("deep");
  
    try {
      const deeperMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: `Go deeper on this: ${lastUserMessage}`,
      };
  
      const nextMessages = [...messages, deeperMessage];
  
      setMessages(nextMessages);
  
      const protectedMode = protectModeByPlan({
        requestedMode: "smart",
        plan: userPlan,
        geniusUsedToday,
        dailyMessages,
      });
  
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: protectedMode,
          messages: nextMessages.slice(-8).map(({ role, content }) => ({
            role,
            content,
          })),
          userProfile,
          memories: getRelevantMemories(lastUserMessage),
          personalityMode,
          personalityStyle,
          innerState,
          emotionScore,
          relationshipDepth,
          trustLevel,
          attachmentLevel,
          silenceMode,
          responseDepth: "deep",
          thinkingMode: "analytical",
          relationshipStage,
          presenceStatus,
          voiceConsciousness,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("GO DEEPER API ERROR:", data);
        throw new Error(data?.error || "Deep analysis failed");
      }
  
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || data.reply || "I went deeper, but the response was empty.",
      };
  
      setMessages((prev) => [...prev, assistantMessage]);
      setError(null);
    } catch (err) {
      console.error("GO DEEPER FRONTEND ERROR:", err);
      setError(err instanceof Error ? err.message : "Deep analysis failed.");
    } finally {
      setThinkingText("INNER is thinking...");
      setIsLoading(false);
      setPresenceState("calm");
      setTypingSpeed(22);
      setPresenceMood("calm");
      scrollToBottom();
    }
  }

  async function handleDeepAnalysis() {
    if (!lastUserMessage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setThinkingText("INNER is entering deep analysis...");

    try {
      const deepMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: `Deep analysis on this: ${lastUserMessage}`,
      };

      const nextMessages = [...messages, deepMessage];

      setMessages(nextMessages);
      console.log("FRONTEND ABOUT TO CALL /api/chat", {
        text,
        protectedMode,
      });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "genius",
          messages: nextMessages.slice(-8).map(({ role, content }) => ({
            role,
            content,
          })),
          userProfile,
          memories: getRelevantMemories(lastUserMessage),
          personalityMode,
          innerState,
          emotionScore,
          silenceMode,
          responseDepth: "deep",
          thinkingMode: "strategic",
          relationshipStage,
          presenceStatus,
          voiceConsciousness,
        }),
      });

      if (!res.ok) {
        throw new Error("Deep analysis failed");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.memoryCandidate) {
        setLongTermMemories((prev: LongTermMemory[]) => {
          const merged = mergeMemoryLists(prev, data.memoryCandidate);
          return sortMemoriesByWeight(merged as LongTermMemory[]).slice(
            0,
            getMaxMemoryCount(userPlan)
          );
        });
      }
    } catch {
      setError("Deep analysis failed.");
    } finally {
      setThinkingText("INNER is thinking...");
      setIsLoading(false);
      setPresenceState("calm");
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
        : innerState === "focused"
        ? "bg-emerald-950/20"
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
          ${innerState === "focused" ? "bg-emerald-400/30 scale-105" : ""}
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
            ${innerState === "focused" ? "bg-emerald-400/20 scale-105" : ""}
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
            ${innerState === "focused" ? "border-emerald-300/30" : ""}
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
        : innerState === "focused"
        ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]"
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
      <div className="mt-1 text-[10px] text-white/40 tracking-[0.18em] uppercase">
  {!hasMounted
    ? "loading usage..."
    : planStatus.isPremium
    ? "INNER Premium active"
    : `${planStatus.remainingMessages} free messages left today`}
</div>

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
</div>
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
        : innerState === "focused"
        ? "w-3 h-3 bg-emerald-300 animate-pulse"
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
{costWarningLevel === "warning" && (
  <div className="text-[10px] text-yellow-300/70 px-3 py-1">
    INNER is conserving energy to stay responsive today.
  </div>
)}

{costWarningLevel === "critical" && (
  <div className="text-[10px] text-red-300/70 px-3 py-1">
    Daily deep reasoning limit reached. INNER is using lightweight mode.
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
          className="shrink-0 px-5 pb-5 pt-3 bg-gradient-to-t from-black/75 to-transparent"
        >
          <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="flex items-start gap-3">
              <div className="relative mt-1 w-10 h-10 shrink-0 rounded-full border border-violet-300/20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-xl animate-pulse" />
                <div
                  className={`
                    relative w-2.5 h-2.5 rounded-full transition-all duration-700
                    ${
                      innerState === "calm"
                        ? "bg-blue-300/80 shadow-[0_0_14px_rgba(147,197,253,0.9)]"
                        : innerState === "focused"
                        ? "bg-emerald-300/80 shadow-[0_0_14px_rgba(110,231,183,0.9)]"
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

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
                  }
                }}
                placeholder="Say what you actually feel..."
                rows={2}
                className="min-h-[58px] max-h-[130px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-white/90 outline-none placeholder:text-white/25"
              />
            </div>

            <div className="flex justify-end gap-2 pl-[52px]">
              <button
                type="button"
                onClick={handleGoDeeper}
                disabled={isLoading || !lastUserMessage}
                className="rounded-full bg-violet-500/[0.18] px-4 py-2 text-sm text-violet-100/75 transition hover:bg-violet-500/[0.28] disabled:opacity-30"
              >
                Go deeper
              </button>

              <button
                type="button"
                onClick={handleDeepAnalysis}
                disabled={isLoading || !lastUserMessage}
                className="rounded-full bg-white/[0.07] px-4 py-2 text-sm text-white/60 transition hover:bg-white/[0.13] disabled:opacity-30"
              >
                Deep
              </button>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-white/[0.1] px-5 py-2 text-sm text-white/70 transition hover:bg-white/[0.16] hover:text-white disabled:opacity-30 disabled:hover:bg-white/[0.1] disabled:hover:text-white/70"
              >
                Send
              </button>
            </div>
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
