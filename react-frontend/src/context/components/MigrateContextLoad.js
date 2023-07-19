import React from "react";
import { useLoadHistory } from "../HistoryContext";

export default function MigrateContextLoad(props) {
    const { isHistoryLoaded } = useLoadHistory();

    const isLoaded = React.useMemo(() => {
        if (isHistoryLoaded) {
            return true
        }
        return false
    }, [isHistoryLoaded])

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