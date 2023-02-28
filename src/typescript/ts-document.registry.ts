import { container } from '@jujulego/jill';
import * as ts from 'typescript';

// Service
export class DocumentRegistry {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentRegistry extends ts.DocumentRegistry {}

container.bind(DocumentRegistry)
  .toDynamicValue(() => ts.createDocumentRegistry())
  .inSingletonScope();
