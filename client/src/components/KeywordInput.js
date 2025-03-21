import React, { useState, useEffect } from 'react';

const KeywordInput = ({ initialKeywords = [], onChange }) => {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [inputValue, setInputValue] = useState('');
  
  // Set keywords on initial render and when initialKeywords change
  // Using a ref to avoid dependency on keywords which would cause infinite loop
  const prevInitialKeywordsRef = React.useRef(JSON.stringify([]));
  
  useEffect(() => {
    const currentInitialKeywordsJson = JSON.stringify(initialKeywords || []);
    if (prevInitialKeywordsRef.current !== currentInitialKeywordsJson) {
      setKeywords(initialKeywords || []);
      prevInitialKeywordsRef.current = currentInitialKeywordsJson;
    }
  }, [initialKeywords]);
  
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  const handleInputKeyDown = (e) => {
    // Add keyword on Enter, Tab, or comma
    if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      
      // Extract the keyword (remove comma if present)
      const newKeyword = inputValue.trim().replace(/,+$/, '').toLowerCase();
      
      if (newKeyword && !keywords.includes(newKeyword)) {
        const updatedKeywords = [...keywords, newKeyword];
        setKeywords(updatedKeywords);
        onChange(updatedKeywords);
        setInputValue('');
      }
    }
    
    // Remove last tag on Backspace if input is empty
    if (e.key === 'Backspace' && !inputValue && keywords.length > 0) {
      const updatedKeywords = keywords.slice(0, -1);
      setKeywords(updatedKeywords);
      onChange(updatedKeywords);
    }
  };
  
  const removeKeyword = (index) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index);
    setKeywords(updatedKeywords);
    onChange(updatedKeywords);
  };
  
  // Handle pasting multiple keywords separated by commas or spaces
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const pastedKeywords = pasteText
      .split(/[,\s]+/) // Split by comma or whitespace
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword && !keywords.includes(keyword));
      
    if (pastedKeywords.length) {
      const updatedKeywords = [...keywords, ...pastedKeywords];
      setKeywords(updatedKeywords);
      onChange(updatedKeywords);
    }
  };
  
  return (
    <div className="keyword-input-container">
      <div className="keyword-tags mb-2">
        {keywords.map((keyword, index) => (
          <span key={index} className="badge bg-primary me-2 mb-2 keyword-tag">
            {keyword}
            <button 
              type="button"
              className="btn-close ms-2 btn-close-white"
              style={{ fontSize: '0.5rem' }}
              onClick={() => removeKeyword(index)}
              aria-label="Remove keyword"
            ></button>
          </span>
        ))}
      </div>
      
      <input
        type="text"
        className="form-control"
        placeholder="Add keywords (press Enter or comma to add)"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onPaste={handlePaste}
      />
      
      <small className="form-text text-muted">
        Keywords help generate better video descriptions. Enter words related to the client's business.
      </small>
    </div>
  );
};

export default KeywordInput;
