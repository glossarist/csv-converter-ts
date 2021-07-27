import fs from 'fs';
import minimist from 'minimist';

// interface RawArguments {
//   _: string[];
//   o: string;
//   l: string;
//   i: string;
//   d: string;
// }

export interface Configuration {
  inputCSVPath: string;
  outDirectoryPath: string;
  langCode: string;
  glossaryID: string;
  domainName: string;
}

// function argsValid(args: ParsedArgs): args is RawArguments {
//   return (
//     args['_'].length === 1 &&
//     args['_'][0] !== '' &&
//     args.o !== undefined &&
//     args.l !== undefined &&
//     args.i !== undefined &&
//     args.d !== undefined
//   );
// }

export default function getConfig(): [
  config: Configuration,
  errors: Record<keyof Configuration, string[]>
] {
  const args = minimist(process.argv.slice(2));
  const config: Configuration = {
    inputCSVPath: (args['_'] ?? [])[0]?.toString?.().trim?.() ?? '',
    outDirectoryPath: args.o?.toString?.().trim?.() ?? '',
    langCode: args.l?.toString?.().trim?.() ?? '',
    glossaryID: args.i?.toString?.().trim?.() ?? '',
    domainName: args.d?.toString?.().trim?.() ?? '',
  };
  const errs: Record<keyof Configuration, string[]> = {
    inputCSVPath: [],
    outDirectoryPath: [],
    langCode: [],
    glossaryID: [],
    domainName: [],
  };
  if (config.inputCSVPath === '') {
    errs.inputCSVPath.push('must not be empty');
  }
  try {
    if (!fs.statSync(config.inputCSVPath).isFile()) {
      errs.inputCSVPath.push('must be a file');
    }
  } catch (e) {
    errs.inputCSVPath.push('must be an existing file');
  }
  if (config.outDirectoryPath === '') {
    errs.outDirectoryPath.push('must not be empty');
  }
  if (config.langCode.length !== 3) {
    errs.langCode.push('must be a three-letter language code');
  }
  if (config.glossaryID === '') {
    errs.glossaryID.push('must not be empty');
  }
  return [config, errs];
}
