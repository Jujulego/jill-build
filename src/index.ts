import { definePlugin } from '@jujulego/jill';

import { commands } from './commands';

// Plugin
export default definePlugin({
  builder: yargs =>
    yargs.command(commands as any)
});
