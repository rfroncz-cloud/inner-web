export function calculateRelationshipUpdate(memoryCandidate: any) {
    if (!memoryCandidate) {
      return {
        trustIncrease: 0,
        closenessIncrease: 0,
        attachmentIncrease: 0,
      };
    }
  
    const category = memoryCandidate.category;
  
    let trustIncrease = 1;
    let closenessIncrease = 1;
    let attachmentIncrease = 0;
  
    if (
      category === "identity" ||
      category === "family" ||
      category === "birth" ||
      category === "childhood" ||
      category === "pet" ||
      category === "home"
    ) {
      trustIncrease += 2;
      closenessIncrease += 2;
      attachmentIncrease += 1;
    }
  
    if (
      category === "fear" ||
      category === "life_event" ||
      category === "boundaries" ||
      category === "values"
    ) {
      trustIncrease += 2;
      closenessIncrease += 3;
      attachmentIncrease += 2;
    }
  
    if (category === "communication") {
      trustIncrease += 2;
      closenessIncrease += 1;
    }
  
    return {
      trustIncrease,
      closenessIncrease,
      attachmentIncrease,
    };
  }