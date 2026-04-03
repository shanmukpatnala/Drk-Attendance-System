import { doc, updateDoc } from '../utils/firebase';
import { appId } from './constants';
import { hashPassword } from '../utils/helpers';

const resetPasswordErrors = () => ({
  current: '',
  next: '',
  confirm: ''
});

const validateProfilePasswordChange = async ({
  appUser,
  profileCurrentPassword,
  profileNewPassword,
  profileConfirmPassword,
  setProfilePasswordErrors
}) => {
  const wantsPasswordChange = Boolean(
    profileCurrentPassword || profileNewPassword || profileConfirmPassword
  );

  if (!wantsPasswordChange) {
    setProfilePasswordErrors(resetPasswordErrors());
    return { ok: true, nextPassword: null };
  }

  const nextErrors = resetPasswordErrors();

  if (!profileCurrentPassword) {
    nextErrors.current = 'Enter current password';
  }

  if (!profileNewPassword) {
    nextErrors.next = 'Enter new password';
  } else if (profileNewPassword.length < 8) {
    nextErrors.next = 'New password must be at least 8 characters';
  }

  if (!profileConfirmPassword) {
    nextErrors.confirm = 'Confirm the new password';
  } else if (profileNewPassword !== profileConfirmPassword) {
    nextErrors.confirm = 'Confirm password does not match';
  }

  if (Object.values(nextErrors).some(Boolean)) {
    setProfilePasswordErrors(nextErrors);
    return { ok: false, nextPassword: null };
  }

  const currentHash = await hashPassword(profileCurrentPassword);
  const savedPassword = appUser?.password || '';
  const currentMatches = savedPassword === profileCurrentPassword || savedPassword === currentHash;

  if (!currentMatches) {
    setProfilePasswordErrors({
      ...resetPasswordErrors(),
      current: 'Current password is incorrect'
    });
    return { ok: false, nextPassword: null };
  }

  if (profileCurrentPassword === profileNewPassword) {
    setProfilePasswordErrors({
      ...resetPasswordErrors(),
      next: 'New password must be different from current password'
    });
    return { ok: false, nextPassword: null };
  }

  setProfilePasswordErrors(resetPasswordErrors());
  return {
    ok: true,
    nextPassword: await hashPassword(profileNewPassword)
  };
};

export const handleProfilePhotoChange = ({ e, setProfilePhotoDirty, setProfilePhotoPreview }) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const size = Math.min(image.width, image.height);
      const sx = Math.max(0, (image.width - size) / 2);
      const sy = Math.max(0, (image.height - size) / 2);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(image, sx, sy, size, size, 0, 0, size, size);
      setProfilePhotoPreview(canvas.toDataURL('image/jpeg', 0.9));
      setProfilePhotoDirty(true);
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
  e.target.value = '';
};

export const createOpenProfilePhotoActionsHandler = ({
  setShowProfilePhotoActions
}) => () => {
  setShowProfilePhotoActions(true);
};

export const createRemoveProfilePhotoHandler = ({
  setProfilePhotoDirty,
  setProfilePhotoPreview
}) => () => {
  setProfilePhotoDirty(true);
  setProfilePhotoPreview(null);
};

export const createSaveProfileHandler = ({
  appUser,
  db,
  profileName,
  profileUsername,
  profileEmail,
  profilePhone,
  profileDept,
  profilePhotoPreview,
  profileCurrentPassword,
  profileNewPassword,
  profileConfirmPassword,
  setAppUser,
  setProfileCurrentPassword,
  setProfileNewPassword,
  setProfileConfirmPassword,
  setProfileEditMode,
  setProfilePhotoDirty,
  setShowProfilePhotoActions,
  setProfilePasswordErrors,
  setStatusMsg,
  staffUsers
}) => async () => {
  if (!appUser) return;

  try {
    const trimmedUsername = (profileUsername || '').trim().toLowerCase();
    const trimmedName = (profileName || '').trim();

    if (!trimmedName || !trimmedUsername) {
      setStatusMsg({ type: 'error', text: 'Name and username are required.' });
      return;
    }

    const usernameTaken = staffUsers.some((user) => (
      user?.id !== appUser.id
      && (user?.username || '').trim().toLowerCase() === trimmedUsername
    ));

    if (usernameTaken) {
      setStatusMsg({ type: 'error', text: 'This username already exists. Use a different username.' });
      return;
    }

    const { ok, nextPassword } = await validateProfilePasswordChange({
      appUser,
      profileCurrentPassword,
      profileNewPassword,
      profileConfirmPassword,
      setProfilePasswordErrors
    });

    if (!ok) return;

    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'app_users', appUser.id);
    const updateData = {
      name: trimmedName,
      username: trimmedUsername,
      email: (profileEmail || '').trim(),
      phone: (profilePhone || '').trim(),
      department: (profileDept || '').trim() || profileDepartmentFallback(appUser)
    };
    updateData.photo = profilePhotoPreview || '';

    if (nextPassword) {
      updateData.password = nextPassword;
    }

    await updateDoc(userRef, updateData);
    setAppUser((prev) => (prev ? { ...prev, ...updateData } : prev));
    setProfileCurrentPassword('');
    setProfileNewPassword('');
    setProfileConfirmPassword('');
    setProfilePasswordErrors(resetPasswordErrors());
    setProfileEditMode(false);
    setProfilePhotoDirty(false);
    setShowProfilePhotoActions(false);
    setStatusMsg({ type: 'success', text: nextPassword ? 'Profile and password updated successfully' : 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    setStatusMsg({ type: 'error', text: 'Failed to update profile' });
  }
};

function profileDepartmentFallback(appUser) {
  return appUser?.department || '';
}

export const createCancelProfileEditHandler = ({
  appUser,
  setProfileConfirmPassword,
  setProfileCurrentPassword,
  setProfileEditMode,
  setProfilePhotoDirty,
  setProfileEmail,
  setProfileName,
  setProfileNewPassword,
  setProfilePasswordErrors,
  setProfilePhone,
  setProfilePhotoPreview,
  setProfileDept,
  setProfileUsername,
  setShowProfilePhotoActions
}) => () => {
  if (!appUser) return;
  setProfileEditMode(false);
  setProfilePhotoDirty(false);
  setProfileName(appUser.name || '');
  setProfileUsername(appUser.username || '');
  setProfileEmail(appUser.email || '');
  setProfilePhone(appUser.phone || '');
  setProfileDept(appUser.department || '');
  setProfilePhotoPreview(appUser.photo || null);
  setProfileCurrentPassword('');
  setProfileNewPassword('');
  setProfileConfirmPassword('');
  setProfilePasswordErrors(resetPasswordErrors());
  setShowProfilePhotoActions(false);
};
