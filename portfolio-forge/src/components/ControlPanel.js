import React, { useState, Suspense, lazy } from 'react';
import { PORTFOLIO_FONTS } from '../utils/fonts';
import { auth, storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { getEnhancedText } from '../api/enhanceAPI';
import { getEnhancedDescription } from '../api/suggestions';
import ToggleSwitch from './ToggleSwitch';
import ImportPanel from './ImportPanel';
import FeedbackAdmin from './FeedbackAdmin';
import { FEATURES } from '../utils/features';
import { PORTFOLIO_PALETTES } from '../utils/palettes';

const ResumeLayoutControls = lazy(() => import('./ResumeLayoutControls'));
const ResumePdfPreview = lazy(() => import('./ResumePdfPreview'));

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function ControlPanel({ portfolioData, updatePortfolio }) {
  const [newProject, setNewProject] = useState({ title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' });
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '' });
  const [newBlogPost, setNewBlogPost] = useState({ title: '', content: '' });
  const [newCustomSection, setNewCustomSection] = useState({ title: '', content: '' });
  
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [editing, setEditing] = useState({ field: null, index: null });
  const [isUploading, setIsUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState(null);

  if (!portfolioData) {
    return <aside className="controls-panel">Loading controls...</aside>;
  }
  
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !auth.currentUser) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please choose a PNG, JPEG or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image is too large. Maximum size is 2 MB.');
      return;
    }
    setIsUploading(true);
    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}/avatar`);
    try {
      // One fixed file per user, replaced on each upload, so old pictures never pile up in storage.
      // Shrink on the device first (max 800 px / ~200 KB): faster upload, less storage, less egress.
      let body = file;
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        body = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true });
      } catch (err) { body = file; }
      await uploadBytes(storageRef, body, { contentType: body.type || file.type, cacheControl: 'public,max-age=3600' });
      const downloadURL = `${await getDownloadURL(storageRef)}&v=${Date.now()}`;
      updatePortfolio('profilePicUrl', downloadURL);
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
    if (editing.field === field && editing.index !== null) {
      updatePortfolio(`${field}.items`, currentItems.map((it, i) => (i === editing.index ? newItem : it)));
      setEditing({ field: null, index: null });
      toast.success(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} updated!`);
    } else {
      updatePortfolio(`${field}.items`, [newItem, ...currentItems]);
    }

    if(editing.index === null && itemName !== 'certification' && itemName !== 'blogPost' && itemName !== 'customSection' && itemName !== 'project') {
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

  const BLANK_FORMS = {
    projects: [setNewProject, { title: '', keywords: '', description: '', githubUrl: '', liveUrl: '' }],
    certifications: [setNewCertification, { name: '', issuer: '' }],
    blogPosts: [setNewBlogPost, { title: '', content: '' }],
    customSections: [setNewCustomSection, { title: '', content: '' }],
  };

  const handleEditItem = (field, index) => {
    const item = portfolioData[field]?.items?.[index];
    if (!item || !BLANK_FORMS[field]) return;
    BLANK_FORMS[field][0]({ ...BLANK_FORMS[field][1], ...item });
    setEditing({ field, index });
    const el = document.getElementById(`${field}-section`);
    if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth' }); }
  };

  const cancelEdit = () => {
    Object.values(BLANK_FORMS).forEach(([setter, blank]) => setter(blank));
    setEditing({ field: null, index: null });
  };

  const handleRemoveItem = (field, index) => {
    if (editing.field === field) cancelEdit();
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
      const response = await getEnhancedDescription(type, { partial });
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
      <ImportPanel portfolioData={portfolioData} updatePortfolio={updatePortfolio} />
      <details className="controls-section" open>
        <summary><h3>Profile & Contact</h3></summary>
        <label>Profile Picture</label>
        <div className="profile-pic-area">
          {portfolioData.profilePicUrl && <img src={portfolioData.profilePicUrl} alt="Profile Preview" className="profile-pic-preview" referrerPolicy="no-referrer" />}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProfilePicUpload} disabled={isUploading} />
          {isUploading && <p>Uploading...</p>}
        </div>
        <label>Full Name</label>
        <input type="text" value={portfolioData.userName || ''} onChange={e => updatePortfolio('userName', e.target.value)} />
        <label>Subtitle / Tagline</label>
        <input type="text" value={portfolioData.userSubtitle || ''} onChange={e => updatePortfolio('userSubtitle', e.target.value)} />
        <label>Bio / About Me</label>
        <div className="ai-input-group">
          <textarea rows="4" value={portfolioData.bio || ''} onChange={e => updatePortfolio('bio', e.target.value)}></textarea>
          {FEATURES.ai && <button onClick={() => handleAiEnhance('bio')} className="ai-button" aria-label="Enhance with AI" title="Enhance with AI" disabled={aiLoading.bio}>✨</button>}
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
        <label>Portfolio / Website URL</label>
        <div className="visibility-group">
          <input type="url" placeholder="https://..." value={portfolioData.portfolioLink?.value || ''} onChange={e => updatePortfolio('portfolioLink.value', e.target.value)} />
          <ToggleSwitch label="Show" checked={portfolioData.portfolioLink?.showOnPage !== false} onChange={() => updatePortfolio('portfolioLink.showOnPage', portfolioData.portfolioLink?.showOnPage === false)} />
        </div>
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

       <details className="controls-section" id="projects-section">
        <summary><h3>Projects</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.projects?.showOnPage !== false} onChange={() => updatePortfolio('projects.showOnPage', !portfolioData.projects?.showOnPage)} />
        <input type="text" placeholder="Project Title" value={newProject.title} onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))} />
        <input type="text" placeholder="Keywords (for AI)" value={newProject.keywords} onChange={e => setNewProject(prev => ({ ...prev, keywords: e.target.value }))} />
        <div className="ai-input-group">
          <textarea placeholder="Project description..." rows="4" value={newProject.description} onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}></textarea>
          {FEATURES.ai && <button onClick={() => handleAiEnhance('project')} className="ai-button" aria-label="Enhance with AI" title="Enhance with AI" disabled={aiLoading.project}>✨</button>}
        </div>
        <input type="url" placeholder="Project GitHub URL" value={newProject.githubUrl} onChange={e => setNewProject(prev => ({ ...prev, githubUrl: e.target.value }))} />
        <input type="url" placeholder="Project Live Demo URL" value={newProject.liveUrl} onChange={e => setNewProject(prev => ({ ...prev, liveUrl: e.target.value }))} />
        <button className="add-btn" onClick={() => handleAddItem('projects', newProject, setNewProject)}>{editing.field === 'projects' ? 'Save Changes' : 'Add Project'}</button>{editing.field === 'projects' && <button type="button" className="add-btn" onClick={cancelEdit}>Cancel</button>}
        <div className="item-list">
          {(portfolioData.projects?.items || []).map((proj, index) => (<div key={index} className="list-item"><span>{proj.title}</span><button type="button" className="edit-btn" onClick={() => handleEditItem('projects', index)}>Edit</button><button onClick={() => handleRemoveItem('projects', index)} className="remove-btn">X</button></div>))}
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
      
       <details className="controls-section" id="certifications-section">
        <summary><h3>Certifications</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.certifications?.showOnPage !== false} onChange={() => updatePortfolio('certifications.showOnPage', !portfolioData.certifications?.showOnPage)} />
        <input type="text" placeholder="Certification Name" value={newCertification.name} onChange={e => setNewCertification({ ...newCertification, name: e.target.value })} />
        <input type="text" placeholder="Issuing Organization" value={newCertification.issuer} onChange={e => setNewCertification({ ...newCertification, issuer: e.target.value })} />
        <button className="add-btn" onClick={() => handleAddItem('certifications', newCertification, setNewCertification)}>{editing.field === 'certifications' ? 'Save Changes' : 'Add Certification'}</button>{editing.field === 'certifications' && <button type="button" className="add-btn" onClick={cancelEdit}>Cancel</button>}
        <div className="item-list">
          {(portfolioData.certifications?.items || []).map((cert, index) => (<div key={index} className="list-item"><span>{cert.name}</span><button type="button" className="edit-btn" onClick={() => handleEditItem('certifications', index)}>Edit</button><button className="remove-btn" onClick={() => handleRemoveItem('certifications', index)}>X</button></div>))}
        </div>
      </details>

      <details className="controls-section" id="blogPosts-section">
        <summary><h3>Blog Posts</h3></summary>
        <ToggleSwitch label="Show on page" checked={portfolioData.blogPosts?.showOnPage || false} onChange={() => updatePortfolio('blogPosts.showOnPage', !portfolioData.blogPosts?.showOnPage)} />
        <ToggleSwitch label="Show on resume" checked={portfolioData.blogPosts?.showOnResume || false} onChange={() => updatePortfolio('blogPosts.showOnResume', !portfolioData.blogPosts?.showOnResume)} />
        <input type="text" placeholder="New Post Title" value={newBlogPost.title} onChange={e => setNewBlogPost({ ...newBlogPost, title: e.target.value })} />
        <textarea placeholder="Write your blog post content here..." rows="6" value={newBlogPost.content} onChange={e => setNewBlogPost({ ...newBlogPost, content: e.target.value })}></textarea>
        <button className="add-btn" onClick={() => handleAddItem('blogPosts', newBlogPost, setNewBlogPost)}>{editing.field === 'blogPosts' ? 'Save Changes' : 'Add Blog Post'}</button>{editing.field === 'blogPosts' && <button type="button" className="add-btn" onClick={cancelEdit}>Cancel</button>}
        <div className="item-list">
          {(portfolioData.blogPosts?.items || []).map((post, index) => (<div key={index} className="list-item"><span>{post.title}</span><button type="button" className="edit-btn" onClick={() => handleEditItem('blogPosts', index)}>Edit</button><button onClick={() => handleRemoveItem('blogPosts', index)} className="remove-btn">X</button></div>))}
        </div>
      </details>

      <details className="controls-section" id="customSections-section">
        <summary><h3>Custom Section</h3></summary>
        <label>Section Title</label>
        <input type="text" value={portfolioData.customSections?.title ?? 'Custom Section'} onChange={e => updatePortfolio('customSections.title', e.target.value)} />
        <ToggleSwitch label="Show on page" checked={portfolioData.customSections?.showOnPage || false} onChange={() => updatePortfolio('customSections.showOnPage', !portfolioData.customSections?.showOnPage)} />
        <ToggleSwitch label="Show on resume" checked={portfolioData.customSections?.showOnResume || false} onChange={() => updatePortfolio('customSections.showOnResume', !portfolioData.customSections?.showOnResume)} />
        <hr style={{ margin: '1rem 0' }} />
        <label>Add New Item</label>
        <input type="text" placeholder="Item Title" value={newCustomSection.title} onChange={e => setNewCustomSection({ ...newCustomSection, title: e.target.value })} />
        <textarea placeholder="Item Content..." rows="5" value={newCustomSection.content} onChange={e => setNewCustomSection({ ...newCustomSection, content: e.target.value })}></textarea>
        <button className="add-btn" onClick={() => handleAddItem('customSections', newCustomSection, setNewCustomSection)}>{editing.field === 'customSections' ? 'Save Changes' : 'Add Item'}</button>{editing.field === 'customSections' && <button type="button" className="add-btn" onClick={cancelEdit}>Cancel</button>}
        <div className="item-list">
          {(portfolioData.customSections?.items || []).map((section, index) => (<div key={index} className="list-item"><span>{section.title}</span><button type="button" className="edit-btn" onClick={() => handleEditItem('customSections', index)}>Edit</button><button onClick={() => handleRemoveItem('customSections', index)} className="remove-btn">X</button></div>))}
        </div>
      </details>

      <details className="controls-section">
        <summary><h3>Resume PDF layout</h3></summary>
        <p className="muted">Controls the PDF people download from your resume page. Saved with your portfolio; click Save &amp; Publish to apply.</p>
        <Suspense fallback={null}><ResumeLayoutControls value={portfolioData.resume} onChange={(v) => updatePortfolio('resume', v)} /></Suspense>
        <ToggleSwitch label="Live PDF preview" checked={showResumePreview} onChange={() => setShowResumePreview((v) => !v)} />
        {showResumePreview && <Suspense fallback={<p className="muted">Building preview…</p>}><ResumePdfPreview data={portfolioData} settings={portfolioData.resume} width={340} /></Suspense>}
      </details>

      <details className="controls-section">
        <summary><h3>Theme & Design</h3></summary>
        <label>Colour presets</label>
        <div className="palette-presets">
          {PORTFOLIO_PALETTES.map(p => (
            <button
              key={p.id}
              type="button"
              className="palette-chip"
              onClick={() => {
                updatePortfolio('theme.backgroundColor', p.backgroundColor);
                updatePortfolio('theme.textColor', p.textColor);
                updatePortfolio('theme.accentColor', p.accentColor);
              }}
            >
              <span className="palette-swatch" style={{ background: `linear-gradient(135deg, ${p.backgroundColor} 50%, ${p.accentColor} 50%)` }} />
              {p.name}
            </button>
          ))}
        </div>
        <ToggleSwitch label="Living 3D particle backdrop (morphs as visitors scroll)" checked={portfolioData.theme?.showBackdrop || false} onChange={() => updatePortfolio('theme.showBackdrop', !portfolioData.theme?.showBackdrop)} />
        <ToggleSwitch label="3D constellation on my public page" checked={portfolioData.theme?.showConstellation || false} onChange={() => updatePortfolio('theme.showConstellation', !portfolioData.theme?.showConstellation)} />
        <label>Font</label>
        <select value={portfolioData.theme?.font || 'Poppins'} onChange={e => updatePortfolio('theme.font', e.target.value)}>
          {Object.keys(PORTFOLIO_FONTS).map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
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
      <FeedbackAdmin />
    </aside>
  );
}

export default ControlPanel;