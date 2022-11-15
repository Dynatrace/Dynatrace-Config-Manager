import React from "react";
import { useContextMenuStateValue } from "../context/ContextMenuContext";

export default function ContextMenu(props) {

    const { contextMenu } = useContextMenuStateValue()

    return (
        <div style={{ cursor: 'context-menu' }}>
            {contextMenu}
            {props.children}
        </div>
    )
}