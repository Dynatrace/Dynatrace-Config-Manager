import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateTenant from './MigrateTenant';
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';

export default function MigratePanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateContext>
                <MigrateContextLoad>
                    <MigrateTenant />
                </MigrateContextLoad>
            </MigrateContext>
        </React.Fragment>
    );
}
