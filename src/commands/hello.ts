import { defineCommand } from '@jujulego/jill';

import fancy from './hello/fancy';

// Command
export default defineCommand({
  command: 'hello',
  describe: 'Hello world',
  builder: (yargs) =>
    yargs.command(fancy),
  handler: () => {
    console.log('Hello world!')
  }
});
