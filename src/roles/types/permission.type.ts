import { Action } from '../enums/action.enum';
import { Resource } from '../enums/resource.enum';

export class Permission {
  resource: Resource;
  actions: Action[];
}
