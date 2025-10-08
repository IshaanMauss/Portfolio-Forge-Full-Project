import React, { useState } from 'react';
import { auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { getEnhancedText } from '../api/enhanceAPI';
import { getEnhancedDescription } from '../api/mockEnhanceAPI';
import ToggleSwitch from './ToggleSwitch';

function ControlPanel({ portfolioData, updatePortfolio }) {
  // States for new items
  const [newProject, setNewProject] = useState({ title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' });
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '' });
  const [newBlogPost, setNewBlogPost] = useState({ title: '', content: '' });
  const [newCustomItem, setNewCustomItem] = useState({ title: '', content: '' });

  // States for UI logic
  const [editingIndex, setEditingIndex] = useState({ field: null, index: null });
  const [isUploading, setIsUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState(null);

  if (!portfolioData) {
    return <aside className="controls-panel">Loading controls...</aside>;
  }

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => { updatePortfolio('profilePicDataUrl', reader.result); };
    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      updatePortfolio('profilePicUrl', downloadURL);
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditItem = (field, index) => {
    const itemToEdit = portfolioData[field].items[index];
    const sectionElement = document.getElementById(`${field}-section`);
    setEditingIndex({ field, index });
    if (field === 'projects') setNewProject(itemToEdit);
    else if (field === 'certifications') setNewCertification(itemToEdit);
    else if (field === 'blogPosts') setNewBlogPost(itemToEdit);
    else if (field === 'customSections') setNewCustomItem(itemToEdit);
    if (sectionElement) {
      sectionElement.open = true;
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingIndex({ field: null, index: null });
    setNewProject({ title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' });
    setNewCertification({ name: '', issuer: '' });
    setNewBlogPost({ title: '', content: '' });
    setNewCustomItem({ title: '', content: '' });
  };

  const handleSubmitItem = (field, newItem, resetter) => {
    const itemName = field.slice(0, -1);
    if ((typeof newItem === 'object' && !newItem.title && !newItem.name) && (typeof newItem !== 'string')) {
        toast.warn(`Please fill out the required fields for the new ${itemName}.`);
        return;
    }
    
    const updater = (prevSection) => {
      const newSection = { ...(prevSection || { items: [], showOnPage: false }) };
      const wasEmpty = (newSection.items || []).length === 0;

      if (editingIndex.field === field && editingIndex.index !== null) {
        newSection.items = (newSection.items || []).map((item, index) => 
          index === editingIndex.index ? newItem : item
        );
        toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} updated!`);
      } else {
        newSection.items = [newItem, ...(newSection.items || [])];
        toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} added!`);
        if (wasEmpty) {
          newSection.showOnPage = true;
        }
      }
      return newSection;
    };

    updatePortfolio(field, updater);

    resetter(field === 'projects' ? { title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' }
           : field === 'certifications' ? { name: '', issuer: '' }
           : field === 'blogPosts' ? { title: '', content: '' }
           : field === 'customSections' ? { title: '', content: '' }
           : '');
    cancelEdit();
  };

  const handleAddTag = (field, newItem, resetter) => {
    if (!newItem.trim()) return;
    
    const updater = (prevSection) => {
        const newSection = { ...(prevSection || { items: [], showOnPage: false }) };
        const wasEmpty = (newSection.items || []).length === 0;
        
        const lowercasedItems = (newSection.items || []).map(item => item.toLowerCase());
        if (lowercasedItems.includes(newItem.toLowerCase())) {
            toast.warn(`${newItem} is already in your list.`);
            return prevSection;
        }

        newSection.items = [newItem, ...(newSection.items || [])];
        if (wasEmpty) {
            newSection.showOnPage = true;
        }
        toast.info(`${field.slice(0, -1)} added!`);
        return newSection;
    };

    updatePortfolio(field, updater);

    resetter('');
    setSuggestions([]);
    setActiveSuggestionField(null);
  };
  
  const handleRemoveItem = (field, index) => {
    const updater = (prevItems) => (prevItems || []).filter((_, i) => i !== index);
    updatePortfolio(`${field}.items`, updater);
  };
  
  const handleAiEnhance = async (type) => {
    let payload = {};
    if (type === 'bio') {
        if (!portfolioData.bio) return toast.warn("Please write a little bit in your bio first.");
        payload = { bio: portfolioData.bio };
    } else if (type === 'project') {
        if (!newProject.title) return toast.warn("Please add a project title first.");
        payload = { title: newProject.title, keywords: newProject.keywords };
    }
    setAiLoading(prev => ({ ...prev, [type]: true }));
    const result = await getEnhancedText(type, payload);
    if (result && !result.error) {
        if (type === 'bio') updatePortfolio('bio', result.enhancedText);
        else if (type === 'project') setNewProject(p => ({ ...p, description: result.enhancedText }));
        toast.success("AI enhancement complete!");
    } else {
        toast.error(result.error || "AI enhancement failed.");
    }
    setAiLoading(prev => ({ ...prev, [type]: false }));
  };

  // --- FIX START: Changed how the API is called ---
  const fetchSuggestions = async (type, partial) => {
    if (!partial || partial.length < 2) { setSuggestions([]); return; }
    // No longer combining hard and soft skills into a generic 'skills' type
    const response = await getEnhancedDescription(type, { partial });
    if (response && response.suggestions) {
        setSuggestions(response.suggestions.slice(0, 5));
    }
  };
  // --- FIX END ---

  const handleInputChange = (setter, fieldType) => (e) => { 
    setter(e.target.value); 
    if (fieldType) { fetchSuggestions(fieldType, e.target.value); setActiveSuggestionField(fieldType); } 
  };
  
  const handleSuggestionClick = (field, resetter, suggestion) => { 
    handleAddTag(field, suggestion, resetter); 
  };

  return (
    <aside className="controls-panel">
      <details className="controls-section" open>
        <summary><h3>Profile & Contact</h3></summary>
        <label>Profile Picture</label>
        <div className="profile-pic-area">
          {portfolioData.profilePicUrl && <img src={portfolioData.profilePicUrl} alt="Profile Preview" className="profile-pic-preview" />}
          <input type="file" id="file-upload" accept="image/*" onChange={handleProfilePicUpload} disabled={isUploading} />
          <label htmlFor="file-upload" className="custom-file-upload">Choose File</label>
          {isUploading && <p>Uploading...</p>}
        </div>
        <label>Full Name</label>
        <input type="text" value={portfolioData.userName || ''} onChange={e => updatePortfolio('userName', e.target.value)} />
        <label>Subtitle / Tagline</label>
        <input type="text" value={portfolioData.userSubtitle || ''} onChange={e => updatePortfolio('userSubtitle', e.target.value)} />
        <label>Bio / About Me</label>
        <div className="ai-input-group">
          <textarea rows="4" value={portfolioData.bio || ''} onChange={e => updatePortfolio('bio', e.target.value)}></textarea>
          <button onClick={() => handleAiEnhance('bio')} className="ai-button" disabled={aiLoading.bio} title="Enhance with AI">✨</button>
        </div>
        <small className="ai-prompt">Pro-tip: Write a few sentences, then click the ✨ icon to let AI polish your bio.</small>
        <label>Location (City, Country)</label>
        <div className="visibility-group">
          <input type="text" value={portfolioData.location?.value || ''} onChange={e => updatePortfolio('location.value', e.target.value)} />
          <ToggleSwitch label="Show" checked={portfolioData.location?.showOnPage !== false} onChange={() => updatePortfolio('location.showOnPage', !portfolioData.location?.showOnPage)} />
        </div>
        <label>Address</label>
        <div className="visibility-group">
          <input type="text" value={portfolioData.address?.value || ''} onChange={e => updatePortfolio('address.value', e.target.value)} />
          <ToggleSwitch label="Show" checked={portfolioData.address?.showOnPage || false} onChange={() => updatePortfolio('address.showOnPage', !portfolioData.address?.showOnPage)} />
        </div>
        <label>Email</label>
        <input type="email" value={portfolioData.links?.email || ''} onChange={e => updatePortfolio('links.email', e.target.value)} />
        <label>LinkedIn URL</label>
        <input type="url" value={portfolioData.links?.linkedin || ''} onChange={e => updatePortfolio('links.linkedin', e.target.value)} />
        <label>GitHub URL</label>
        <input type="url" value={portfolioData.links?.github || ''} onChange={e => updatePortfolio('links.github', e.target.value)} />
      </details>
      <details className="controls-section">
        <summary><h3>Hard Skills</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.hardSkills?.showOnPage !== false} onChange={() => updatePortfolio('hardSkills.showOnPage', !portfolioData.hardSkills?.showOnPage)} />
        <div className="suggestions-container">
          <div className="tag-input-container">
            {(portfolioData.hardSkills?.items || []).map((skill, index) => (<div key={index} className="tag">{skill}<button onClick={() => handleRemoveItem('hardSkills', index)}>x</button></div>))}
            <input type="text" placeholder="Add a skill..." value={newHardSkill} onChange={handleInputChange(setNewHardSkill, 'hardSkills')} onKeyDown={e => e.key === 'Enter' && handleAddTag('hardSkills', newHardSkill.trim(), setNewHardSkill)} onFocus={() => setActiveSuggestionField('hardSkills')} onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggestionField(null); }, 150)} />
          </div>
          {activeSuggestionField === 'hardSkills' && suggestions.length > 0 && (<ul className="suggestions-list">{suggestions.map(s => <li key={s} onMouseDown={() => handleSuggestionClick('hardSkills', setNewHardSkill, s)}>{s}</li>)}</ul>)}
        </div>
      </details>
      <details className="controls-section">
        <summary><h3>Soft Skills</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.softSkills?.showOnPage !== false} onChange={() => updatePortfolio('softSkills.showOnPage', !portfolioData.softSkills?.showOnPage)} />
        <div className="suggestions-container">
          <div className="tag-input-container">
            {(portfolioData.softSkills?.items || []).map((skill, index) => (<div key={index} className="tag">{skill}<button onClick={() => handleRemoveItem('softSkills', index)}>x</button></div>))}
            <input type="text" placeholder="Add a skill..." value={newSoftSkill} onChange={handleInputChange(setNewSoftSkill, 'softSkills')} onKeyDown={e => e.key === 'Enter' && handleAddTag('softSkills', newSoftSkill.trim(), setNewSoftSkill)} onFocus={() => setActiveSuggestionField('softSkills')} onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggestionField(null); }, 150)} />
          </div>
          {activeSuggestionField === 'softSkills' && suggestions.length > 0 && (<ul className="suggestions-list">{suggestions.map(s => <li key={s} onMouseDown={() => handleSuggestionClick('softSkills', setNewSoftSkill, s)}>{s}</li>)}</ul>)}
        </div>
      </details>
      <details className="controls-section">
        <summary><h3>Interests & Hobbies</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.interests?.showOnPage !== false} onChange={() => updatePortfolio('interests.showOnPage', !portfolioData.interests?.showOnPage)} />
        <div className="suggestions-container">
          <div className="tag-input-container">
            {(portfolioData.interests?.items || []).map((interest, index) => (<div key={index} className="tag">{interest}<button onClick={() => handleRemoveItem('interests', index)}>x</button></div>))}
            <input type="text" placeholder="Add an interest..." value={newInterest} onChange={handleInputChange(setNewInterest, 'interests')} onKeyDown={e => e.key === 'Enter' && handleAddTag('interests', newInterest.trim(), setNewInterest)} onFocus={() => setActiveSuggestionField('interests')} onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggestionField(null); }, 150)} />
          </div>
          {activeSuggestionField === 'interests' && suggestions.length > 0 && (<ul className="suggestions-list">{suggestions.map(i => <li key={i} onMouseDown={() => handleSuggestionClick('interests', setNewInterest, i)}>{i}</li>)}</ul>)}
        </div>
      </details>
      <details id="projects-section" className="controls-section">
        <summary><h3>Projects</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.projects?.showOnPage !== false} onChange={() => updatePortfolio('projects.showOnPage', !portfolioData.projects?.showOnPage)} />
        <h4>{editingIndex.field === 'projects' ? 'Edit Project' : 'Add New Project'}</h4>
        <input type="text" placeholder="Project Title" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} />
        <input type="text" placeholder="Keywords (e.g., React, Firebase)" value={newProject.keywords} onChange={e => setNewProject(p => ({ ...p, keywords: e.target.value }))} />
        <small className="ai-prompt">Add keywords to get a better AI-generated description.</small>
        <div className="ai-input-group">
          <textarea placeholder="Project description..." rows="4" value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}></textarea>
          <button onClick={() => handleAiEnhance('project')} className="ai-button" disabled={aiLoading.project} title="Enhance with AI">✨</button>
        </div>
        <input type="url" placeholder="Project GitHub URL" value={newProject.githubUrl} onChange={e => setNewProject(p => ({ ...p, githubUrl: e.target.value }))} />
        <input type="url" placeholder="Project Live Demo URL" value={newProject.liveUrl} onChange={e => setNewProject(p => ({ ...p, liveUrl: e.target.value }))} />
        <div className="form-actions">
            {editingIndex.field === 'projects' && <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>}
            <button className="add-btn" onClick={() => handleSubmitItem('projects', newProject, setNewProject)}>
                {editingIndex.field === 'projects' ? 'Save Changes' : 'Add Project'}
            </button>
        </div>
        <div className="item-list">
          {(portfolioData.projects?.items || []).map((proj, index) => (
            <div key={index} className="list-item">
              <span>{proj.title}</span>
              <div className="item-actions">
                <button onClick={() => handleEditItem('projects', index)} className="edit-btn">Edit</button>
                <button onClick={() => handleRemoveItem('projects', index)} className="remove-btn">X</button>
              </div>
            </div>
          ))}
        </div>
      </details>
      <details className="controls-section">
        <summary><h3>Education</h3></summary>
        <h4>College / University</h4>
        <input type="text" placeholder="College Name" value={portfolioData.education?.college?.name || ''} onChange={e => updatePortfolio('education.college.name', e.target.value)} />
        <input type="text" placeholder="Course" value={portfolioData.education?.college?.course || ''} onChange={e => updatePortfolio('education.college.course', e.target.value)} />
        <input type="text" placeholder="Graduation Year" value={portfolioData.education?.college?.gradYear || ''} onChange={e => updatePortfolio('education.college.gradYear', e.target.value)} />
        <ToggleSwitch label="Show" checked={portfolioData.education?.college?.showOnPage !== false} onChange={() => updatePortfolio('education.college.showOnPage', !portfolioData.education?.college?.showOnPage)} />
        <h4 style={{ marginTop: '1rem' }}>Class XII</h4>
        <input type="text" placeholder="School Name" value={portfolioData.education?.class12?.school || ''} onChange={e => updatePortfolio('education.class12.school', e.target.value)} />
        <input type="text" placeholder="Board (e.g., CBSE, ISC)" value={portfolioData.education?.class12?.board || ''} onChange={e => updatePortfolio('education.class12.board', e.target.value)} />
        <input type="text" placeholder="Percentage" value={portfolioData.education?.class12?.percentage || ''} onChange={e => updatePortfolio('education.class12.percentage', e.target.value)} />
        <input type="text" placeholder="Passing Year" value={portfolioData.education?.class12?.passingYear || ''} onChange={e => updatePortfolio('education.class12.passingYear', e.target.value)} />
        <ToggleSwitch label="Show" checked={portfolioData.education?.class12?.showOnPage || false} onChange={() => updatePortfolio('education.class12.showOnPage', !portfolioData.education?.class12?.showOnPage)} />
        <h4 style={{ marginTop: '1rem' }}>Class X</h4>
        <input type="text" placeholder="School Name" value={portfolioData.education?.class10?.school || ''} onChange={e => updatePortfolio('education.class10.school', e.target.value)} />
        <input type="text" placeholder="Board (e.g., CBSE, ICSE)" value={portfolioData.education?.class10?.board || ''} onChange={e => updatePortfolio('education.class10.board', e.target.value)} />
        <input type="text" placeholder="Percentage" value={portfolioData.education?.class10?.percentage || ''} onChange={e => updatePortfolio('education.class10.percentage', e.target.value)} />
        <input type="text" placeholder="Passing Year" value={portfolioData.education?.class10?.passingYear || ''} onChange={e => updatePortfolio('education.class10.passingYear', e.target.value)} />
        <ToggleSwitch label="Show" checked={portfolioData.education?.class10?.showOnPage || false} onChange={() => updatePortfolio('education.class10.showOnPage', !portfolioData.education?.class10?.showOnPage)} />
      </details>
      <details id="certifications-section" className="controls-section">
        <summary><h3>Certifications</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.certifications?.showOnPage !== false} onChange={() => updatePortfolio('certifications.showOnPage', !portfolioData.certifications?.showOnPage)} />
        <h4>{editingIndex.field === 'certifications' ? 'Edit Certification' : 'Add New Certification'}</h4>
        <input type="text" placeholder="Certification Name" value={newCertification.name} onChange={e => setNewCertification({ ...newCertification, name: e.target.value })} />
        <input type="text" placeholder="Issuing Organization" value={newCertification.issuer} onChange={e => setNewCertification({ ...newCertification, issuer: e.target.value })} />
        <div className="form-actions">
          {editingIndex.field === 'certifications' && <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>}
          <button className="add-btn" onClick={() => handleSubmitItem('certifications', newCertification, setNewCertification)}>
            {editingIndex.field === 'certifications' ? 'Save Changes' : 'Add Certification'}
          </button>
        </div>
        <div className="item-list">
          {(portfolioData.certifications?.items || []).map((cert, index) => (<div key={index} className="list-item"><span>{cert.name}</span><div className="item-actions"><button onClick={() => handleEditItem('certifications', index)} className="edit-btn">Edit</button><button className="remove-btn" onClick={() => handleRemoveItem('certifications', index)}>X</button></div></div>))}
        </div>
      </details>
      <details id="blogPosts-section" className="controls-section">
        <summary><h3>Blog Posts</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.blogPosts?.showOnPage || false} onChange={() => updatePortfolio('blogPosts.showOnPage', !portfolioData.blogPosts?.showOnPage)} />
        <hr style={{ margin: '1rem 0' }} />
        <h4>{editingIndex.field === 'blogPosts' ? 'Edit Blog Post' : 'Add New Post'}</h4>
        <input type="text" placeholder="New Post Title" value={newBlogPost.title} onChange={e => setNewBlogPost(p => ({ ...p, title: e.target.value }))} />
        <textarea placeholder="Write your blog post content here..." rows="6" value={newBlogPost.content} onChange={e => setNewBlogPost(p => ({ ...p, content: e.target.value }))}></textarea>
        <div className="form-actions">
          {editingIndex.field === 'blogPosts' && <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>}
          <button className="add-btn" onClick={() => handleSubmitItem('blogPosts', newBlogPost, setNewBlogPost)}>
            {editingIndex.field === 'blogPosts' ? 'Save Changes' : 'Add Blog Post'}
          </button>
        </div>
        <div className="item-list">
            {(portfolioData.blogPosts?.items || []).map((post, index) => (
            <div key={index} className="list-item">
                <span>{post.title}</span>
                <div className="item-actions">
                    <button onClick={() => handleEditItem('blogPosts', index)} className="edit-btn">Edit</button>
                    <button onClick={() => handleRemoveItem('blogPosts', index)} className="remove-btn">X</button>
                </div>
            </div>
            ))}
        </div>
      </details>
      <details id="customSections-section" className="controls-section">
        <summary><h3>Custom Section</h3></summary>
        <label>Section Title</label>
        <input type="text" placeholder="Custom Section Title" value={portfolioData.customSections?.title || ''} onChange={e => updatePortfolio('customSections.title', e.target.value)} />
        <ToggleSwitch
            label="Show on page"
            checked={portfolioData.customSections?.showOnPage || false}
            onChange={() => {
                const updater = (prevSection) => ({
                    ...(prevSection || { title: 'Custom Section', items: [] }),
                    showOnPage: !prevSection?.showOnPage
                });
                updatePortfolio('customSections', updater);
            }}
        />
        <hr style={{ margin: '1rem 0' }} />
        <h4>{editingIndex.field === 'customSections' ? 'Edit Item' : 'Add New Item'}</h4>
        <input type="text" placeholder="Item Title" value={newCustomItem.title} onChange={e => setNewCustomItem(p => ({ ...p, title: e.target.value }))} />
        <textarea placeholder="Item Content..." rows="5" value={newCustomItem.content} onChange={e => setNewCustomItem(p => ({ ...p, content: e.target.value }))}></textarea>
        <div className="form-actions">
          {editingIndex.field === 'customSections' && <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>}
          <button className="add-btn" onClick={() => handleSubmitItem('customSections', newCustomItem, setNewCustomItem)}>
            {editingIndex.field === 'customSections' ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
        <div className="item-list">
          {(portfolioData.customSections?.items || []).map((item, index) => (
            <div key={index} className="list-item">
              <span>{item.title}</span>
              <div className="item-actions">
                <button onClick={() => handleEditItem('customSections', index)} className="edit-btn">Edit</button>
                <button onClick={() => handleRemoveItem('customSections', index)} className="remove-btn">X</button>
              </div>
            </div>
          ))}
        </div>
      </details>
      <details className="controls-section">
        <summary><h3>Theme & Design</h3></summary>
        <label>Layout Template</label>
        <select value={portfolioData.theme?.layout || 'standard'} onChange={e => updatePortfolio('theme.layout', e.target.value)}>
          <option value="standard">Standard (Two-Column)</option>
          <option value="compact">Compact (Single-Column)</option>
        </select>
        <label>Background Color</label>
        <input type="color" value={portfolioData.theme?.backgroundColor || '#0a192f'} onChange={e => updatePortfolio('theme.backgroundColor', e.target.value)} />
        <label>Text Color</label>
        <input type="color" value={portfolioData.theme?.textColor || '#ccd6f6'} onChange={e => updatePortfolio('theme.textColor', e.target.value)} />
        <label>Accent Color</label>
        <input type="color" value={portfolioData.theme?.accentColor || '#64ffda'} onChange={e => updatePortfolio('theme.accentColor', e.target.value)} />
      </details>
    </aside>
  );
}

export default ControlPanel;