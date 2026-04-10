import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from '../utils/firebase';
import { appId } from './constants';
import { hashPassword } from '../utils/helpers';

export const getManageUsersAccessState = ({
  appUser,
  staffUsers,
  newUserDept,
  newUserDesignation
}) => {
  const currentUserRole = (appUser?.role || '').trim().toLowerCase();
  const currentUserDepartment = (appUser?.department || '').trim().toUpperCase();
  const normalizedNewUserDept = (newUserDept || '').trim().toUpperCase();
  const normalizedNewUserDesignation = (newUserDesignation || '').trim().toLowerCase();

  const baseDesignationOptions = currentUserRole === 'admin'
    ? ['Dean', 'Principal', 'HOD', 'Faculty']
    : ['dean', 'principal'].includes(currentUserRole)
      ? ['HOD', 'Faculty']
      : currentUserRole === 'hod'
        ? ['Faculty']
        : [];

  const deanExists = staffUsers.some(
    (user) => (user?.role || '').trim().toLowerCase() === 'dean'
  );
  const principalExists = staffUsers.some(
    (user) => (user?.role || '').trim().toLowerCase() === 'principal'
  );

  const selectedDepartmentHasHod = staffUsers.some((user) => (
    (user?.role || '').trim().toLowerCase() === 'hod'
    && ((user?.department || '').trim().toUpperCase() === normalizedNewUserDept)
  ));

  const allowedDesignationOptions = baseDesignationOptions.filter((designation) => {
    const normalizedDesignation = designation.toLowerCase();
    if (normalizedDesignation === 'dean' && deanExists) return false;
    if (normalizedDesignation === 'principal' && principalExists) return false;
    if (normalizedDesignation !== 'hod') return true;
    if (!normalizedNewUserDept) return true;
    return !selectedDepartmentHasHod;
  });

  const visibleManagedUsers = staffUsers
    .filter((user) => {
      if (['admin', 'dean', 'principal'].includes(currentUserRole)) return true;
      if (currentUserRole === 'hod') {
        return ((user?.department || '').trim().toUpperCase() === currentUserDepartment)
          && (user?.role || '').trim().toLowerCase() === 'faculty';
      }
      return false;
    })
    .sort((left, right) => (left?.name || '').localeCompare(right?.name || ''));

  const availableHodDepartments = ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL']
    .filter((department) => !staffUsers.some((user) => (
      (user?.role || '').trim().toLowerCase() === 'hod'
      && ((user?.department || '').trim().toUpperCase() === department)
    )));

  const availableDepartmentOptions = normalizedNewUserDesignation === 'hod'
    ? ['admin', 'dean', 'principal'].includes(currentUserRole)
      ? availableHodDepartments
      : []
    : currentUserRole === 'hod'
      ? [currentUserDepartment].filter(Boolean)
      : ['CSE', 'CSM', 'CSD', 'CSC', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  return {
    currentUserRole,
    currentUserDepartment,
    normalizedNewUserDept,
    normalizedNewUserDesignation,
    allowedDesignationOptions,
    availableDepartmentOptions,
    visibleManagedUsers,
    selectedDepartmentHasHod
  };
};

export const createStaffHandler = ({
  appUser,
  allowedDesignationOptions,
  currentUserDepartment,
  currentUserRole,
  db,
  newUserConfirmPass,
  newUserDept,
  newUserDesignation,
  newUserEmail,
  newUserFirstName,
  newUserLastName,
  newUserPass,
  newUserUser,
  setManageUsersTab,
  setNewUserConfirmPass,
  setNewUserDept,
  setNewUserDesignation,
  setNewUserEmail,
  setNewUserFirstName,
  setNewUserLastName,
  setNewUserPass,
  setNewUserUser,
  setStatusMsg,
  staffUsers
}) => async () => {
  if (!appUser) {
    setStatusMsg({ type: 'error', text: 'Login required to create users.' });
    return;
  }

  if (!allowedDesignationOptions.includes(newUserDesignation)) {
    setStatusMsg({ type: 'error', text: 'You are not allowed to create this role.' });
    return;
  }

  if (
    !newUserFirstName ||
    !newUserLastName ||
    !newUserUser ||
    !newUserDesignation ||
    !newUserPass ||
    !newUserConfirmPass
  ) {
    setStatusMsg({ type: 'error', text: 'Fill all fields' });
    return;
  }

  if (newUserPass.length < 8) {
    setStatusMsg({ type: 'error', text: 'Password must be at least 8 characters' });
    return;
  }

  if (newUserPass !== newUserConfirmPass) {
    setStatusMsg({ type: 'error', text: 'Password and Confirm Password do not match' });
    return;
  }

  try {
    const fullName = `${newUserFirstName} ${newUserLastName}`.trim();
    const normalizedUsername = newUserUser.trim().toLowerCase();
    const normalizedEmail = newUserEmail.trim().toLowerCase();
    const designationLabel = newUserDesignation.trim();
    const roleToSave = designationLabel.toLowerCase();
    const normalizedNewUserDept = (newUserDept || '').trim().toUpperCase();
    const needsDepartment = !['dean', 'principal'].includes(roleToSave);
    const departmentToSave = needsDepartment
      ? (currentUserRole === 'hod' ? currentUserDepartment : normalizedNewUserDept)
      : '';

    if (needsDepartment && !departmentToSave) {
      setStatusMsg({ type: 'error', text: 'Select a department.' });
      return;
    }

    if (currentUserRole === 'hod' && departmentToSave !== currentUserDepartment) {
      setStatusMsg({ type: 'error', text: 'HOD can create faculty only for their own branch.' });
      return;
    }

    const existingUsername = staffUsers.find(
      (user) => (user?.username || '').trim().toLowerCase() === normalizedUsername
    );
    if (existingUsername) {
      setStatusMsg({ type: 'error', text: 'This username already exists. Use a different username.' });
      return;
    }

    if (normalizedEmail) {
      const existingEmail = staffUsers.find(
        (user) => (user?.email || '').trim().toLowerCase() === normalizedEmail
      );
      if (existingEmail) {
        setStatusMsg({ type: 'error', text: 'This email already exists. Use a different email.' });
        return;
      }
    }

    if (roleToSave === 'principal') {
      const principalExists = staffUsers.some(
        (user) => (user?.role || '').trim().toLowerCase() === 'principal'
      );
      if (principalExists) {
        setStatusMsg({ type: 'error', text: 'Principal account already exists. Cannot create another principal.' });
        return;
      }
    }

    if (roleToSave === 'dean') {
      const deanExists = staffUsers.some(
        (user) => (user?.role || '').trim().toLowerCase() === 'dean'
      );
      if (deanExists) {
        setStatusMsg({ type: 'error', text: 'Dean account already exists. Cannot create another dean.' });
        return;
      }
    }

    if (roleToSave === 'hod') {
      const existingHod = staffUsers.find((user) => (
        (user?.role || '').trim().toLowerCase() === 'hod'
        && ((user?.department || '').trim().toUpperCase() === departmentToSave)
      ));
      if (existingHod) {
        setStatusMsg({ type: 'error', text: `${departmentToSave} HOD already exists. Cannot create another HOD for this branch.` });
        return;
      }
    }

    const hashed = await hashPassword(newUserPass);

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'app_users'), {
      username: normalizedUsername,
      password: hashed,
      role: roleToSave,
      name: fullName,
      department: departmentToSave,
      designation: designationLabel,
      email: normalizedEmail,
      active: true,
      status: 'active',
      createdBy: appUser?.username,
      createdAt: serverTimestamp()
    });

    setStatusMsg({ type: 'success', text: `${designationLabel} account for ${fullName} created successfully.` });
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserUser('');
    setNewUserEmail('');
    setNewUserDept(currentUserRole === 'hod' ? currentUserDepartment : 'CSE');
    setNewUserDesignation(allowedDesignationOptions[0] || 'Faculty');
    setNewUserPass('');
    setNewUserConfirmPass('');
    setManageUsersTab('list');
  } catch (err) {
    console.error(err);
    setStatusMsg({ type: 'error', text: 'Failed to create staff' });
  }
};

