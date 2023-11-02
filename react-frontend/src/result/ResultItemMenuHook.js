/*
Copyright 2023 Dynatrace LLC

Licensed under the Apache License, Version 2.0 (the "License"); 
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
See the License for the specific language governing permissions and 
limitations under the License.
*/

import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Link } from '@mui/material';
import { useContextMenuState } from '../context/ContextMenuContext';
import { TENANT_KEY_TYPE_MAIN, TENANT_KEY_TYPE_TARGET, useTenantKey } from '../context/TenantListContext';
import { shouldKeepDrawerOpen } from './ResultHook';
import { getObjectFromKeyArray } from './ResultDrawerDetailsSchema';
import { useContextResultKey } from './ResultDrawerDetails';
import { useResult } from '../context/ResultContext';

export function useResultItemMenu(setOpenDrawer, data) {

  const [menuPosition, setMenuPosition] = React.useState(null);
  const [cursorPosition, setCursorPosition] = React.useState(null);
  const { contextMenu, contextNode, setContextMenu, setContextNode } = useContextMenuState()
  const resultKey = useContextResultKey(contextNode)
  const { result } = useResult(resultKey)

  const handleClose = React.useMemo(() => {
    return () => {
      setMenuPosition(null)
    }
  }, [setMenuPosition])

  const [tenantItemComponentMain] = useTenantItems(contextNode, handleClose, TENANT_KEY_TYPE_MAIN)
  const [tenantItemComponentTarget] = useTenantItems(contextNode, handleClose, TENANT_KEY_TYPE_TARGET)


  React.useMemo(() => {
    if (shouldKeepDrawerOpen(data)) {
      // pass
    } else {
      if (contextMenu !== null) {
        setContextMenu(null)
      }
      if (contextNode !== null) {
        setContextNode(null)
      }
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

      const [row, , ,] = getObjectFromKeyArray(result, contextNode.rowArray, 0)
      let label = "Details"
      if (row && 'module' in row) {
        label = `${label} of ${row["module"]}`
      }
      items = [
        <MenuItem key="drawer" onClick={handleOpenDrawer}>{label}</MenuItem>,
      ]

      if (tenantItemComponentMain) {
        items.concat(tenantItemComponentMain)
      }

      if (tenantItemComponentTarget) {
        items.concat(tenantItemComponentTarget)
      }
    }
    return items
  }, [contextNode, handleOpenDrawer, tenantItemComponentMain, tenantItemComponentTarget])


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

export function useTenantItems(contextNode, handleClose, tenantKeyType = TENANT_KEY_TYPE_MAIN) {
  const { tenantKey } = useTenantKey(tenantKeyType)

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

      if (tenantKeyType === TENANT_KEY_TYPE_MAIN
        && 'from' in keyObject) {
        entityId = keyObject['from']
      }

      if (tenantKeyType === TENANT_KEY_TYPE_TARGET
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