import path from 'path';
import fs from 'fs';
import update from 'immutability-helper';
import React, {useEffect, useState} from 'react';
import {Box} from 'ink';
import {TaskList, Task} from 'ink-task-list';
import getConfig from './config';
import Configuration from './Configuration';
import type {ReportingOpts} from './ReportingFunction';
import processItems from './processItems';
import ensureMeta from './ensureMeta';

const ensureRepoDirectory = async function (
  _: ReportingOpts,
  container: string,
  glossaryID: string
): Promise<string> {
  if (container === '' || glossaryID === '') {
    throw new Error('Empty glossary ID or container directory');
  }
  const repoPath = path.join(container, glossaryID);
  fs.mkdirSync(repoPath);
  return repoPath;
};

const countItems = async function (
  _: ReportingOpts,
  filePath: string
): Promise<number> {
  return 2;
};

interface Step {
  label: string;
  state: 'pending' | 'loading' | 'success' | 'warning' | 'error';
  status?: string;
  output?: string;
  suppressFailureIntoWarning?: true;
}
const STEP_SEQUENCE = [
  'ensuredir',
  'ensuremeta',
  'countitems',
  'processitems',
] as const;

type StepID = typeof STEP_SEQUENCE[number];
type StepConfiguration = Record<StepID, Step>;

const Step: React.FC<{step: Step}> = function ({step}) {
  return (
    <Task
      label={step.label}
      output={step.output}
      status={step.status}
      state={step.state}
    />
  );
};

const App: React.FC<Record<never, never>> = function () {
  const [config, errs] = getConfig();

  const [steps, setSteps] = useState<StepConfiguration>({
    ensuredir: {
      label: 'creating output directory',
      state: 'pending',
    },
    ensuremeta: {
      label: 'adding Paneron repository & dataset meta',
      state: 'pending',
    },
    countitems: {
      label: 'counting CSV lines to import',
      state: 'pending',
    },
    processitems: {
      label: 'processing CSV data',
      state: 'pending',
    },
  });

  function completeStep<A extends any[], R>(
    id: StepID,
    func: (opts: ReportingOpts, ...args: A) => Promise<R>
  ): (...args: A) => Promise<R | undefined> {
    function handleOutput(output: string) {
      setSteps(steps => update(steps, {[id]: {output: {$set: output}}}));
    }
    function handleProgress(total: number, completed: number) {
      setSteps(steps =>
        update(steps, {[id]: {status: {$set: `${completed} of ${total}`}}})
      );
    }
    return async (...args) => {
      try {
        setSteps(steps => update(steps, {[id]: {state: {$set: 'loading'}}}));
        const result = await func(
          {onOutput: handleOutput, onProgress: handleProgress},
          ...args
        );
        setSteps(steps => update(steps, {[id]: {state: {$set: 'success'}}}));
        return result;
      } catch (e) {
        const errorRepr = e.toString?.();
        if (errorRepr) {
          handleOutput(errorRepr);
        }
        if (steps[id].suppressFailureIntoWarning === true) {
          setSteps(steps => update(steps, {[id]: {state: {$set: 'warning'}}}));
          return;
        } else {
          setSteps(steps => update(steps, {[id]: {state: {$set: 'error'}}}));
          return;
        }
      }
    };
  }

  useEffect(() => {
    (async () => {
      const repoPath = await completeStep('ensuredir', ensureRepoDirectory)(
        config.outDirectoryPath,
        config.glossaryID
      );
      if (repoPath) {
        const paths = await completeStep('ensuremeta', ensureMeta)(
          repoPath,
          config.glossaryID,
          config.langCode,
          config.domainName
        );
        if (paths) {
          const itemCount = await completeStep(
            'countitems',
            countItems
          )(config.inputCSVPath);
          if (itemCount) {
            await completeStep('processitems', processItems)(
              config.inputCSVPath,
              paths[0],
              paths[1],
              config.langCode,
              itemCount
            );
          }
        }
      }
    })();
  }, []);

  return (
    <>
      <Box width="100%" flexDirection="column" borderStyle="round" paddingX={2}>
        <Configuration config={config} errs={errs} />
      </Box>
      <TaskList>
        {STEP_SEQUENCE.map(stepID => (
          <Step key={stepID} step={steps[stepID]} />
        ))}
      </TaskList>
    </>
  );
};

export default App;
