export function rewriteInnerResponse(reply: string): string {
    if (!reply) return reply;
  
    let text = reply.trim();
  
    const bannedOpeners = [
      "That sounds tough.",
      "That sounds difficult.",
      "I understand.",
      "I understand how you feel.",
      "I'm here to listen.",
      "I'm here for you.",
      "It can be tough",
      "It might help",
      "You are not alone.",
    ];
  
    for (const opener of bannedOpeners) {
      if (text.toLowerCase().startsWith(opener.toLowerCase())) {
        text = text.slice(opener.length).trim();
      }
    }
  
    text = text
      .replace(/Have you noticed when it happens most\??/gi, "")
      .replace(/What do you think is causing that feeling\??/gi, "")
      .replace(/If you share more, I can understand better\.?/gi, "")
      .replace(/Try focusing on one step at a time\.?/gi, "")
      .replace(/Consider /gi, "")
      .replace(/It might help to /gi, "")
      .replace(/small manageable goals/gi, "one smaller thing")
  
      .replace(/That can feel unsettling\.?/gi, "")
      .replace(/That sounds unsettling\.?/gi, "")
      .replace(/That uncertainty can feel heavy\.?/gi, "")
      .replace(/It's hard to keep that facade up\.?/gi, "")
      .replace(/It's okay to feel that way\.?/gi, "")
  
      .replace(
        /It sounds like you're searching for clarity within yourself\.?/gi,
        "You sound unsure of who you are becoming."
      )
      .replace(
        /Change can be confusing,? leaving you feeling a bit lost\.?/gi,
        "You barely recognize yourself lately."
      )
      .replace(/It can feel heavy, not knowing what lies ahead\.?/gi, "")
      .replace(/Sometimes that uncertainty lingers for a while\.?/gi, "")
      .replace(
        /It takes a lot of energy to keep pretending\.?/gi,
        "Pretending drains you."
      )
      .replace(
        /That kind of exhaustion can be really deep\.?/gi,
        "That exhaustion sits in your bones."
      )
      .replace(
        /Yeah, that can feel lonely\.?/gi,
        "Yeah. That loneliness hits differently around people."
      )
      .replace(
        /It's exhausting to wear a mask, especially in a crowd\.?/gi,
        "Being surrounded doesn't always feel like being seen."
        .replace(/That sounds isolating\.?/gi, "You sound far away from people.")
.replace(/Disconnection can sit heavy\.?/gi, "That distance sits heavy.")
.replace(/Yeah, being with others doesn't always bridge that gap\.?/gi, "Yeah. Being around people doesn't always mean being reached.")
.replace(/It can feel lonely in a crowd\.?/gi, "Crowds can make it louder.")
.replace(/That uncertainty can be unsettling\.?/gi, "You barely recognize the direction you're moving in.")
.replace(/It's like you're in a transition, feeling a bit lost along the way\.?/gi, "")
.replace(/It sounds heavy to carry that\.?/gi, "Pretending drains you.")
.replace(/Sometimes, it's exhausting just to keep up appearances\.?/gi, "")
      )
      .replace(/\s+/g, " ")
      .trim();
  
    const sentences = text.match(/[^.!?]+[.!?]+/g);
  
    if (sentences && sentences.length > 2) {
      text = sentences.slice(0, 2).join(" ").trim();
    }
  
    return text || reply;
  }