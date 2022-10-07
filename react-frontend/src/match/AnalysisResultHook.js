import * as React from 'react'
import _ from 'lodash';
import ResultTree from '../result/ResultTree';
import { useTenantKey } from '../context/TenantListContext';
import { ALPHABETIC } from '../options/SortOrderOption';
import ResultDrawer from '../result/ResultDrawer';

export const useAnalysisResult = () => {

    const { tenantKey } = useTenantKey()
    const [analysisResult, setAnalysisResult] = React.useState(undefined)
    const [initialFilterText, setInitialFilterText] = React.useState("")
    const [openDrawer, setOpenDrawer] = React.useState(false);

    React.useMemo(() => {
        setAnalysisResult(undefined)
        setOpenDrawer(false)
    }, [tenantKey])

    const hasAnalysisResult = React.useMemo(() => {
        setOpenDrawer(false)
        return !_.isEmpty(analysisResult)
    }, [analysisResult])

    return { tenantKey, initialFilterText, analysisResult, hasAnalysisResult, openDrawer, setAnalysisResult, setInitialFilterText, setOpenDrawer }
}

export const useTreeResult = (defaultSortOrder = ALPHABETIC, containsEntrypoint = false) => {
    
    const { tenantKey, initialFilterText, analysisResult, hasAnalysisResult, openDrawer, setAnalysisResult, setInitialFilterText, setOpenDrawer } = useAnalysisResult()


    const treeComponent = React.useMemo(() => {
        setOpenDrawer(false)
        if (!_.isEmpty(analysisResult)) {
            return (
                <ResultTree data={analysisResult} defaultSortOrder={defaultSortOrder} initialFilterText={initialFilterText} setOpenDrawer={setOpenDrawer} containsEntrypoint={containsEntrypoint} />
            )
        }
        return null
    }, [analysisResult])

    const analysisResultComponent = React.useMemo(() => {
        if (!_.isEmpty(analysisResult)) {
            return (
                <ResultDrawer openDrawer={openDrawer} setOpenDrawer={setOpenDrawer}>
                    {treeComponent}
                </ResultDrawer>
            )
        }
        return null
    }, [treeComponent, openDrawer, setOpenDrawer])

    return { tenantKey, hasAnalysisResult, setAnalysisResult, analysisResultComponent, setInitialFilterText }
}
