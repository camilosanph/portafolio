import * as migration_20260626_170609_initial from './20260626_170609_initial';
import * as migration_20260630_000000_projects_collection from './20260630_000000_projects_collection';

export const migrations = [
  {
    up: migration_20260626_170609_initial.up,
    down: migration_20260626_170609_initial.down,
    name: '20260626_170609_initial'
  },
  {
    up: migration_20260630_000000_projects_collection.up,
    down: migration_20260630_000000_projects_collection.down,
    name: '20260630_000000_projects_collection'
  },
];
