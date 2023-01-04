import {
  applyMiddlewares,
  container,
  CURRENT,
  defineCommand,
  loadProject,
  loadWorkspace,
  Workspace
} from '@jujulego/jill';
import * as swc from '@swc/core';
import * as ts from 'typescript';
import path from 'node:path';

// Command
export default defineCommand({
  command: 'build <file>',
  describe: 'Builds workspace',
  builder: async (yargs) =>
    (await applyMiddlewares(yargs, [
      loadProject,
      loadWorkspace,
    ]))
    .positional('file', { type: 'string', demandOption: true }),
  async handler(args) {
    const workspace = container.getNamed(Workspace, CURRENT);

    // Build using swc :
    // const res = await swc.transformFile(path.resolve(workspace.cwd, args.file), {
    //   cwd: workspace.cwd,
    //   outputPath: path.resolve(workspace.cwd, 'dist'),
    // });
    // console.log(res);

    // Build using ts ==> https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
    const configFilename = ts.findConfigFile(workspace.cwd, ts.sys.fileExists); // <= 3rd argument for other filename than tsconfig.json
    const configFile = ts.readConfigFile(configFilename!, ts.sys.readFile);
    const compilerOpts = ts.parseJsonConfigFileContent(configFile.config, ts.sys, workspace.cwd); // <= contains files "matched" by tsconfig (paths only)

    compilerOpts.options.noEmit = false;
    compilerOpts.options.emitDeclarationOnly = true;

    const host = ts.createCompilerHost(compilerOpts.options);
    host.writeFile = (filename, contents) => console.log({ filename, contents }); // <= file data

    const program = ts.createProgram([path.resolve(workspace.cwd, args.file)], compilerOpts.options, host);
    program.emit();
  }
});
