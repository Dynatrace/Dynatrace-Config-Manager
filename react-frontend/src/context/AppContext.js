import { ContextMenuContextDispatch, ContextMenuContextState, useContextMenuContextReducer } from "./ContextMenuContext";
import { ExecutionOptionsContextDispatch, ExecutionOptionsContextState, useExecutionOptionsContextReducer } from "./ExecutionContext";
import { SettingContextDispatch, SettingContextState, useSettingContextReducer } from "./SettingContext";
import { TenantListContextDispatch, TenantListContextState, useTenantListContextReducer } from "./TenantListContext";
import { EntityFilterListContextDispatch, EntityFilterListContextState, useEntityFilterListContextReducer } from "./EntityFilterContext";
import { ResultContextDispatch, ResultContextState, useResultContextReducer } from "./ResultContext";

export default function AppContext(props) {
    const [tenantListState, tenantListDispatch] = useTenantListContextReducer()
    const [executionOptionsState, executionOptionsDispatch] = useExecutionOptionsContextReducer()
    const [settingState, settingDispatch] = useSettingContextReducer()
    const [contextMenuState, contextMenuDispatch] = useContextMenuContextReducer()
    const [entityFilterListState, entityFilterListDispatch] = useEntityFilterListContextReducer()
    const [resultState, resultDispatch] = useResultContextReducer()
    return (
        <TenantListContextState.Provider value={tenantListState}>
            <TenantListContextDispatch.Provider value={tenantListDispatch}>
                <ExecutionOptionsContextState.Provider value={executionOptionsState}>
                    <ExecutionOptionsContextDispatch.Provider value={executionOptionsDispatch}>
                        <SettingContextState.Provider value={settingState}>
                            <SettingContextDispatch.Provider value={settingDispatch}>
                                <ContextMenuContextState.Provider value={contextMenuState}>
                                    <ContextMenuContextDispatch.Provider value={contextMenuDispatch}>
                                        <EntityFilterListContextState.Provider value={entityFilterListState}>
                                            <EntityFilterListContextDispatch.Provider value={entityFilterListDispatch}>
                                                <ResultContextState.Provider value={resultState}>
                                                    <ResultContextDispatch.Provider value={resultDispatch}>
                                                        {props.children}
                                                    </ResultContextDispatch.Provider>
                                                </ResultContextState.Provider>
                                            </EntityFilterListContextDispatch.Provider>
                                        </EntityFilterListContextState.Provider>
                                    </ContextMenuContextDispatch.Provider>
                                </ContextMenuContextState.Provider>
                            </SettingContextDispatch.Provider>
                        </SettingContextState.Provider>
                    </ExecutionOptionsContextDispatch.Provider>
                </ExecutionOptionsContextState.Provider>
            </TenantListContextDispatch.Provider>
        </TenantListContextState.Provider>
    )
}