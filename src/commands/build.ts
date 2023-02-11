import {
  Command, container,
  type ICommand,
  LazyCurrentWorkspace, lazyInject,
  LoadProject,
  LoadWorkspace,
  TASK_MANAGER,
  type Workspace
} from '@jujulego/jill';
import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import * as swc from '@swc/core';
import path from 'node:path';

import { TsConfigMiddleware } from '@/src/middlewares/ts-config.middleware';
import { TsDiagnosticService } from '@/src/typescript/ts-diagnostic.service';
import { TsBuildFactory, TsBuildTask } from '@/src/typescript/ts-build.task';
import { TaskManager } from '@jujulego/tasks';
import { waitForEvent } from '@jujulego/event-tree';

// Types
export interface IBuildCommandArgs {
  file: string;
}

// Command
@Command({
  command: 'build <file>',
  describe: 'Builds workspace',
  middlewares: [LoadProject, LoadWorkspace, TsConfigMiddleware]
})
export class BuildCommand implements ICommand<IBuildCommandArgs> {
  // Lazy injections
  @lazyInject(TASK_MANAGER)
  readonly manager: TaskManager;

  @LazyCurrentWorkspace()
  readonly workspace: Workspace;

  // Constructor
  constructor(
    @inject(TsDiagnosticService)
    private readonly diagnotics: TsDiagnosticService
  ) {}

  // Methods
  builder(yargs: Argv): Argv<IBuildCommandArgs> {
    return yargs
      .positional('file', { type: 'string', demandOption: true });
  }

  async handler(args: ArgumentsCamelCase<IBuildCommandArgs>) {
    // Build using swc :
    const res = await swc.transformFile(path.resolve(this.workspace.cwd, args.file), {
      cwd: this.workspace.cwd,
      outputPath: path.resolve(this.workspace.cwd, 'dist'),
    });
    console.log(res);

    const task = container.get(TsBuildFactory)();
    this.manager.add(task);

    await waitForEvent(task, 'completed');
  }
}
