import { Ollama } from 'ollama';
import weaviate from 'weaviate-ts-client';
import { performance } from 'perf_hooks';

import { DocumentReader } from './document-reader.js';
import { chunker } from './chunker.js';
import { SentenceSplitter } from './sentence-splitter.js';

import { chunk } from 'llm-chunk'


// process.on('warning', (warning) => {
//   console.log(warning.stack);
// });

type DocumentVectorSchema = {
  text: string;
  file: string;
  embed: number[];
};
// chunkIndex
// chunkTotal

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

const ollama = new Ollama({ host: 'http://localhost:11434' });

const t0 = performance.now();

const get_embed_ollama = async (text: string, filename: string): Promise<DocumentVectorSchema[]> => {
  const chunklength = 100;
  const chunkoverlap = 3;
  const model = 'nomic-embed-text';
  const allChunks: DocumentVectorSchema[] = [];

  const chunks = chunker(text, chunklength, chunkoverlap);
  // const splitter = new TokenTextSplitter({
  //   encodingName: 'gpt2',
  //   chunkSize: chunklength,
  //   chunkOverlap: chunkoverlap,
  // });

  // const output = await splitter.createDocuments([text]);
  for (const chunk of chunks) {
    const result = await ollama.embeddings({ model: model, prompt: chunk });
    const embed = result.embedding;

    const chunkjson = { text: chunk, file: filename, embed: embed };
    allChunks.push(chunkjson);
  }

  return allChunks;
};

const vector_database_status = async () => {
  const response = await client.schema.getter().do();
  console.log(response);
};

const add_data_to_vector_database = async (data: DocumentVectorSchema) => {
  const result = await client.data
    .creator()
    .withClassName('Documents')
    .withProperties({
      text: data.text,
      file: data.file,
    })
    .withVector(data.embed)
    .do();

  console.log(JSON.stringify(result, null, 2));
};

const batch_data_to_vector_database = async (list: DocumentVectorSchema[]) => {
  const className = 'Documents';

  let batcher = client.batch.objectsBatcher();
  let counter = 0;
  const batchSize = 100;
  let result;

  for (const data of list) {
    batcher = batcher.withObject({
      class: className,
      properties: { text: data.text, file: data.file },
      vector: data.embed,
    });

    if (counter++ == batchSize) {
      result = await batcher.do();
      //console.log('MIDDLE: ', JSON.stringify(result, null, 2));

      // restart
      counter = 0;
      batcher = client.batch.objectsBatcher();
    }
  }

  result = await batcher.do();
  //console.log('END: ', JSON.stringify(result, null, 2));
};

const search_vector_database = async (
  searchString: string,
  limit: number = 4,
  model: string = 'nomic-embed-text'
): Promise<any> => {
  //console.log('#### EMBED QUESTION ####');
  const embedding = await ollama.embeddings({
    model: model,
    prompt: searchString,
  });

  //console.log(embedding.embedding);

  //console.log('#### DO NEAR VECTOR SEARCH ####');
  const result = await client.graphql
    .get()
    .withClassName('Documents')
    .withNearVector({ vector: embedding.embedding })
    .withLimit(limit)
    .withFields('text file _additional { distance }')
    .do();

  return result;
};

const anaylze_result_with_ollama_and_respond = async (
  vectorResponse: string,
  question: string,
  model: string = 'mistral'
) => {
  const systemPrompt = `Instructions: Provide a detailed answer to the user's question below, using the information provided from the document. 
  The answer should be concise, accurate, and directly related to the question.

  User's Question:
  [Insert User's Question Here]
  
  Relevant Document Information:
  ### Begin Document ###
  [Insert Relevant Document Content Here]
  ### End Document ###
  
  Answer:`;

  const userPrompt = `User's Question:
  ${question}
  
  Relevant Document Information:
  ### Begin Document ###
  ${vectorResponse}
  ### End Document ###
  
  Answer:`;

  const response = await ollama.chat({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
    keep_alive: '20m',
  });

  return response.message.content;
};

// const textChunk = `For the last two days, ever since leaving home, Pierre had been
// living in the empty house of his deceased benefactor, Bazdeev. This is
// how it happened.`;

