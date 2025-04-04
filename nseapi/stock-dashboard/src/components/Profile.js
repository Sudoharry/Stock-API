import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles.css';

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    profilePicture: null
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.get('http://localhost:8000/api/auth/profile/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const userData = response.data;
        const newProfileData = {
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          bio: userData.bio || '',
          profilePicture: null
        };
        setProfileData(newProfileData);
        setOriginalData(newProfileData);
        if (userData.profile_picture) {
          setPreviewImage(`http://localhost:8000${userData.profile_picture}`);
        }
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setProfileData(prev => ({
          ...prev,
          profilePicture: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('first_name', profileData.firstName);
      formData.append('last_name', profileData.lastName);
      formData.append('phone', profileData.phone);
      formData.append('address', profileData.address);
      formData.append('bio', profileData.bio);
      
      if (profileData.profilePicture instanceof File) {
        formData.append('profile_picture', profileData.profilePicture);
      }

      const response = await axios.put('http://localhost:8000/api/auth/profile/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update originalData with current profileData
      setOriginalData({...profileData});
      setSuccessMessage('Profile updated successfully!');
      
      // Explicitly set isEditing to false to show the Edit button
      setIsEditing(false);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // When canceling edit mode
      setProfileData({...originalData});
      setIsEditing(false);
    } else {
      // When entering edit mode
      setIsEditing(true);
    }
    setError(null);
    setSuccessMessage('');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading && !profileData.firstName) {
    return (
      <div className="loading-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card profile-container">
        <div className="profile-header">
          <div className="profile-picture-container">
            <div className="profile-picture">
              {previewImage ? (
                <img src={previewImage} alt="Profile" />
              ) : (
                <div className="profile-picture-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
              {isEditing && (
                <button 
                  className="change-picture-btn"
                  onClick={() => fileInputRef.current.click()}
                  type="button"
                >
                  <i className="fas fa-camera"></i>
                  Change Picture
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="profile-title">
            <h2>{user?.username}'s Profile</h2>
            <p className="profile-subtitle">Manage your personal information</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profileData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profileData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                placeholder="Enter your email"
                readOnly
                className="readonly-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              placeholder="Enter your address"
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows="4"
              disabled={!isEditing}
            />
          </div>

          <div className="profile-actions">
            <button 
              type="submit" 
              className="profile-btn update-btn"
              disabled={!isEditing || loading}
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>Update Profile</span>
                </>
              )}
            </button>

            <button 
              type="button" 
              className="profile-btn edit-btn"
              onClick={toggleEdit}
              disabled={loading || isEditing}
            >
              <i className="fas fa-edit"></i>
              <span>Edit Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 