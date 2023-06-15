import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateTenant from './MigrateTenant';

export default function MigratePanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateTenant />
        </React.Fragment>
    );
}

/*
    <EntityFilterSection />
    <PreemptiveMigrationBox />
    <ApplyMigrationBox />
*/