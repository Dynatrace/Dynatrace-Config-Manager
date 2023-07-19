import React from "react";
import { useLoadTenantList } from '../TenantListContext';
import { useLoadExecutionOptions } from '../ExecutionContext';
import { useLoadEntityFilterList } from '../EntityFilterContext';

export default function AppContextLoad(props) {
    const { isTenantListLoaded } = useLoadTenantList();
    const { isExecutionOptionsLoaded } = useLoadExecutionOptions();
    const { isEntityFilterListLoaded } = useLoadEntityFilterList();

    const isLoaded = React.useMemo(() => {
        if (isTenantListLoaded && isExecutionOptionsLoaded && isEntityFilterListLoaded) {
            return true
        }
        return false
    }, [isTenantListLoaded, isExecutionOptionsLoaded, isEntityFilterListLoaded])

    const genChildren = () => {
        if (isLoaded) {
            return props.children
        } else {
            return null
        }
    }

    return (
        <React.Fragment>
            {genChildren()}
        </React.Fragment>
    )
}