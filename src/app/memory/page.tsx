"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LongTermMemory = {
  type: string;
  memory: string;
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<LongTermMemory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(
      "inner-long-term-memory"
    );

    if (saved) {
      try {
        setMemories(JSON.parse(saved));
      } catch {}
    }
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-violet-300/40 mb-2">
              INNER
            </p>

            <h1 className="text-3xl font-light tracking-tight">
              Memory Timeline
            </h1>
          </div>

          <Link
            href="/chat"
            className="text-sm text-white/40 hover:text-white/80 transition"
          >
            Back
          </Link>
        </div>

        <div className="space-y-6">
          {memories.map((memory, index) => (
            <div
              key={index}
              className="rounded-[2rem] border border-violet-500/10 bg-violet-500/[0.03] px-6 py-6"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300/40 mb-3">
                {memory.type}
              </p>

              <p className="text-white/70 leading-relaxed text-lg">
                {memory.memory}
              </p>
            </div>
          ))}

          {memories.length === 0 && (
            <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] px-6 py-8">
              <p className="text-white/35">
                INNER has not formed long-term memories yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}