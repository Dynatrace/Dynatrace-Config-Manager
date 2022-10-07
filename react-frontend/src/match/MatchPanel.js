import * as React from 'react';
import MatchEntities from './MatchEntities';
import EntityFilterSection from '../filter/EntityFilterSection';
import TenantMigrationSelector from '../credentials/TenantMigrationSelector';

export default function MatchPanel() {

    return (
        <React.Fragment>
            <TenantMigrationSelector />
            <EntityFilterSection />
            <MatchEntities />
        </React.Fragment>
    );
}
