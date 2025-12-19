// @ts-nocheck
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { parseFile } from '../../lib/parse';

describe('e2e parse tests (docx, pptx)', () => {
  const tmpDir = path.join(__dirname, 'tmp');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  });

  it('parses a minimal DOCX file (real zipped xml)', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"></Types>`);
    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body><w:p><w:r><w:t>Hello DOCX</w:t></w:r></w:p></w:body></w:document>`);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const filePath = path.join(tmpDir, 'sample.docx');
    fs.writeFileSync(filePath, buf);

    const out = await parseFile(filePath);
    expect(out).toMatch(/Hello DOCX/);
  });

  it('parses a minimal PPTX file (real zipped xml)', async () => {
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"></Types>`);
    zip.file('ppt/slides/slide1.xml', `<?xml version=\"1.0\" encoding=\"UTF-8\"?><p:spTree xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\"><a:t xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\">Slide text 1</a:t></p:spTree>`);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const filePath = path.join(tmpDir, 'sample.pptx');
    fs.writeFileSync(filePath, buf);

    const out = await parseFile(filePath);
    expect(out).toMatch(/Slide text 1/);
  });
});
