import {v5 as uuidv5} from 'uuid';
import csv from 'csv-parser';
import fs from 'fs';
import parseISO from 'date-fns/parseISO';
import toDate from 'date-fns/toDate';
import {Designation, ImportedConcept} from './ImportedConcept';

const abstractNSUUID = '1271bc90-eee4-11eb-99fe-bdf91729b15a';
const localizedNSUUID = '544cb700-eee4-11eb-99fe-bdf91729b15a';

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
  'Term 1 designation',
  'Term 1 type',
  'Term 1 part of speech',
  'Term 1 grammatical number',
  'Term 1 grammatical gender',
  'Term 1 participle marker',
  'Term 1 abbreviation marker',
  'Term 2 designation',
  'Term 2 type',
  'Term 2 part of speech',
  'Term 2 grammatical number',
  'Term 2 grammatical gender',
  'Term 2 participle marker',
  'Term 2 abbreviation marker',
  'Term 3 designation',
  'Term 3 type',
  'Term 3 part of speech',
  'Term 3 grammatical number',
  'Term 3 grammatical gender',
  'Term 3 participle marker',
  'Term 3 abbreviation marker',
] as const;

type Entry = Record<typeof headers[number], string>;

/* Tries to return an ImportedConcept, but use isConcept() guard to be sure. */
function entryToConcept(entry: Entry): any {
  const notes: string[] = [];
  const noteFields: (keyof Entry)[] = ['Note 1', 'Note 2', 'Note 3'];
  for (const fname of noteFields) {
    if (entry[fname].trim() !== '') {
      notes.push(entry[fname]);
    }
  }

  const examples: string[] = [];
  const exampleFields: (keyof Entry)[] = [
    'Example 1',
    'Example 2',
    'Example 3',
  ];
  for (const fname of exampleFields) {
    if (entry[fname].trim() !== '') {
      examples.push(entry[fname]);
    }
  }

  const designations: Designation[] = [];
  const designationFieldPrefixes = ['Term 1', 'Term 2', 'Term 3'];
  for (const prefix of designationFieldPrefixes) {
    const fnames = Object.entries(entry).filter(
      ([fieldname, value]) =>
        fieldname.startsWith(prefix) && value.trim() !== ''
    );
    if (fnames.length > 0) {
      const designation = {
        designation: entry[`${prefix} as text` as keyof Entry],
        type: entry[`${prefix} type` as keyof Entry],
        partOfSpeech:
          entry[`${prefix} part of speech` as keyof Entry] || undefined,
        grammaticalNumber:
          entry[`${prefix} grammatical number` as keyof Entry] || undefined,
        grammaticalGender:
          entry[`${prefix} grammatical gender` as keyof Entry] || undefined,
        isParticiple:
          entry[`${prefix} participle marker` as keyof Entry] !== '' ||
          undefined,
        isAbbreviation:
          entry[`${prefix} abbreviation marker` as keyof Entry] !== '' ||
          undefined,
      } as Designation;
      designations.push(designation);
    }
  }

  const concept: ImportedConcept = {
    abstractID: uuidv5(entry['Human-readable identifier'], abstractNSUUID),
    localizedID: uuidv5(JSON.stringify(entry), localizedNSUUID),
    identifier: entry['Human-readable identifier'],
    definition: entry['Definition'],
    dateAccepted: entry['Date accepted']
      ? toDate(parseISO(entry['Date accepted']))
      : new Date(),
    designations,
    examples,
    notes,
  };

  return concept;
}

export const DESIGNATION_TYPES = ['expression', 'symbol', 'prefix'] as const;
export const PARTS_OF_SPEECH = ['noun', 'adjective', 'adverb', 'verb'] as const;
export const GRAMMATICAL_NUMBER = ['plural', 'singular', 'mass'] as const;
export const GRAMMATICAL_GENDER = [
  'common',
  'feminine',
  'masculine',
  'neuter',
] as const;

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
    entry.designations.map(
      (des: any) =>
        DESIGNATION_TYPES.indexOf(des.type) >= 0 &&
        (!des.partOfSpeech || PARTS_OF_SPEECH.indexOf(des.partOfSpeech) >= 0) &&
        (!des.grammaticalNumber ||
          GRAMMATICAL_NUMBER.indexOf(des.grammaticalNumber) >= 0) &&
        (!des.grammaticalGender ||
          GRAMMATICAL_GENDER.indexOf(des.grammaticalGender) >= 0) &&
        (!des.isParticiple || des.isParticiple === true) &&
        (!des.isAbbreviation || des.isAbbreviation === true)
    ) &&
    entry.definition !== undefined
  );
}

export default async function* parseCSV(
  filePath: string
): AsyncGenerator<ImportedConcept> {
  const i = 1;
  for await (const parsedRow of fs
    .createReadStream(filePath)
    .pipe(csv({headers}))) {
    if (isEntry(parsedRow)) {
      const entry = parsedRow;
      const maybeConcept = entryToConcept(entry);
      if (isConcept(maybeConcept)) {
        yield maybeConcept;
      } else {
        throw new Error(
          `Invalid concept at row #${i}: ${JSON.stringify(entry)}`
        );
      }
    } else {
      throw new Error(`Invalid row #${i}: ${JSON.stringify(parsedRow)}`);
    }
  }
}
