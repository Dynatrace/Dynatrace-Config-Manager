import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Link } from '@mui/material';
import { useContextMenuState } from '../context/ContextMenuContext';
import { useCurrentTenant } from '../context/TenantListContext';

export default function useResultItemMenu(setOpenDrawer, data) {

  const [menuPosition, setMenuPosition] = React.useState(null);
  const [cursorPosition, setCursorPosition] = React.useState(null);
  const { contextNode, setContextMenu, setContextNode } = useContextMenuState()
  const { tenant } = useCurrentTenant()

  React.useMemo(() => {
    setContextMenu(null)
    setContextNode(null)
  }, [data])

  const handleContextMenu = React.useMemo(() => {
    return (event, nodeNew) => {
      event.preventDefault()

      setCursorPosition({
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
      })
      setContextNode(nodeNew)

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

  const handleClose = React.useMemo(() => {
    return () => {
      setMenuPosition(null)
    }
  }, [setMenuPosition])

  const toClipboard = React.useMemo(() => {
    return (event) => {
      navigator.clipboard.writeText(contextNode.name)
      handleClose()
    }
  }, [contextNode, handleClose])

  const handleOpenDrawer = React.useMemo(() => {
    return (event) => {
      handleClose()
      setOpenDrawer(true)
    }
  }, [handleClose])

  const menuItems = React.useMemo(() => {
    let items = null
    if (contextNode !== null) {
      const googleSearchUrl = "https://www.google.com/search?q=" + contextNode.name

      items = [
        <MenuItem key="copy" onClick={toClipboard}>Copy</MenuItem>,
        <MenuItem key="google" component={Link} onClick={handleClose} href={googleSearchUrl} target="_blank" rel=" noopener noreferrer">Search on Google</MenuItem>,
        <MenuItem key="drawer" onClick={handleOpenDrawer}>Details</MenuItem>
      ]
      if ('entity_type' in contextNode && 'entity_id' in contextNode) {
        if (contextNode.entity_type == "PROCESS_GROUP_INSTANCE") {
          if (tenant && tenant.url && tenant.url !== "") {
            const viewInTenantUIUrl = tenant.url + "#processdetails;id=" + contextNode.entity_id + ";gtf=-2h;gf=all"
            items.push(
              <MenuItem key="link_entity" component={Link} onClick={handleClose} href={viewInTenantUIUrl} target="_blank" rel=" noopener noreferrer">Show in TenantUI</MenuItem>
            )
          }
        }
      }
    }
    return items
  }, [handleClose, contextNode])


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
