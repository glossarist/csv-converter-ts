import React from 'react';
import {Text} from 'ink';
import getConfig, {Configuration} from './config';

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
              <>
                <Text key={idx} color="red">
                  {err}
                </Text>
                {idx === errs.length ? ', ' : null}
              </>
            ))}
            )
          </>
        ) : null}
        : <Text color={errs.length > 0 ? 'red' : 'green'}>{val ?? 'N/A'}</Text>
      </Text>
    </>
  );
};
const Configuration: React.FC<{
  config: Configuration;
  errs: Record<keyof Configuration, string[]>;
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

const App: React.FC<Record<never, never>> = function () {
  const [config, errs] = getConfig();

  return (
    <>
      <Text color="green">Given configuration:</Text>
      <Configuration config={config} errs={errs} />
    </>
  );
};

export default App;
