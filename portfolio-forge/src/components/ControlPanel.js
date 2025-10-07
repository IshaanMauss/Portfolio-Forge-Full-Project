import React, { useState } from 'react';
import { auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { getEnhancedText } from '../api/enhanceAPI';
import { getEnhancedDescription } from '../api/mockEnhanceAPI';
import ToggleSwitch from './ToggleSwitch';

function ControlPanel({ portfolioData, updatePortfolio }) {
  const [newProject, setNewProject] = useState({ title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' });
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '' });
  const [newBlogPost, setNewBlogPost] = useState({ title: '', content: '' });
  const [newCustomSection, setNewCustomSection] = useState({ title: '', content: '' });
  
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

    // Step 1: Convert the image to a Data URL for the resume fix
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const dataUrl = reader.result;
        updatePortfolio('profilePicDataUrl', dataUrl); // Save the Data URL
    };
    reader.onerror = (error) => {
        console.error("Error converting file to Data URL", error);
        toast.error("Could not process the image file locally.");
    };

    // Step 2: Upload to Firebase Storage as usual for live display
    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      updatePortfolio('profilePicUrl', downloadURL); // Save the regular URL
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = (field, newItem, resetter) => {
    const itemName = field.slice(0, -1);
    if ((typeof newItem === 'string' && !newItem.trim()) || (typeof newItem === 'object' && !newItem.title && !newItem.name)) {
      toast.warn(`Please fill out the required fields for the new ${itemName}.`);
      return;
    }
    const currentItems = portfolioData[field]?.items || [];
    if (typeof newItem === 'string' && currentItems.map(item => item.toLowerCase()).includes(newItem.toLowerCase())) {
        toast.warn(`${newItem} is already in your list.`);
        return;
    }
    updatePortfolio(`${field}.items`, [newItem, ...currentItems]);

    if(itemName !== 'certification' && itemName !== 'blogPost' && itemName !== 'customSection' && itemName !== 'project') {
       toast.info(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} added!`);
    }
    if (resetter) {
      if (field === 'projects') resetter({ title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' });
      else if (field === 'certifications') resetter({ name: '', issuer: '' });
      else if (field === 'blogPosts') resetter({ title: '', content: '' });
      else if (field === 'customSections') resetter({ title: '', content: '' });
      else resetter('');
    }
    setSuggestions([]);
    setActiveSuggestionField(null);
  };

  const handleRemoveItem = (field, index) => {
    const currentItems = portfolioData[field]?.items || [];
    const newItems = currentItems.filter((_, i) => i !== index);
    updatePortfolio(`${field}.items`, newItems);
  };

  const handleAiEnhance = async (type) => {
    setAiLoading(prev => ({ ...prev, [type]: true }));
    try {
      let response;
      if (type === 'bio') {
        if (!portfolioData.bio) {
          toast.warn('Please write a few sentences in your bio before enhancing.');
          setAiLoading(prev => ({ ...prev, [type]: false })); return;
        }
        response = await getEnhancedText('bio', { bio: portfolioData.bio });
        if (response.enhancedText) updatePortfolio('bio', response.enhancedText);
      }

      if (type === 'project') {
        if (!newProject.title || !newProject.keywords) {
          toast.warn('Project Title & Keywords are required for AI enhancement.');
          setAiLoading(prev => ({ ...prev, [type]: false })); return;
        }
        response = await getEnhancedText('project', { title: newProject.title, keywords: newProject.keywords });
        if (response.enhancedText) setNewProject(prev => ({ ...prev, description: response.enhancedText }));
      }

      if (response && response.error) toast.error(`AI enhancement failed: ${response.error}`);

    } catch (error) {
      console.error("AI enhancement failed:", error);
      toast.error("AI enhancement failed to connect to the server.");
    } finally {
      setAiLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const fetchSuggestions = async (type, partial) => {
    if (partial && partial.length > 1) {
      const apiType = (type === 'hardSkills' || type === 'softSkills') ? 'skills' : type;
      const response = await getEnhancedDescription(apiType, { partial });
      if (response.suggestions) setSuggestions(response.suggestions);
      else setSuggestions([]);
    } else {
      setSuggestions([]);
    }
  };

  const handleInputChange = (setter, fieldType) => (e) => {
    setter(e.target.value);
    if (fieldType) {
      fetchSuggestions(fieldType, e.target.value);
      setActiveSuggestionField(fieldType);
    }
  };

  const handleSuggestionClick = (field, resetter, suggestion) => {
    handleAddItem(field, suggestion, resetter);
  };

  return (
    <aside className="controls-panel">
      <details className="controls-section" open>
        <summary><h3>Profile & Contact</h3></summary>
        <label>Profile Picture</label>
        <div className="profile-pic-area">
          {portfolioData.profilePicUrl && <img src={portfolioData.profilePicUrl} alt="Profile Preview" className="profile-pic-preview" />}
          <input type="file" accept="image/*" onChange={handleProfilePicUpload} disabled={isUploading} />
          {isUploading && <p>Uploading...</p>}
        </div>
        <label>Full Name</label>
        <input type="text" value={portfolioData.userName || ''} onChange={e => updatePortfolio('userName', e.target.value)} />
        <label>Subtitle / Tagline</label>
        <input type="text" value={portfolioData.userSubtitle || ''} onChange={e => updatePortfolio('userSubtitle', e.target.value)} />
        <label>Bio / About Me</label>
        <div className="ai-input-group">
          <textarea rows="4" value={portfolioData.bio || ''} onChange={e => updatePortfolio('bio', e.target.value)}></textarea>
          <button onClick={() => handleAiEnhance('bio')} className="ai-button" disabled={aiLoading.bio}>✨</button>
        </div>
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
            <input type="text" placeholder="Add a skill..." value={newHardSkill} onChange={handleInputChange(setNewHardSkill, 'hardSkills')} onKeyDown={e => e.key === 'Enter' && handleAddItem('hardSkills', newHardSkill.trim(), setNewHardSkill)} onFocus={() => setActiveSuggestionField('hardSkills')} onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggestionField(null); }, 150)} />
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
            <input type="text" placeholder="Add a skill..." value={newSoftSkill} onChange={handleInputChange(setNewSoftSkill, 'softSkills')} onKeyDown={e => e.key === 'Enter' && handleAddItem('softSkills', newSoftSkill.trim(), setNewSoftSkill)} onFocus={() => setActiveSuggestionField('softSkills')} onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggestionField(null); }, 150)} />
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
            <input type="text" placeholder="Add an interest..." value={newInterest} onChange={handleInputChange(setNewInterest, 'interests')} onKeyDown={e => e.key === 'Enter' && handleAddItem('interests', newInterest.trim(), setNewInterest)} onFocus={() => setActiveSuggestionField('interests')} onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggestionField(null); }, 150)} />
          </div>
          {activeSuggestionField === 'interests' && suggestions.length > 0 && (<ul className="suggestions-list">{suggestions.map(i => <li key={i} onMouseDown={() => handleSuggestionClick('interests', setNewInterest, i)}>{i}</li>)}</ul>)}
        </div>
      </details>

       <details className="controls-section">
        <summary><h3>Projects</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.projects?.showOnPage !== false} onChange={() => updatePortfolio('projects.showOnPage', !portfolioData.projects?.showOnPage)} />
        <input type="text" placeholder="Project Title" value={newProject.title} onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))} />
        <input type="text" placeholder="Keywords (for AI)" value={newProject.keywords} onChange={e => setNewProject(prev => ({ ...prev, keywords: e.target.value }))} />
        <div className="ai-input-group">
          <textarea placeholder="Project description..." rows="4" value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}></textarea>
          <button onClick={() => handleAiEnhance('project')} className="ai-button" disabled={aiLoading.project}>✨</button>
        </div>
        <input type="url" placeholder="Project GitHub URL" value={newProject.githubUrl} onChange={e => setNewProject(prev => ({ ...prev, githubUrl: e.target.value }))} />
        <input type="url" placeholder="Project Live Demo URL" value={newProject.liveUrl} onChange={e => setNewProject(prev => ({ ...prev, liveUrl: e.target.value }))} />
        <button className="add-btn" onClick={() => handleAddItem('projects', newProject, setNewProject)}>Add Project</button>
        <div className="item-list">
          {(portfolioData.projects?.items || []).map((proj, index) => (<div key={index} className="list-item"><span>{proj.title}</span><button onClick={() => handleRemoveItem('projects', index)} className="remove-btn">X</button></div>))}
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
      
       <details className="controls-section">
        <summary><h3>Certifications</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.certifications?.showOnPage !== false} onChange={() => updatePortfolio('certifications.showOnPage', !portfolioData.certifications?.showOnPage)} />
        <input type="text" placeholder="Certification Name" value={newCertification.name} onChange={e => setNewCertification({ ...newCertification, name: e.target.value })} />
        <input type="text" placeholder="Issuing Organization" value={newCertification.issuer} onChange={e => setNewCertification({ ...newCertification, issuer: e.target.value })} />
        <button className="add-btn" onClick={() => handleAddItem('certifications', newCertification, setNewCertification)}>Add Certification</button>
        <div className="item-list">
          {(portfolioData.certifications?.items || []).map((cert, index) => (<div key={index} className="list-item"><span>{cert.name}</span><button className="remove-btn" onClick={() => handleRemoveItem('certifications', index)}>X</button></div>))}
        </div>
      </details>

      <details className="controls-section">
        <summary><h3>Blog Posts</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.blogPosts?.showOnPage || false} onChange={() => updatePortfolio('blogPosts.showOnPage', !portfolioData.blogPosts?.showOnPage)} />
        <input type="text" placeholder="New Post Title" value={newBlogPost.title} onChange={e => setNewBlogPost({ ...newBlogPost, title: e.target.value })} />
        <textarea placeholder="Write your blog post content here..." rows="6" value={newBlogPost.content} onChange={e => setNewBlogPost({ ...newBlogPost, content: e.target.value })}></textarea>
        <button className="add-btn" onClick={() => handleAddItem('blogPosts', newBlogPost, setNewBlogPost)}>Add Blog Post</button>
        <div className="item-list">
          {(portfolioData.blogPosts?.items || []).map((post, index) => (<div key={index} className="list-item"><span>{post.title}</span><button onClick={() => handleRemoveItem('blogPosts', index)} className="remove-btn">X</button></div>))}
        </div>
      </details>

      <details className="controls-section">
        <summary><h3>Custom Section</h3></summary>
        <label>Section Title</label>
        <input type="text" value={portfolioData.customSections?.title ?? 'Custom Section'} onChange={e => updatePortfolio('customSections.title', e.target.value)} />
        <ToggleSwitch label="Show on page" checked={portfolioData.customSections?.showOnPage || false} onChange={() => updatePortfolio('customSections.showOnPage', !portfolioData.customSections?.showOnPage)} />
        <hr style={{ margin: '1rem 0' }} />
        <label>Add New Item</label>
        <input type="text" placeholder="Item Title" value={newCustomSection.title} onChange={e => setNewCustomSection({ ...newCustomSection, title: e.target.value })} />
        <textarea placeholder="Item Content..." rows="5" value={newCustomSection.content} onChange={e => setNewCustomSection({ ...newCustomSection, content: e.target.value })}></textarea>
        <button className="add-btn" onClick={() => handleAddItem('customSections', newCustomSection, setNewCustomSection)}>Add Item</button>
        <div className="item-list">
          {(portfolioData.customSections?.items || []).map((section, index) => (<div key={index} className="list-item"><span>{section.title}</span><button onClick={() => handleRemoveItem('customSections', index)} className="remove-btn">X</button></div>))}
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