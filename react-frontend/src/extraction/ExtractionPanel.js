import * as React from 'react';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';
import MigrateContext from '../context/components/MigrateContext';
import MigrateContextLoad from '../context/components/MigrateContextLoad';
import ExtractionSection from './ExtractionSection';

export default function ExtractionPanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <MigrateContext>
                <MigrateContextLoad>
                    <ExtractionSection />
                </MigrateContextLoad>
            </MigrateContext>
        </React.Fragment>
    );
}
