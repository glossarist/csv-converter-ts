import React from 'react';
import {Text} from 'ink';
import getConfig from './config';
import Configuration from './Configuration';

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
