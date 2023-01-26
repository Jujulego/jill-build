import { container, type IMiddleware, lazyInject, Logger, Middleware } from '@jujulego/jill';
import { inject, type interfaces as int } from 'inversify';
import * as ts from 'typescript';
import { type ArgumentsCamelCase, type Argv } from 'yargs';

import { ContextService } from '@/src/context.service';
import { TsDiagnosticService } from '@/src/typescript/ts-diagnostic.service';

// Types
export interface ILoadTsconfigArgs {
  tsconfig: string;
}

// Constants
export const TSCONFIG: int.ServiceIdentifier<ts.ParsedCommandLine> = Symbol('jujulego:jill-build:tsconfig');

// Decorators
export function LazyTsconfig() {
  return lazyInject(TSCONFIG);
}

// Middleware
@Middleware()
export class TsConfigMiddleware implements IMiddleware<ILoadTsconfigArgs> {
  // Attributes
  private readonly logger: Logger;

  // Constructor
  constructor(
    @inject(Logger)
    logger: Logger,
    @inject(ContextService)
    private readonly context: ContextService,
    @inject(TsDiagnosticService)
    private readonly diagnostics: TsDiagnosticService,
  ) {
    this.logger = logger.child({ label: 'tsconfig' });
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
    const filename = ts.findConfigFile(this.context.cwd, ts.sys.fileExists, args.tsconfig);

    if (!filename) {
      this.logger.error('Typescript config file not found !');
      return process.exit(1);
    }

    this.logger.debug(`Typescript config file located at ${filename}`);

    // Load tsconfig file
    const file = ts.readConfigFile(filename, ts.sys.readFile);

    if (file.error) {
      this.diagnostics.log(file.error, this.logger);
      return process.exit(1);
    }

    // Parse config
    const config = ts.parseJsonConfigFileContent(file.config, ts.sys, this.context.cwd);

    if (config.errors.length > 0) {
      for (const err of config.errors) {
        this.diagnostics.log(err, this.logger);
      }

      if (config.errors.some(err => err.category === ts.DiagnosticCategory.Error)) {
        return process.exit(1);
      }
    }

    this.logger.verbose(`Loaded ${filename} config file`);
    this.logger.debug(`Loaded config:\n${JSON.stringify(config.options, null, 2)}`);

    container.bind(TSCONFIG).toConstantValue(config);
  }
}
