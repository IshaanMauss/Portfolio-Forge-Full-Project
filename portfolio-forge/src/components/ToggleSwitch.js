import React from 'react';
import './ToggleSwitch.css'; // We'll create this CSS file next

function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider round"></span>
      </label>
      <span>{label}</span>
    </div>
  );
}

export default ToggleSwitch;