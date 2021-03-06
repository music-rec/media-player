import React, { useEffect, useState } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { AllModules } from "@ag-grid-enterprise/all-modules";
import styled from "styled-components";
import { CloseOutlined, PersonAddOutlined } from "@material-ui/icons";
import LinkFab from "../LinkFab";
import { useWindowSize } from "../hooks/useWindowSize";
import DeleteCellRenderer from "./cell-renderers/DeleteCellRenderer";
import { useDispatch, useSelector } from "react-redux";
import PasswordCellFormatter from "./cell-renderers/PasswordCellForamtter";
import { DateCellFormatter } from "./cell-renderers/DateCellFormatter";
import { deleteOneUser, deleteUsers, fetchUsers, updateUser } from "../redux/user/user.actions";
import { getIsEmptyUserList, getUserList } from "../redux/user/user.selectors";
import { openSnackbar } from "../redux/ui/ui.actions";
import Fab from "@material-ui/core/Fab";
import Dialog from "./Dialog";
import SignUp from "./SignUp";

const Wrapper = styled.div``;

const AgGridWrapper = styled.div`
  width: 100%;
  height: 75vh;
  margin-top: 1rem;
  .ag-cell-focus {
    border: none !important;
  }
  .ag-icon {
    color: ${({ theme }) => theme.palette.secondary.main} !important;
  }
  .ag-theme-material {
    color: ${({ theme }) => theme.palette.secondary.main} !important;
  }
`;

const Controls = styled.div`
  button {
    margin-top: -5rem;
    margin-right: 0.5rem;
  }
`;

const Users = () => {
  const [gridApi, setGridApi] = useState(null);
  const dispatch = useDispatch();
  const { width } = useWindowSize();
  const rowData = useSelector(getUserList);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const isEmptyUserList = useSelector(getIsEmptyUserList);

  useEffect(() => {
    if (isEmptyUserList) {
      dispatch(fetchUsers());
    }
  }, [isEmptyUserList, dispatch]);

  useEffect(() => {
    dispatch(openSnackbar({ message: "Pressing delete will affect selected rows" }));
    return () => dispatch(openSnackbar({ message: "Don't forget to logout" }));
  }, [dispatch]);

  useEffect(() => {
    const keyDownEventHandler = ({ key }) => {
      if (!!gridApi && key === "Delete") {
        const selectedRows = gridApi.getSelectedRows();
        if (selectedRows.length === 0) {
          dispatch(openSnackbar({ message: "Pressing delete will affect selected rows" }));
        } else {
          dispatch(deleteUsers(selectedRows.map(user => user.username)));
        }
      }
    };
    document.addEventListener("keydown", keyDownEventHandler);
    return () => document.removeEventListener("keydown", keyDownEventHandler);
  }, [gridApi, dispatch]);

  useEffect(() => {
    if (!!gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi, rowData]);

  const handleClickDeleteOne = ({ username }) => {
    dispatch(
      openSnackbar({
        message: (
          <div>
            {`Delete ${username}? `}
            <Fab
              color={"secondary"}
              onClick={() => {
                dispatch(deleteOneUser(username));
              }}
            >
              yes
            </Fab>
          </div>
        )
      })
    );
  };

  const defaultColumnDefs = [
    {
      headerName: "#",
      width: 45,
      checkboxSelection: true,
      editable: false,
      sortable: false,
      filter: false,
      pinned: true
    },
    { headerName: "Id", field: "_id", hide: true, sortable: false, editable: false },
    { headerName: "Username", field: "username", editable: false },
    { headerName: "First Name", field: "firstName" },
    { headerName: "Last Name", field: "lastName" },
    { headerName: "Password", field: "password", cellRenderer: "PasswordCellFormatter" },
    { headerName: "Last Login", field: "lastLogin", editable: false, cellRenderer: "DateCellFormatter" },
    {
      headerName: "",
      cellRenderer: "DeleteCellRenderer",
      cellRendererParams: { onClick: handleClickDeleteOne },
      width: 80
    }
  ];

  const onGridReady = ({ api }) => {
    api.sizeColumnsToFit();
    setGridApi(api);
  };

  const handleEditingStop = ({ column, data }) => {
    dispatch(updateUser(data.username, { [column.colId]: data[column.colId] }));
  };

  const handleAddNewUserClick = () => {
    setIsCreateUserDialogOpen(true);
  };

  const handleAddNewUserClose = () => {
    setIsCreateUserDialogOpen(false);
  };

  useEffect(() => {
    if (!!gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [width, gridApi]);

  return (
    <Wrapper>
      <Controls>
        <LinkFab to={"/listing"} icon={<CloseOutlined />} />
        <LinkFab style={{ marginLeft: "10px" }} icon={<PersonAddOutlined />} onClick={handleAddNewUserClick} />
      </Controls>
      <AgGridWrapper className={"ag-theme-material"}>
        <AgGridReact
          onGridReady={onGridReady}
          suppressRowClickSelection={true}
          animateRows={true}
          rowData={rowData}
          rowSelection="multiple"
          columnDefs={defaultColumnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            editable: true
          }}
          frameworkComponents={{ DeleteCellRenderer, PasswordCellFormatter, DateCellFormatter }}
          modules={AllModules}
          onCellEditingStopped={handleEditingStop}
        />
      </AgGridWrapper>
      <Dialog open={isCreateUserDialogOpen} onDialogClose={handleAddNewUserClose}>
        <SignUp mode={"onBehave"} onCancel={handleAddNewUserClose}/>
      </Dialog>
    </Wrapper>
  );
};

export default Users;
