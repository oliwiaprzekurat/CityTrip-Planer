import React, { useState } from 'react';
import { MapPin, CheckCircle, Trash2, Edit3, Save, X, Sparkles, Plus } from 'lucide-react';
import "../style/style.css";

const PlannerComponent = ({ cityName, attractions, attractionsList, savedPlans, onSave, onDelete, onEdit }) => {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSave(input);
      setInput('');
    }
  };

  const startEditing = (plan) => {
    setEditingId(plan.id);
    setEditValue(plan.attraction_name);
  };

  const handleSaveEdit = (id) => {
    if (editValue.trim()) {
      onEdit(id, editValue);
      setEditingId(null);
    }
  };

  return (
    <div className="planner-card p-8 bg-[#151921] rounded-[2rem] shadow-2xl border border-white/10 mt-6 md:col-span-2">
      {/* Nagłówek sekcji */}
      <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
        <MapPin className="text-blue-500" /> Planowanie: {cityName}
      </h3>

      {/* Opis miasta */}
      {attractions && attractions !== "Brak dostępnego opisu." && (
        <div className="bg-blue-600/5 p-5 rounded-2xl border border-blue-500/10 mb-8">
          <p className="text-gray-400 leading-relaxed text-sm">
            {attractions}
          </p>
        </div>
      )}

      {/* Sugestie atrakcji - używamy Twoich nowych klas CSS */}
      {attractionsList && attractionsList.length > 0 && (
        <div className="mb-10">
          <p className="text-gray-400 text-xs mb-4 font-bold uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-500" /> Polecane miejsca:
          </p>
          <div className="suggestions-container">
            {attractionsList.map((place, idx) => (
              <button
                key={idx}
                onClick={() => onSave(place)}
                className="suggestion-pill"
              >
                {place}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formularz dodawania */}
      <form onSubmit={handleFormSubmit} className="flex gap-3 mb-10">
        <input 
          className="search-input flex-1" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Dodaj własny punkt planu..."
        />
        <button type="submit" className="search-button">
          DODAJ
        </button>
      </form>

     <div className="planner-results-section">
  <h4 className="planner-list-title">Twoja lista punktów:</h4>
  
  {(!savedPlans || savedPlans.length === 0) ? (
    <div className="empty-plan-notice">
      <p>Lista jest pusta. Kliknij sugestię lub wpisz własne miejsce.</p>
    </div>
  ) : (
    <div className="planner-items-container">
      {savedPlans.map((plan) => (
        <div key={plan.id} className="planner-item-row">
          <div className="planner-item-content">
            <CheckCircle className="icon-check" size={18} />
            {editingId === plan.id ? (
              <input 
                autoFocus
                className="edit-inline-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(plan.id)}
                onBlur={() => handleSaveEdit(plan.id)}
              />
            ) : (
              <span className="planner-item-name">{plan.attraction_name}</span>
            )}
          </div>

          <div className="planner-item-actions">
            {editingId === plan.id ? (
              <button onClick={() => handleSaveEdit(plan.id)} className="action-btn save">
                <Save size={16} />
              </button>
            ) : (
              <>
                <button onClick={() => startEditing(plan)} className="action-btn edit" title="Edytuj">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => onDelete(plan.id)} className="action-btn delete" title="Usuń">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  );
};

export default PlannerComponent;