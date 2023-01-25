import { container, CURRENT, Service, Workspace } from '@jujulego/jill';

// Service
@Service()
export class ContextService {
  // Properties
  get cwd(): string {
    if (container.isBoundNamed(Workspace, CURRENT)) {
      const wks = container.getNamed(Workspace, CURRENT);
      return wks.cwd;
    }

    return process.cwd();
  }
}

