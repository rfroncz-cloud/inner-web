const blockedPatterns = [
    /password/gi,
    /hasło/gi,
    /passwd/gi,
    /api[_-]?key/gi,
    /secret/gi,
    /token/gi,
    /bearer/gi,
    /credit card/gi,
    /card number/gi,
    /cvv/gi,
    /iban/gi,
    /swift/gi,
    /blik/gi,
    /\b\d{16}\b/g, // possible card
    /\b\d{3}\b/g, // possible cvv
  ];
  
  export function isSensitiveMemory(memory: string): boolean {
    if (!memory) return false;
  
    for (const pattern of blockedPatterns) {
      if (pattern.test(memory)) {
        return true;
      }
    }
  
    return false;
  }