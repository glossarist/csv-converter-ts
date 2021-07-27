import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import {ReportingOpts} from './ReportingFunction';

async function writePaneronMeta(
  repoPath: string,
  datasetID: string
): Promise<string> {
  const metaPath = path.join(repoPath, 'paneron.yaml');
  const meta = {
    title: datasetID,
    datasets: {
      [datasetID]: true,
    },
  };
  fs.writeFileSync(metaPath, yaml.dump(meta, {noRefs: true}));
  const datasetPath = path.join(repoPath, datasetID);
  fs.mkdirSync(datasetPath);
  return datasetPath;
}

async function writeGlossaristDatasetMeta(
  datasetPath: string,
  datasetID: string,
  langCode: string
): Promise<[string, string]> {
  const metaPath = path.join(datasetPath, 'panerondataset.yaml');
  const meta = {
    title: datasetID,
    type: {
      id: '@riboseinc/paneron-extension-glossarist',
      version: '1.0.0-dev6',
    },
  };
  fs.writeFileSync(metaPath, yaml.dump(meta, {noRefs: true}));

  fs.mkdirSync(path.join(datasetPath, 'subregisters'));
  const universalSubregisterPath = path.join(
    datasetPath,
    'subregisters',
    'universal'
  );
  fs.mkdirSync(universalSubregisterPath);
  const localizedSubregisterPath = path.join(
    datasetPath,
    'subregisters',
    langCode
  );
  fs.mkdirSync(localizedSubregisterPath);

  return [universalSubregisterPath, localizedSubregisterPath];
}

async function writeRegisterMeta(
  datasetPath: string,
  registerName: string,
  uri: string
) {
  const metaPath = path.join(datasetPath, 'register.yaml');
  const meta = {
    name: registerName,
    uniformResourceIdentifier: uri,
    stakeholders: [
      {
        role: 'manager',
        name: 'Demo user',
        gitServerUsername: 'demouser',
        parties: [
          {
            name: '',
            contacts: [
              {
                label: 'email',
                value: 'test@example.com',
              },
            ],
          },
        ],
      },
    ],
  };
  fs.writeFileSync(metaPath, yaml.dump(meta, {noRefs: true}));
}

export default async function ensureMeta(
  {onOutput}: ReportingOpts,
  repoPath: string,
  datasetID: string,
  langCode: string,
  domainName: string
): Promise<
  [universalSubregisterPath: string, localizedSubregisterPath: string]
> {
  onOutput('Writing Paneron meta…');
  const datasetPath = await writePaneronMeta(repoPath, datasetID);
  onOutput('Writing dataset meta…');
  const paths = await writeGlossaristDatasetMeta(
    datasetPath,
    datasetID,
    langCode
  );
  onOutput('Writing register meta…');
  await writeRegisterMeta(datasetPath, datasetID, `https://${domainName}`);
  return paths;
}
