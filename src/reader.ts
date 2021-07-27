import csv from 'csv-parser';
import fs from 'fs';
import type {ReportingOpts} from './ReportingFunction';

const headers: string[] = [
  'Human-readable identifier',
  'Date accepted',
  'Definition',
  'Note 1',
  'Note 2',
  'Note 3',
  'Example 1',
  'Example 2',
  'Example 3',
  'Authoritative source reference',
  'Authoritative source clause',
  'Authoritative source link',
  'Designation 1 as text',
  'Designation 1 type',
  'Designation 1 part of speech',
  'Designation 1 grammatical number',
  'Designation 1 gender',
  'Designation 1 participle marker',
  'Designation 2 as text',
  'Designation 2 type',
  'Designation 2 part of speech',
  'Designation 2 grammatical number',
  'Designation 2 gender',
  'Designation 2 participle marker',
  'Designation 3 as text',
  'Designation 3 type',
  'Designation 3 part of speech',
  'Designation 3 grammatical number',
  'Designation 3 gender',
  'Designation 3 participle marker',
];

interface Designation {
  designation: string;
  type: 'expression' | 'symbol' | 'prefix';
  partOfSpeech?: 'noun' | 'adjective' | 'adverb' | 'verb';
  grammaticalNumber?: 'plural' | 'singular' | 'mass';
  grammaticalGender?: 'common' | 'feminine' | 'masculine' | 'neuter';
  isParticiple?: true;
}

interface ImportedConcept {
  identifier: string;
  dateAccepted: Date;
  definition: string;
  notes: string[];
  examples: string[];
  designations: Designation[];
  authoritativeSource?: {
    ref?: string;
    clause?: string;
    link?: string;
  };
}

function isConcept(entry: any): entry is ImportedConcept {
  return entry.identifier !== undefined;
}

async function* readCSV(filePath: string): AsyncGenerator<ImportedConcept> {
  for await (const entry of fs
    .createReadStream(filePath)
    .pipe(csv({headers}))) {
    console.debug('Got entry', entry);
    if (isConcept(entry)) {
      yield entry;
    }
  }
}

export default async function processItems(
  _: ReportingOpts,
  filePath: string,
  repoPath: string,
  itemCount: number
): Promise<void> {
  for await (const concept of readCSV(filePath)) {
    console.debug('Got concept', concept);
  }
}
