import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import {ReportingOpts} from './ReportingFunction';
import parseCSV from './parseCSV';
import {ImportedConcept} from './ImportedConcept';

async function writeConcept(
  c: ImportedConcept,
  universalConceptPath: string,
  localizedConceptPath: string,
  langID: string
) {
  const abstractItem = {
    id: c.abstractID,
    dateAccepted: c.dateAccepted,
    related: [],
    status: 'valid',
    data: {
      identifier: c.identifier,
      localizedConcepts: {
        [langID]: c.localizedID,
      },
    },
  };
  const abstractItemPath = path.join(
    universalConceptPath,
    `${c.abstractID}.yaml`
  );
  fs.writeFileSync(abstractItemPath, yaml.dump(abstractItem, {noRefs: true}));

  const localizedItem: Record<string, any> = {
    id: c.localizedID,
    dateAccepted: c.dateAccepted,
    status: 'valid',
    related: [],
    data: {
      definition: c.definition,
      examples: c.examples,
      notes: c.notes,
      terms: c.designations.map((des, idx) => ({
        designation: des.designation,
        type: des.type,
        partOfSpeech: des.partOfSpeech,
        gender: des.grammaticalGender,
        grammaticalNumber: des.grammaticalNumber,
        isAbbreviation: des.isAbbreviation,
        isParticiple: des.isParticiple,
        normative_status: idx === 0 ? 'preferred' : 'admitted',
      })),
    },
  };
  if (c.authoritativeSource) {
    localizedItem.authoritativeSource = [c.authoritativeSource];
  }
  const localizedItemPath = path.join(
    localizedConceptPath,
    `${c.localizedID}.yaml`
  );
  fs.writeFileSync(localizedItemPath, yaml.dump(localizedItem, {noRefs: true}));
}

export default async function processItems(
  {onOutput, onProgress}: ReportingOpts,
  csvPath: string,
  universalSubregisterPath: string,
  localizedSubregisterPath: string,
  langID: string,
  itemCount?: number
): Promise<void> {
  const i = 1;
  const universalConceptPath = path.join(universalSubregisterPath, 'concept');
  const localizedConceptPath = path.join(
    localizedSubregisterPath,
    'localized-concept'
  );
  fs.mkdirSync(universalConceptPath);
  fs.mkdirSync(localizedConceptPath);
  for await (const concept of parseCSV(csvPath)) {
    onOutput(`parsed concept ${i}`);
    await writeConcept(
      concept,
      universalConceptPath,
      localizedConceptPath,
      langID
    );
    onOutput(`wrote YAML for concept ${i}`);
    if (itemCount) {
      onProgress(itemCount, i);
    }
  }
}
