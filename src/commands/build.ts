import { Command, type ICommand, lazyCurrentWorkspace, LoadProject, LoadWorkspace, type Workspace } from '@jujulego/jill';
import * as swc from '@swc/core';
import * as ts from 'typescript';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import path from 'node:path';

import { LazyTsconfig, LoadTsconfig } from '@/src/middlewares/load-tsconfig';

// Types
export interface IBuildCommandArgs {
  file: string;
}

// Command
@Command({
  command: 'build <file>',
  describe: 'Builds workspace',
  middlewares: [LoadProject, LoadWorkspace, LoadTsconfig]
})
export class BuildCommand implements ICommand<IBuildCommandArgs> {
  // Lazy injections
  @LazyTsconfig()
  readonly tsconfig: ts.ParsedCommandLine;

  @lazyCurrentWorkspace()
  readonly workspace: Workspace;

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

    // Build using ts ==> https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
    this.tsconfig.options.noEmit = false;
    this.tsconfig.options.emitDeclarationOnly = true;

    const host = ts.createCompilerHost(this.tsconfig.options);
    host.writeFile = (filename, contents) => console.log({ filename, contents }); // <= file data

    const program = ts.createProgram([path.resolve(this.workspace.cwd, args.file)], this.tsconfig.options, host);
    program.emit();
  }
}
