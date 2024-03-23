export const chunker = (text: string, wordsPerChunk: number, overlapWords: number): string[] => {
    const words = text.match(/[\w']+(?:[.,!?])?|\S/g) || [];
  
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
      let endIndex = i + wordsPerChunk;
      const chunk = words.slice(i, endIndex).join(' ');
      chunks.push(chunk);
  
      if (endIndex >= words.length) break;
    }
  
    return chunks;
  };