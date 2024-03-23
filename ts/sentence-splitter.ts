import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model'

export class SentenceSplitter {
  private text: string;
  private noOfSentences: number;

  private nlp: any = null;

  constructor(text: string, noOfSentences: number) {
    if (!text) {
      throw new Error('Text is required.');
    }
    if (noOfSentences <= 0) {
      throw new Error('Number of sentences should be greater than 0.');
    }

    this.text = text;
    this.noOfSentences = noOfSentences;

    this.nlp = winkNLP(model);
  }

  getChunks(): string[] {
    const output: string[] = [];
    const doc = this.nlp.readDoc(this.text);
    const sentences = doc.sentences().out();

    let chunkIndex = 0;
    let chunk = '';
    for (let i = 0; i < sentences.length; i++) {
      chunkIndex++;
      chunk += `${sentences[i]} `;

      if (chunkIndex === this.noOfSentences || i === sentences.length - 1) {
        output.push(chunk);
        chunkIndex = 0;
        chunk = '';
      }
    }

    return output;
  }
}
