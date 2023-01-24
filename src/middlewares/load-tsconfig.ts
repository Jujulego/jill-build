import { container, CURRENT, type IMiddleware, Logger, Middleware, Workspace } from '@jujulego/jill';
import { type interfaces as int } from 'inversify';
import * as ts from 'typescript';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { logDiagnostic } from '@/src/utils/typescript';

// Types
export interface ILoadTsconfigArgs {
  tsconfig: string;
}

// Constants
export const TSCONFIG: int.ServiceIdentifier<ts.ParsedCommandLine> = Symbol('jujulego:jill-build:tsconfig');

// Middleware
@Middleware()
export class LoadTsconfig implements IMiddleware<ILoadTsconfigArgs> {
  // Attributes
  private readonly logger: Logger;

  // Constructor
  constructor() {
    this.logger = container.get(Logger).child({ label: 'tsconfig' });
  }

  // Methods
  builder(parser: Argv): Argv<ILoadTsconfigArgs> {
    return parser
      .option('tsconfig', {
        type: 'string',
        default: 'tsconfig.json',
        description: 'Typescript config file'
      });
  }

  async handler(args: ArgumentsCamelCase<ILoadTsconfigArgs>): Promise<void> {
    // Locate tsconfig file
    const filename = ts.findConfigFile(this.cwd, ts.sys.fileExists, args.tsconfig);

    if (!filename) {
      this.logger.error('Typescript config file not found !');
      return process.exit(1);
    }

    this.logger.debug(`Typescript config file located at ${filename}`);

    // Load tsconfig file
    const file = ts.readConfigFile(filename, ts.sys.readFile);
    const config = ts.parseJsonConfigFileContent(file.config, ts.sys, this.cwd);

    if (config.errors.length > 0) {
      for (const err of config.errors) {
        logDiagnostic(this.logger, err);
      }

      if (config.errors.some(err => err.category === ts.DiagnosticCategory.Error)) {
        return process.exit(1);
      }
    }

    this.logger.verbose(`Loaded ${filename} config file`);
    this.logger.debug(`Loaded config:\n${JSON.stringify(config, null, 2)}`);

    container.bind(TSCONFIG).toConstantValue(config);
  }

  // Properties
  get cwd(): string {
    if (container.isBoundNamed(Workspace, CURRENT)) {
      const wks = container.getNamed(Workspace, CURRENT);
      return wks.cwd;
    }

    return process.cwd();
  }
}
