import { Command, type ICommand, lazyCurrentWorkspace, LoadProject, LoadWorkspace, type Workspace } from '@jujulego/jill';
import * as swc from '@swc/core';
import * as ts from 'typescript';
import { type ArgumentsCamelCase, type Argv } from 'yargs';
import path from 'node:path';

import { LoadTsconfig } from '@/src/middlewares/load-tsconfig';

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
    const configFilename = ts.findConfigFile(this.workspace.cwd, ts.sys.fileExists); // <= 3rd argument for other filename than tsconfig.json
    const configFile = ts.readConfigFile(configFilename!, ts.sys.readFile);
    const compilerOpts = ts.parseJsonConfigFileContent(configFile.config, ts.sys, this.workspace.cwd); // <= contains files "matched" by tsconfig (paths only)

    compilerOpts.options.noEmit = false;
    compilerOpts.options.emitDeclarationOnly = true;

    const host = ts.createCompilerHost(compilerOpts.options);
    host.writeFile = (filename, contents) => console.log({ filename, contents }); // <= file data

    const program = ts.createProgram([path.resolve(this.workspace.cwd, args.file)], compilerOpts.options, host);
    program.emit();
  }
}