const basePath = './documents/';
const filename = 'PlantBasedDiet2019.pdf';
//const filename = 'sherlock.txt';
const filePath = `${basePath}${filename}`;

console.log('##### PDFTEXT #####');
const pdfDocument = new DocumentReader(filePath);
const pdfTextContent: string = await pdfDocument.getFileContent();

// console.log('##### TEXT FILE #####');
// const txtDocument = new DocumentReader(filePath);
// const textContent: string = await txtDocument.getFileContent();

//console.log('##### OLLAMA #####');
//const textContent = txtTextContent;
//const embeddings = await get_embed_ollama(textContent, filename);
// embeddings.map((chunk) => {
//   console.log(chunk);
// });

//console.log('##### WEAVIATE VECTOR DATABASE #####');
//await add_data_to_vector_database(embeddings[0]);
//await batch_data_to_vector_database(embeddings);
//await vector_database();

// const question1 = { q: 'Has Pierre been living in an empty house?', a: 'yes' };

// const question2 = {
//   q: `What happened at ten o'clock in the morning of the second of September?`,
//   a: `only the rear guard remained in the Dorogomilov suburb, where they had ample room. The main army was on the other side of Moscow or beyond it.`,
// };

// const question3 = {
//   q: `What does every Russian feel when looking at Moscow?`,
//   a: `Every Russian feels her to be a mother.`,
// };

// const question4 = {
//   q: `What did Gerasim do after he opened one of the shutters?`,
//   a: `Gerasim opened one of the shutters and left the room on tiptoe.`,
// };

// const theQuestion = question3.q;



// const searchResult = await search_vector_database(theQuestion, 2);
// console.log('##### THE QUESTION #####');
// console.log(theQuestion);

// console.log('##### SEARCH RESULT #####');
// const searchResultJsonString = JSON.stringify(searchResult, null, 2);
// //console.log(searchResultJsonString);

// console.log('##### OLLAMA ANSWER #####');
// const ollamaAnswer = await anaylze_result_with_ollama_and_respond(searchResultJsonString, theQuestion, 'mistral');
// console.log('ANSWER: ', ollamaAnswer);

const t1 = performance.now();
console.log(`Code execution time: ${(t1 - t0) / 1000} seconds`);

console.log('');
console.log('##### TEST PERFORMANCE #####');

// console.log('');
// const tSplitter = performance.now();
// const splitter = new TokenTextSplitter({
//   encodingName: 'gpt2',
//   chunkSize: 100,
//   chunkOverlap: 3,
// });
// const output1 = await splitter.createDocuments([textContent]);
// const ts1 = performance.now();
// console.log(`TokenTextSplitter execution time: ${(ts1 - tSplitter)} ms (length: ${output1.length})`);
// console.log(`------------------`);
// console.log(`0: ${output1[0].pageContent}`);
// console.log(`------------------`);

console.log('');
const tChunker = performance.now();
const output2 = chunker(pdfTextContent, 100, 3);
const ts2 = performance.now();
console.log(`chunker - execution time: ${(ts2 - tChunker)} ms (length: ${output2.length})`);
console.log(`------------------`);
console.log(`0: ${output2[0]}`);
console.log(`------------------`);


console.log('');
const tChunk = performance.now();
const chunks = chunk(pdfTextContent, {
  minLength: 100,          // number of minimum characters into chunk
  maxLength: 1000,       // number of maximum characters into chunk
  splitter: "sentence", // paragraph | sentence
  overlap: 0,            // number of overlap chracters
  delimiters: ""         // regex for base split method
});
const ts3 = performance.now();
console.log(`chunk - execution time: ${(ts3 - tChunk)} ms (length: ${chunks.length})`);
console.log(`------------------`);
console.log(`0: ${chunks[0]}`);
console.log(`------------------`);


console.log('');
const tSentenceSplitter = performance.now();
const sentenceSplitter = new SentenceSplitter(pdfTextContent, 8);
const sentences = sentenceSplitter.getChunks();
const ts4 = performance.now();
console.log(`SentenceSplitter - execution time: ${(ts4 - tSentenceSplitter)} ms (length: ${sentences.length})`);
console.log(`------------------`);
console.log(`0: ${sentences[0]}`);
console.log(`------------------`);