import { Command, type ICommand, lazyCurrentWorkspace, LoadProject, LoadWorkspace, type Workspace } from '@jujulego/jill';
import { inject } from 'inversify';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import * as swc from '@swc/core';
import * as ts from 'typescript';
import path from 'node:path';

import { LazyTsconfig, TsConfigMiddleware } from '@/src/middlewares/ts-config.middleware';
import { TsDiagnosticService } from '@/src/typescript/ts-diagnostic.service';

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
  @LazyTsconfig()
  readonly tsconfig: ts.ParsedCommandLine;

  @lazyCurrentWorkspace()
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

    // Build using ts ==> https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
    this.tsconfig.options.noEmit = false;
    this.tsconfig.options.emitDeclarationOnly = true;

    const host = ts.createCompilerHost(this.tsconfig.options);
    host.writeFile = (filename, contents) => console.log({ filename, contents }); // <= file data

    const program = ts.createProgram(this.tsconfig.fileNames, this.tsconfig.options, host);
    // console.log(program.emit());

    // console.log(program.getGlobalDiagnostics());
    // console.log(program.getSyntacticDiagnostics());

    for (const err of program.getSemanticDiagnostics()) {
      this.diagnotics.log(err);
    }

    // console.log(program.getDeclarationDiagnostics());
  }
}
