import fs, { readFileSync } from 'fs';
import path from 'path';
import { readPdfText } from 'pdf-text-reader';

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
    return await readPdfText({ url: path });
  };

  async getFileContent(): Promise<string> {
    switch (this.fileExtension) {
      case '.txt':
        return this.getTextFileContent(this.filePath);
      case '.pdf':
        return await this.getPdfFileContent(this.filePath);
      // TODO: Implement readers for .doc, .docx, .md
      default:
        throw new Error('Unsupported file format.');
    }
  }
}
