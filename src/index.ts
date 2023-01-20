import { Plugin } from '@jujulego/jill';

import { BuildCommand } from './commands';

// Plugin
@Plugin({
  commands: [BuildCommand]
})
export default class BuildPlugin {}
