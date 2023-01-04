import { defineCommand } from '@jujulego/jill';

// Command
export default defineCommand({
  command: 'build <file>',
  describe: 'Builds workspace',
  builder: (yargs) => yargs
    .positional('file', { type: 'string' }),
  handler: (args) => {
    console.log(args);
  }
});
