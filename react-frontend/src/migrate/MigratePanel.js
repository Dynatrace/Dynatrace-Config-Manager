import * as React from 'react';
import EntityFilterSection from '../filter/EntityFilterSection';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateEntities from './MigrateEntities';

export default function MigratePanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <EntityFilterSection />
            <MigrateEntities />
        </React.Fragment>
    );
}