export const createToggleUserStatusHandler = ({
  appUser,
  currentUserRole,
  db,
  setStatusMsg
}) => async (user) => {
  if (currentUserRole !== 'admin' || !user?.id) {
    setStatusMsg({ type: 'error', text: 'Only admin can activate or deactivate users.' });
    return;
  }

  if (user.id === appUser?.id) {
    setStatusMsg({ type: 'error', text: 'You cannot deactivate your own account.' });
    return;
  }

  const currentlyActive = user?.active !== false && (user?.status || 'active').toLowerCase() !== 'inactive';
  const nextActive = !currentlyActive;

  try {
    await updateDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'app_users', user.id),
      {
        active: nextActive,
        status: nextActive ? 'active' : 'inactive',
        updatedAt: serverTimestamp(),
        updatedBy: appUser?.username || 'admin'
      }
    );
    setStatusMsg({
      type: 'success',
      text: `${user.name || user.username} ${nextActive ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (error) {
    console.error('toggle user status error', error);
    setStatusMsg({ type: 'error', text: 'Failed to update user status.' });
  }
};

export const createRemoveUserHandler = ({
  appUser,
  currentUserRole,
  db,
  setStatusMsg
}) => async (user) => {
  if (currentUserRole !== 'admin' || !user?.id) {
    setStatusMsg({ type: 'error', text: 'Only admin can remove users.' });
    return;
  }

  if (user.id === appUser?.id) {
    setStatusMsg({ type: 'error', text: 'You cannot remove your own account.' });
    return;
  }

  try {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', user.id));
    setStatusMsg({ type: 'success', text: `${user.name || user.username} removed successfully.` });
  } catch (error) {
    console.error('remove user error', error);
    setStatusMsg({ type: 'error', text: 'Failed to remove user.' });
  }
};
