import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Link } from '@mui/material';
import { useContextMenuState } from '../context/ContextMenuContext';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';

export function useResultItemMenu(setOpenDrawer, data) {

  const [menuPosition, setMenuPosition] = React.useState(null);
  const [cursorPosition, setCursorPosition] = React.useState(null);
  const { contextMenu, contextNode, setContextMenu, setContextNode } = useContextMenuState()

  const handleClose = React.useMemo(() => {
    return () => {
      setMenuPosition(null)
    }
  }, [setMenuPosition])

  const [tenantItemComponentMain] = useTenantItems(contextNode, handleClose, TENANT_KEY_TYPE_MAIN)
  const [tenantItemComponentTarget] = useTenantItems(contextNode, handleClose, TENANT_KEY_TYPE_TARGET)


  React.useMemo(() => {
    if (contextMenu !== null) {
      setContextMenu(null)
    }
    if (contextNode !== null) {
      setContextNode(null)
    }
  }, [data])

  const handleContextMenu = React.useMemo(() => {
    return (event, nodeNew) => {
      event.preventDefault()

      setCursorPosition({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
      })
      setContextNode(nodeNew.value)

      event.stopPropagation()
    }
  }, [setContextNode, setCursorPosition])

  React.useMemo(() => {

    let menuPositionNew = null

    if (menuPosition === null) {
      menuPositionNew = cursorPosition
    }

    setMenuPosition(menuPositionNew)

  }, [cursorPosition, setMenuPosition])


  const handleOpenDrawer = React.useMemo(() => {
    return (event) => {
      handleClose()
      setOpenDrawer(true)
    }
  }, [handleClose])

  const menuItems = React.useMemo(() => {
    let items = null
    if (contextNode !== null) {

      items = [
        <MenuItem key="drawer" onClick={handleOpenDrawer}>Details</MenuItem>,
      ]

      if (tenantItemComponentMain) {
        items.concat(tenantItemComponentMain)
      }

      if (tenantItemComponentTarget) {
        items.concat(tenantItemComponentTarget)
      }
    }
    return items
  }, [handleClose, contextNode, handleOpenDrawer, tenantItemComponentMain, tenantItemComponentTarget])


  React.useMemo(() => {

    setContextMenu(
      <Menu
        container={null}
        open={menuPosition !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          menuPosition !== null
            ? { top: menuPosition.mouseY, left: menuPosition.mouseX }
            : undefined
        }
        disableRestoreFocus
      >
        {menuItems}
      </Menu>
    )

  }, [menuPosition, menuItems, handleClose])

  return { handleContextMenu }

}

export function useTenantItems(contextNode, handleClose, tenantTypeKey = TENANT_KEY_TYPE_MAIN) {
  const { tenantKey } = useTenantKey(tenantTypeKey)

  const tenantItems = React.useMemo(() => {
    let items = []

    if (contextNode === null
      || contextNode === undefined) {
      return items
    }

    let entityType = ''
    let entityId = ''
    if ('keyObject' in contextNode) {
      const keyObject = contextNode['keyObject']

      if ('entityType' in keyObject) {
        entityType = keyObject['entityType']
      }

      if ('scope' in keyObject) {
        entityId = keyObject['scope']
      }

      if (tenantTypeKey === TENANT_KEY_TYPE_MAIN
        && 'from' in keyObject) {
        entityId = keyObject['from']
      }

      if (tenantTypeKey === TENANT_KEY_TYPE_TARGET
        && 'to' in keyObject) {
        entityId = keyObject['to']
      }
    }

    if (entityType === ''
      || entityId === '') {

      ;

    } else {

      if (tenantKey && tenantKey.url && tenantKey.url !== "") {

        if (entityType === "PROCESS_GROUP_INSTANCE") {
          const viewInTenantUIUrl = tenantKey.url + "#processdetails;id=" + contextNode.entityId + ";gtf=-2h;gf=all"
          items.push(
            <MenuItem key="link_entity" component={Link} onClick={handleClose} href={viewInTenantUIUrl} target="_blank" rel=" noopener noreferrer">Show in TenantUI</MenuItem>
          )
        }
      }
    }

    return items

  }, [tenantKey, handleClose, contextNode])

  return tenantItems

}