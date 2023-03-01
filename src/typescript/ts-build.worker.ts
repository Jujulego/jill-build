import { container, Logger } from '@jujulego/jill';
import { WorkerHandler } from '@jujulego/tasks';
import { decorate, inject, injectable } from 'inversify';
import wt from 'node:worker_threads';
import * as ts from 'typescript';

import { TSCONFIG } from '@/src/middlewares/ts-config.middleware';

import { type TsBuildMessage } from './ts-build.message';
import { TsDiagnosticService } from './ts-diagnostic.service';

// Setup
container.bind(TSCONFIG).toConstantValue(wt.workerData);

// Worker
@injectable()
class TsBuildWorker extends WorkerHandler {
  // Attributes
  private readonly logger: Logger;
  private readonly host: ts.CompilerHost;
  private program?: ts.Program;

  // Constructor
  constructor(
    @inject(Logger)
    logger: Logger,
    @inject(TSCONFIG)
    private readonly tsconfig: ts.ParsedCommandLine,
    @inject(TsDiagnosticService)
    private readonly diagnostics: TsDiagnosticService,
  ) {
    super();

    // Setup logger
    this.logger = logger.child({ label: 'ts-build' });
    this.logger.verbose(`worker started in thread #${wt.threadId}`);

    // Setup host
    this.host = ts.createCompilerHost(tsconfig.options);
    this.host.writeFile = (filename, contents) => this.logger.verbose(`${filename} emitted`); // <= file data
  }

  // Methods
  protected async _run(payload: TsBuildMessage): Promise<void> {
    try {
      // Build using ts ==> https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
      this.program = ts.createProgram(payload.files, this.tsconfig.options, this.host, this.program);
      const result = this.program.emit();

      for (const err of result.diagnostics) {
        this.diagnostics.log(err);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

decorate(injectable(), WorkerHandler);
container.bind(TsBuildWorker).toSelf();

(await container.getAsync(TsBuildWorker)).init();
