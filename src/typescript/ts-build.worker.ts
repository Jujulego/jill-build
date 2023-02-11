import { container, Logger } from '@jujulego/jill';
import { WorkerHandler } from '@jujulego/tasks';
import { decorate, inject, injectable } from 'inversify';
import wt from 'node:worker_threads';
import * as ts from 'typescript';

import { TsDiagnosticService } from '@/src/typescript/ts-diagnostic.service';

// Worker
class TsBuildWorker extends WorkerHandler {
  // Attributes
  private readonly tsconfig = wt.workerData;
  // private readonly logger: Logger;

  // Constructor
  // constructor(
  //   @inject(Logger)
  //   logger: Logger,
  // ) {
  //   super();
  //
  //   this.logger = logger.child({ label: 'typescript' });
  //   this.logger.verbose(`worker started in thread #${wt.threadId}`);
  // }

  // Methods
  protected async _run(payload: unknown): Promise<void> {
    try {
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
        this.emit(err);
      }

      // console.log(program.getDeclarationDiagnostics());
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

const task = new TsBuildWorker();
task.init();
