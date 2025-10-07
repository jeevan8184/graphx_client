import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "./auth"; // Adjust path if needed

import {
  FaUser, FaPalette, FaShieldAlt, FaTrash, FaSpinner, FaBell,
  FaCheckCircle, FaExclamationCircle, FaEdit
} from "react-icons/fa";


const Avatar = ({ user, isDarkMode }) => {
  const getFirstLetter = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-bold text-3xl sm:text-4xl select-none
      ${isDarkMode
        ? 'bg-purple-800 text-purple-100'
        : 'bg-pink-100 text-pink-600'
      }`}
    >
      {user?.photoURL ? (
        <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{getFirstLetter(user?.name)}</span>
      )}
    </div>
  );
};

const FormRow = ({ label, description, children, isDarkMode }) => (
  <div className={`py-5 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-slate-200'}`}>
    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
      <div className="md:w-1/3 mb-2 md:mb-0">
        <label className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{label}</label>
        {description && <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>}
      </div>
      <div className="w-full md:w-2/3">{children}</div>
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onChange, isDarkMode }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only peer" checked={enabled} onChange={onChange} />
    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 ${isDarkMode ? 'bg-gray-600' : 'bg-slate-200'}`}></div>
  </label>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, isDeleting, isDarkMode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`p-6 rounded-lg shadow-xl max-w-sm w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-bold text-red-500">Are you sure?</h2>
          <p className={`my-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>This action is irreversible and cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className={`px-4 py-2 rounded-md font-semibold transition-colors ${isDarkMode ? 'text-gray-200 bg-gray-600 hover:bg-gray-500' : 'text-gray-700 bg-slate-200 hover:bg-slate-300'}`}>Cancel</button>
            <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2 transition-colors">
              {isDeleting && <FaSpinner className="animate-spin" />} Delete Account
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- MAIN SETTINGS PAGE COMPONENT ---

const SettingsPage = ({ isDarkMode, setIsDarkMode }) => {
  const { userData, loading: authLoading, checkAuthStatus, logout } = useAuth();

  console.log("userData in SettingsPage:", userData); // Debugging line

  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profileData, setProfileData] = useState({ displayName: "", bio: "" });
  const [profileStatus, setProfileStatus] = useState({ loading: false, error: null, success: null });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: null });
  const [deleteStatus, setDeleteStatus] = useState({ loading: false });
  const [notifications, setNotifications] = useState({ email: true, push: false });

  useEffect(() => {
    if (userData) {
      setProfileData({ displayName: userData.displayName || "", bio: userData.bio || "" });
    }
  }, [userData]);
  
  const handleApiAction = async (apiCall, onSuccess, setStatus, successMessage) => {
    setStatus({ loading: true, error: null, success: null });
    try {
      await apiCall();
      setStatus({ loading: false, success: successMessage });
      if (onSuccess) onSuccess();
      setTimeout(() => setStatus(prev => ({ ...prev, success: null })), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An unknown error occurred.";
      setStatus({ loading: false, error: errorMessage });
      setTimeout(() => setStatus(prev => ({ ...prev, error: null })), 5000);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    handleApiAction(() => axios.put(`${import.meta.env.VITE_API_URL}/user/profile`, profileData, { withCredentials: true }), () => { checkAuthStatus(); setIsEditingProfile(false); }, setProfileStatus, "Profile updated!");
  };

  const handleCancelEdit = () => {
    setProfileData({ displayName: userData.displayName || "", bio: userData.bio || "" });
    setIsEditingProfile(false);
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    handleApiAction(() => axios.put(`${import.meta.env.VITE_API_URL}/user/password`, passwordData, { withCredentials: true }), () => setPasswordData({ currentPassword: "", newPassword: "" }), setPasswordStatus, "Password changed!");
  };

  const handleDeleteAccount = () => {
    handleApiAction(() => axios.delete(`${import.meta.env.VITE_API_URL}/user`, { withCredentials: true }), () => { setDeleteModalOpen(false); logout(); }, setDeleteStatus, "Account deleted.");
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  const renderContent = () => {
    const content = {
      profile: (
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Public Profile</h2>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your public information.</p>
            </div>
            {!isEditingProfile && (
              <button onClick={() => setIsEditingProfile(true)} className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors w-full sm:w-auto ${isDarkMode ? 'text-purple-300 bg-purple-900/50 hover:bg-purple-900' : 'text-pink-600 bg-pink-100 hover:bg-pink-200'}`}>
                <FaEdit /> Edit Profile
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <motion.form key="edit-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
              <FormRow label="Display Name" description="Your full name or a nickname." isDarkMode={isDarkMode}>
                <input type="text" name="name" value={profileData.name} onChange={e => setProfileData({...profileData, displayName: e.target.value})} className={`w-full p-2 rounded-md border focus:ring-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 'bg-slate-100 border-slate-300 text-gray-900 focus:ring-pink-500'}`}/>
              </FormRow>
              <FormRow label="Bio" description="Tell us a little about yourself." isDarkMode={isDarkMode}>
                <textarea name="bio" rows="3" placeholder="Add a bio..." value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className={`w-full p-2 rounded-md border focus:ring-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' : 'bg-slate-100 border-slate-300 text-gray-900 focus:ring-pink-500'}`}/>
              </FormRow>
              <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button type="submit" disabled={profileStatus.loading} className={`px-5 py-2 rounded-md font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-70 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gradient-to-r from-pink-500 to-red-500 hover:opacity-90'}`}>
                    {profileStatus.loading ? <FaSpinner className="animate-spin" /> : 'Save Changes'}
                  </button>
                  <button type="button" onClick={handleCancelEdit} className={`font-semibold rounded-md px-3 py-2 transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'}`}>Cancel</button>
                </div>
                {profileStatus.success && <span className="text-green-500 flex items-center gap-2 text-sm"><FaCheckCircle/>{profileStatus.success}</span>}
                {profileStatus.error && <span className="text-red-500 flex items-center gap-2 text-sm"><FaExclamationCircle/>{profileStatus.error}</span>}
              </div>
            </motion.form>
          ) : (
            <motion.div key="display-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
                <Avatar user={userData} isDarkMode={isDarkMode} />
                <div className="text-center sm:text-left">
                  <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userData?.name || "No Name"}</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userData?.email}</p>
                </div>
              </div>
              <div className="mt-6">
                <h4 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Bio</h4>
                <p className={`mt-2 p-4 rounded-lg whitespace-pre-wrap ${isDarkMode ? 'text-gray-300 bg-gray-900/50' : 'text-gray-600 bg-slate-100'}`}>
                  {userData?.bio || <span className="text-gray-400 italic">No bio provided.</span>}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      ),
      security: ( <div>...</div> ),
      notifications: ( <div>...</div> ),
      appearance: ( <div>...</div> )
    };

    content.security = (
      <div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Security</h2>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account's security settings.</p>
        <div className="mt-6 space-y-4">
          <form onSubmit={handlePasswordSubmit}>
            <FormRow label="Change Password" isDarkMode={isDarkMode}>
              <div className="space-y-3">
                <input type="password" placeholder="Current Password" name="currentPassword" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-slate-100 text-gray-900'}`} required/>
                <input type="password" placeholder="New Password" name="newPassword" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-slate-100 text-gray-900'}`} required/>
                <div className="flex items-center justify-between">
                  <button type="submit" disabled={passwordStatus.loading} className={`px-5 py-2 rounded-md font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-70 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gradient-to-r from-pink-500 to-red-500 hover:opacity-90'}`}>
                    {passwordStatus.loading ? <FaSpinner className="animate-spin" /> : 'Update Password'}
                  </button>
                  {passwordStatus.success && <span className="text-green-500 text-sm">{passwordStatus.success}</span>}
                  {passwordStatus.error && <span className="text-red-500 text-sm">{passwordStatus.error}</span>}
                </div>
              </div>
            </FormRow>
          </form>
          <FormRow label="Danger Zone" description="This action is permanent and cannot be undone." isDarkMode={isDarkMode}>
            <button onClick={() => setDeleteModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors w-full md:w-auto">Delete My Account</button>
          </FormRow>
        </div>
      </div>
    );
    content.notifications = (
      <div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage how you receive notifications.</p>
        <div className="mt-6">
          <FormRow label="Email Notifications" description="Receive updates and newsletters via email." isDarkMode={isDarkMode}>
            <ToggleSwitch enabled={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} isDarkMode={isDarkMode} />
          </FormRow>
          <FormRow label="Push Notifications" description="Get notified directly on your device." isDarkMode={isDarkMode}>
            <ToggleSwitch enabled={notifications.push} onChange={() => setNotifications({...notifications, push: !notifications.push})} isDarkMode={isDarkMode} />
          </FormRow>
        </div>
      </div>
    );
    content.appearance = (
      <div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Appearance</h2>
        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customize the look and feel of the application.</p>
        <div className="mt-6">
          <FormRow label="Theme" isDarkMode={isDarkMode}>
            <div className={`flex space-x-2 rounded-lg p-1 ${isDarkMode ? 'bg-gray-700' : 'bg-slate-200'}`}>
              <button onClick={() => setIsDarkMode(false)} className={`w-full rounded-md py-2 text-sm font-semibold transition-colors ${!isDarkMode ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-md shadow-pink-500/20' : 'text-gray-200 hover:bg-gray-600'}`}>Light</button>
              <button onClick={() => setIsDarkMode(true)} className={`w-full rounded-md py-2 text-sm font-semibold transition-colors ${isDarkMode ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-gray-700 hover:bg-slate-300'}`}>Dark</button>
            </div>
          </FormRow>
        </div>
      </div>
    );
    return <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>{content[activeTab]}</motion.div></AnimatePresence>;
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> }, { id: 'security', label: 'Security', icon: <FaShieldAlt /> }, { id: 'notifications', label: 'Notifications', icon: <FaBell /> }, { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
  ];

  return (
    <>
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteAccount} isDeleting={deleteStatus.loading} isDarkMode={isDarkMode}/>
      <div className={`min-h-screen transition-colors duration-300 pt-12 max-sm:pt-20 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          <header className="mb-8 pt-16 md:pt-0">
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account and preferences.</p>
          </header>
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            <aside className="w-full md:w-1/4">
              <nav className="flex flex-row justify-around md:flex-col gap-2">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center justify-center md:justify-start gap-3 p-3 rounded-lg text-left transition-colors duration-200 w-full font-semibold 
                      ${activeTab === tab.id 
                        ? (isDarkMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/30') 
                        : (isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-slate-100')
                      }`}
                  >
                    {tab.icon}<span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
            <main className={`w-full md:w-3/4 p-6 sm:p-8 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-slate-200'}`}>
              {renderContent()}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;