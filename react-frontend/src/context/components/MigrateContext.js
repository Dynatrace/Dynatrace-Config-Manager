import { HistoryContextDispatch, HistoryContextState, useHistoryContextReducer } from "../HistoryContext";


export default function MigrateContext(props) {
    const [historyState, historyDispatch] = useHistoryContextReducer()

    return (
        <HistoryContextState.Provider value={historyState}>
            <HistoryContextDispatch.Provider value={historyDispatch}>
                {props.children}
            </HistoryContextDispatch.Provider>
        </HistoryContextState.Provider>
    )
}