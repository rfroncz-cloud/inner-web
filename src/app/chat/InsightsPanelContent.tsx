"use client";

import { useEffect, useState } from "react";

type LongTermMemory = {
  type: string;
  memory: string;
};

type EmotionScore = {
  stress: number;
  clarity: number;
  energy: number;
};

type InsightsPanelProps = {
  memoryInsight: string;
  memoryCards: string[];
  userProfile: string[];
  longTermMemories: LongTermMemory[];
  emotionScore: EmotionScore;
  attachmentScore: number;
  voiceConsciousness: string;
  presenceStatus: string;
  predictiveEmotion: string;
  dreamLayer: string;
  relationshipStage: string;
  responseDepth: string;
  silenceMode: boolean;
  innerThought: string;
  consciousness: string[];
  auraIntensity: string;
  personalityMode: string;
  selfAwareness: string;
};

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-white/40">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-violet-400/70 transition-all duration-700"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-violet-300/10 bg-violet-500/[0.03] px-5 py-5">
      <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-violet-200/40">
        {title}
      </p>
      {children}
    </section>
  );
}

export function InsightsPanelContent({
  memoryInsight,
  memoryCards,
  userProfile,
  longTermMemories,
  emotionScore,
  attachmentScore,
  voiceConsciousness,
  presenceStatus,
  predictiveEmotion,
  dreamLayer,
  relationshipStage,
  responseDepth,
  silenceMode,
  innerThought,
  consciousness,
  auraIntensity,
  personalityMode,
  selfAwareness,
}: InsightsPanelProps) {
  // Mounted guard so client-side data doesn't desync with SSR markup.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-5">
      <SectionCard title="Memory Insight">
        <p className="text-sm leading-relaxed text-white/55">{memoryInsight}</p>

        {memoryCards.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {memoryCards.map((card, index) => (
              <div
                key={`${card}-${index}`}
                className="rounded-full border border-violet-300/10 bg-violet-500/[0.05] px-3 py-1.5"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-violet-100/55">
                  {card}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {mounted && userProfile.length > 0 && (
        <SectionCard title="User Profile">
          <div className="space-y-2.5">
            {userProfile.map((memory, index) => (
              <p
                key={`${memory}-${index}`}
                className="text-sm leading-relaxed text-white/55"
              >
                {memory}
              </p>
            ))}
          </div>
        </SectionCard>
      )}

      {mounted && longTermMemories.length > 0 && (
        <SectionCard title="Long-Term Memory">
          <div className="space-y-3">
            {longTermMemories.slice(0, 8).map((memory, index) => (
              <div key={`${memory.type}-${index}`}>
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-violet-300/30">
                  {memory.type}
                </p>
                <p className="text-sm leading-relaxed text-white/50">
                  {memory.memory}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Emotional Metrics">
        <div className="space-y-4">
          <MetricBar label="Stress" value={emotionScore.stress} />
          <MetricBar label="Mental Clarity" value={emotionScore.clarity} />
          <MetricBar label="Energy" value={emotionScore.energy} />
          <MetricBar label="Attachment" value={attachmentScore} />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-white/35">
          INNER is slowly adapting to the emotional rhythm of this relationship.
        </p>
      </SectionCard>

      <SectionCard title="Current Thought">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">
          personality mode · {personalityMode}
        </p>
        <p className="mt-3 text-sm leading-relaxed italic text-white/55">
          {innerThought}
        </p>
        <p className="mt-3 text-xs italic leading-relaxed text-violet-200/35">
          {selfAwareness}
        </p>
      </SectionCard>

      <SectionCard title="Predictive Emotion Reading">
        <p className="text-sm italic leading-relaxed text-white/55">
          {predictiveEmotion}
        </p>
      </SectionCard>

      <SectionCard title="Voice Consciousness">
        <p className="text-sm italic leading-relaxed text-white/55">
          {voiceConsciousness}
        </p>
      </SectionCard>

      <SectionCard title="AI Presence">
        <p className="text-sm italic leading-relaxed text-white/55">
          User presence · {presenceStatus}
        </p>
      </SectionCard>

      <SectionCard title="Emotional Aura">
        <p className="text-sm italic leading-relaxed text-white/55">
          INNER aura intensity · {auraIntensity}
        </p>
      </SectionCard>

      <SectionCard title="Relationship">
        <p className="text-sm italic leading-relaxed text-white/55">
          INNER relationship stage · {relationshipStage}
        </p>
      </SectionCard>

      <SectionCard title="Response Depth">
        <p className="text-sm italic leading-relaxed text-white/55">
          INNER is currently using {responseDepth} response depth.
        </p>
      </SectionCard>

      <SectionCard title="Silence Mode">
        <p className="text-sm italic leading-relaxed text-white/50">
          {silenceMode
            ? "INNER is reducing verbal pressure and holding quieter presence."
            : "INNER is maintaining normal conversational presence."}
        </p>
      </SectionCard>

      <SectionCard title="Dream Layer">
        <p className="text-sm italic leading-relaxed text-white/55">{dreamLayer}</p>
      </SectionCard>

      {mounted && consciousness.length > 0 && (
        <SectionCard title="Inner Consciousness">
          <div className="space-y-2.5">
            {consciousness.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <p className="text-sm leading-relaxed text-white/60">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
