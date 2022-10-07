import React from "react";
import { useLoadTenantList } from '../context/TenantListContext';
import { useLoadExecutionOptions } from '../context/ExecutionContext';
import { useLoadEntityFilterList } from '../context/EntityFilterContext';

export default function LoadContext(props) {
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
        if(isLoaded) {
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