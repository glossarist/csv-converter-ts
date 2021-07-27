import os from 'os';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid';
import axios from 'axios';
import tar from 'tar';
import {ReportingOpts} from './ReportingFunction';

const SCAFFOLDING_URL =
  'https://api.github.com/repos/paneron/glossary-site-scaffolding/tarball';

async function downloadScaffolding(): Promise<string> {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, uuidv4());
  return axios({
    url: SCAFFOLDING_URL,
    responseType: 'stream',
  }).then(
    response =>
      new Promise<string>((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(tmpFile))
          .on('finish', () => resolve(tmpFile))
          .on('error', (e: any) => {
            fs.rmSync(tmpFile);
            reject(e);
          });
      })
  );
}

export default async function installSiteScaffolding(
  _: ReportingOpts,
  repoPath: string
) {
  const downloadedFile = await downloadScaffolding();
  await tar.extract({
    cwd: repoPath,
    file: downloadedFile,
    strip: 1,
  });
}
