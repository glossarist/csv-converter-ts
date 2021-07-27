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
    inputCSVPath: (args['_'] ?? [])[0]?.trim?.() ?? '',
    outDirectoryPath: args.o?.trim?.() ?? '',
    langCode: args.l?.trim?.() ?? '',
    glossaryID: args.i?.trim?.() ?? '',
    domainName: args.d?.trim?.() ?? '',
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
  if (config.outDirectoryPath === '') {
    errs.outDirectoryPath.push('must not be empty');
  }
  if (config.langCode.length !== 3) {
    errs.langCode.push('must be a three-letter language code');
  }
  if (config.glossaryID.length !== 3) {
    errs.glossaryID.push('must not be empty');
  }
  return [config, errs];
}
