import React from 'react';
import {Text} from 'ink';
import {Configuration as IConfiguration} from './config';

export const Configuration: React.FC<{
  config: IConfiguration;
  errs: Record<keyof IConfiguration, string[]>;
}> = function ({config, errs}) {
  return (
    <>
      <ConfigParam
        label="Input CSV path"
        val={config.inputCSVPath}
        errs={errs.inputCSVPath}
      />
      <ConfigParam
        label="Output directory container path"
        opt="-o"
        val={config.outDirectoryPath}
        errs={errs.outDirectoryPath}
      />
      <ConfigParam
        label="Glossary ID"
        opt="-i"
        val={config.glossaryID}
        errs={errs.glossaryID}
      />
      <ConfigParam
        label="Language code"
        opt="-l"
        val={config.langCode}
        errs={errs.langCode}
      />
      <ConfigParam
        label="Domain name"
        opt="-d"
        val={config.domainName}
        errs={errs.domainName}
      />
    </>
  );
};

const ConfigParam: React.FC<{
  label: string;
  opt?: string;
  val: string;
  errs: string[];
}> = function ({label, opt, val, errs}) {
  return (
    <>
      <Text>
        {label}
        {opt ? ` [${opt}]` : null}
        {errs.length > 0 ? (
          <>
            {' '}
            (
            {errs.map((err, idx) => (
              <React.Fragment key={idx}>
                <Text color="red">
                  {err}
                </Text>
                {idx === errs.length ? ', ' : null}
              </React.Fragment>
            ))}
            )
          </>
        ) : null}
        : <Text color={errs.length > 0 ? 'red' : 'green'}>{val ?? 'N/A'}</Text>
      </Text>
    </>
  );
};

export default Configuration;
