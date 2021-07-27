import csv from 'csv-parser';
import fs from 'fs';
import parseISO from 'date-fns/parseISO';
import toDate from 'date-fns/toDate';
import type {ReportingOpts} from './ReportingFunction';

const headers = [
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
  'Designation 1 grammatical gender',
  'Designation 1 participle marker',
  'Designation 2 as text',
  'Designation 2 type',
  'Designation 2 part of speech',
  'Designation 2 grammatical number',
  'Designation 2 grammatical gender',
  'Designation 2 participle marker',
  'Designation 3 as text',
  'Designation 3 type',
  'Designation 3 part of speech',
  'Designation 3 grammatical number',
  'Designation 3 grammatical gender',
  'Designation 3 participle marker',
] as const;

type Entry = Record<typeof headers[number], string>;

function entryToConcept(entry: Entry): ImportedConcept {
  const notes: string[] = [];
  const noteFields: (keyof Entry)[] = ['Note 1', 'Note 2', 'Note 3'];
  for (const fname of noteFields) {
    if (entry[fname].trim() !== '') {
      notes.push(entry[fname]);
    }
  }

  const examples: string[] = [];
  const exampleFields: (keyof Entry)[] = ['Example 1', 'Example 2', 'Example 3'];
  for (const fname of exampleFields) {
    if (entry[fname].trim() !== '') {
      examples.push(entry[fname]);
    }
  }

  const designations: Designation[] = [];
  const designationFieldPrefixes = ['Designation 1', 'Designation 2', 'Designation 3'];
  for (const [idx, prefix] of designationFieldPrefixes.entries()) {
    const fnames = Object.entries(entry).filter(([fieldname, value]) => fieldname.startsWith(prefix) && value.trim() !== '');
    if (fnames.length > 0) {
      const designation = {
        designation: entry[`${prefix} as text` as keyof Entry],
        type: entry[`${prefix} type` as keyof Entry],
        partOfSpeech: entry[`${prefix} part of speech` as keyof Entry] || undefined,
        grammaticalNumber: entry[`${prefix} grammatical number` as keyof Entry] || undefined,
        grammaticalGender: entry[`${prefix} grammatical gender` as keyof Entry] || undefined,
        isParticiple: (entry[`${prefix} participle marker` as keyof Entry] !== '') || undefined,
      } as Designation;
      designations.push(designation);
    }
  }

  return {
    identifier: entry['Human-readable identifier'],
    definition: entry['Definition'],
    dateAccepted: toDate(parseISO(entry['Date accepted'])),
    designations,
    examples,
    notes,
  };
}


const DESIGNATION_TYPES = ['expression', 'symbol', 'prefix'] as const;
const PARTS_OF_SPEECH = ['noun', 'adjective', 'adverb', 'verb'] as const;
const GRAMMATICAL_NUMBER = ['plural', 'singular', 'mass'] as const;
const GRAMMATICAL_GENDER = ['common', 'feminine', 'masculine', 'neuter'] as const;

interface Designation {
  designation: string;
  type: typeof DESIGNATION_TYPES[number];
  partOfSpeech?: typeof PARTS_OF_SPEECH[number];
  grammaticalNumber?: typeof GRAMMATICAL_NUMBER[number];
  grammaticalGender?: typeof GRAMMATICAL_GENDER[number];
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

function isEntry(row: any): row is Entry {
  for (const header of headers) {
    if (typeof row[header] !== 'string') {
      return false;
    }
  }
  return true;
}

function isConcept(entry: any): entry is ImportedConcept {
  return (
    entry.identifier !== undefined &&
    entry.designations.length >= 1 &&
    entry.designations.map((des: any) => (
      DESIGNATION_TYPES.indexOf(des.type) >= 0) &&
      (!des.partOfSpeech || PARTS_OF_SPEECH.indexOf(des.partOfSpeech) >= 0) &&
      (!des.grammaticalNumber || GRAMMATICAL_NUMBER.indexOf(des.grammaticalNumber) >= 0) &&
      (!des.grammaticalGender || GRAMMATICAL_GENDER.indexOf(des.grammaticalGender) >= 0) &&
      (!des.isParticiple || des.isParticiple === true)
    ) &&
    entry.definition !== undefined
  );
}

async function* readCSV(filePath: string): AsyncGenerator<ImportedConcept> {
  let i = 1;
  for await (const parsedRow of fs
    .createReadStream(filePath)
    .pipe(csv({headers}))) {
    console.debug('Got parsed row', parsedRow);
    if (isEntry(parsedRow)) {
      const entry = parsedRow;
      const maybeConcept = entryToConcept(entry);
      if (isConcept(maybeConcept)) {
        yield maybeConcept;
      } else {
        throw new Error(`Invalid concept at row #${i}: ${JSON.stringify(entry)}`);
      }
    } else {
      throw new Error(`Invalid row #${i}: ${JSON.stringify(parsedRow)}`)
    }
  }
}

export default async function processItems(
  { onOutput, onProgress }: ReportingOpts,
  filePath: string,
  repoPath: string,
  itemCount: number
): Promise<void> {
  let i = 1;
  for await (const concept of readCSV(filePath)) {
    console.debug('Got concept', concept);
    onProgress(itemCount, i);
    onOutput(`parsed concept ${i}`);
  }
}
