#!/usr/bin/env node

import React from 'react';
import getConfig from './config';
import App from './app';
import {render} from 'ink';

function test() {
  const config = getConfig();
  render(<App />);
}

test();
