import { Logger, Service } from '@jujulego/jill';
import { inject } from 'inversify';
import * as ts from 'typescript';
import fs from 'node:fs';

import { TSCONFIG } from '@/src/middlewares/ts-config.middleware';

import { DocumentRegistry } from './ts-document.registry';

// Service
@Service()
export class TsBuildService {
  // Attributes
  private readonly logger: Logger;
  private readonly service: ts.LanguageService;

  // Constructor
  constructor(
    @inject(Logger) logger: Logger,
    @inject(DocumentRegistry) documentRegistry: DocumentRegistry,
    @inject(TSCONFIG)
    private readonly tsconfig: ts.ParsedCommandLine,
  ) {
    this.logger = logger.child({ label: 'ts-build' });
    this.service = ts.createLanguageService(this.host, documentRegistry);
  }

  // Properties
  private get host(): ts.LanguageServiceHost {
    return {
      log: (msg) => this.logger.info(msg),
      error: (msg) => this.logger.error(msg),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => this.tsconfig.options,
      getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
      getScriptFileNames: () => this.tsconfig.fileNames,
      getScriptVersion: (fileName: string) => 'build',
      getScriptSnapshot(fileName: string) {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }

        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
    };
  }
}
