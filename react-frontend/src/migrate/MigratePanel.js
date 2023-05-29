import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateEntities from './MigrateEntities';

export default function MigratePanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateEntities />
        </React.Fragment>
    );
}

/*
    <EntityFilterSection />
    <PreemptiveMigrationBox />
    <ApplyMigrationBox />
*/