import fs, { readFileSync } from 'fs';
import path from 'path';
import mammoth from 'mammoth';
// @ts-ignore
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';

export class DocumentReader {
  private filePath: string;
  private fileExtension: string;

  constructor(filePath: string) {
    if (!filePath) {
      throw new Error('File path is required.');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.filePath = filePath;
    this.fileExtension = path.extname(filePath);
  }

  private getTextFileContent = (path: string): string => {
    return readFileSync(path, 'utf-8');
  };

  private getPdfFileContent = async (path: string): Promise<string> => {
    // @ts-ignore
    await import('pdfjs-dist/build/pdf.worker.mjs');

    const filePath = './documents/PlantBasedDiet2019.pdf';

    const pdf = await pdfjs.getDocument(filePath).promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const fileContent: string[] = [];
    textContent.items.forEach((item: TextItem) => {
      fileContent.push(`${item.str}${item.hasEOL ? '\n' : ''}`);
    });
    return fileContent.join(' ');
  };

  private getDocFileContent = async (path: string): Promise<string> => {
    const result = await mammoth.extractRawText({ path: path });
    return result.value.replace(/(\r\n|\n|\r)/gm, '');
  };

  async getFileContent(): Promise<string> {
    switch (this.fileExtension) {
      case '.txt':
        return this.getTextFileContent(this.filePath);
      case '.pdf':
        return await this.getPdfFileContent(this.filePath);
      case '.docx':
        return await this.getDocFileContent(this.filePath);
      default:
        throw new Error('Unsupported file format.');
    }
  }
}

export const saveFile = (filePath: string, content: string): void => {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('File saved successfully!');
  });
};
