import {
  DESIGNATION_TYPES,
  PARTS_OF_SPEECH,
  GRAMMATICAL_NUMBER,
  GRAMMATICAL_GENDER,
} from './parseCSV';

export interface ImportedConcept {
  abstractID: string; // UUIDv5
  localizedID: string; // UUIDv5
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
export interface Designation {
  designation: string;
  type: typeof DESIGNATION_TYPES[number];
  partOfSpeech?: typeof PARTS_OF_SPEECH[number];
  grammaticalNumber?: typeof GRAMMATICAL_NUMBER[number];
  grammaticalGender?: typeof GRAMMATICAL_GENDER[number];
  isParticiple?: true;
  isAbbreviation?: true;
}
