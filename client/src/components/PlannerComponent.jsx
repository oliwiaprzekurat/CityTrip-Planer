import React, { useState } from 'react';
import { MapPin, CheckCircle, Trash2, Edit3, Save, X } from 'lucide-react';
import './style/style.css';

// Dodajemy onEdit do propsów
const PlannerComponent = ({ cityName, attractions, attractionsList, savedPlans, onSave, onDelete, onEdit }) => {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null); // ID elementu, który edytujemy
  const [editValue, setEditValue] = useState(''); // Nowa nazwa dla edytowanego elementu

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      if (typeof onSave === 'function') {
        onSave(input);
        setInput('');
      } else {
        console.error("Błąd: Funkcja onSave nie została przekazana!");
      }
    }
  };

  const startEditing = (plan) => {
    setEditingId(plan.id);
    setEditValue(plan.attraction_name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = (id) => {
    if (editValue.trim() && typeof onEdit === 'function') {
      onEdit(id, editValue);
      setEditingId(null);
    }
  };

  return (
    <div className="p-8 bg-[#1e293b] rounded-[2rem] shadow-2xl border border-white/10 mt-6 md:col-span-2">
      <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
        <MapPin className="text-blue-500" /> Planowanie podróży: {cityName}
      </h3>

      {attractions && (
        <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/20 mb-8">
          <p className="text-gray-300 leading-relaxed text-sm italic">
            {attractions}
          </p>
        </div>
      )}

      {/* PRZYCISKI SUGESTII */}
      <div className="mb-10">
        <p className="text-gray-400 text-xs mb-3 font-bold uppercase tracking-wider">Sugestie z Wikipedii:</p>
        <div className="flex flex-wrap gap-2">
          {attractionsList?.map((place, idx) => (
            <button
              key={idx}
              onClick={() => onSave(place)}
              className="px-4 py-2 bg-slate-800 text-blue-300 rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-xs font-bold"
            >
              + {place}
            </button>
          ))}
        </div>
      </div>

      {/* FORMULARZ DODAWANIA */}
      <form onSubmit={handleFormSubmit} className="flex gap-3 mb-8">
        <input 
          className="flex-1 bg-slate-900 border border-white/10 p-4 rounded-2xl text-white focus:border-blue-500 outline-none transition-all" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Dodaj własny punkt zwiedzania..."
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-2xl font-black transition-all shadow-lg shadow-blue-900/20">
          DODAJ
        </button>
      </form>

      {/* LISTA ZAPISANA W BAZIE DANYCH */}
      <div className="grid gap-3">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Twoja lista dla: {cityName}</p>
        {savedPlans?.length === 0 && <p className="text-gray-500 text-sm italic">Brak zapisanych punktów dla tego miasta.</p>}
        
        {savedPlans?.map((plan) => (
          <div 
            key={plan.id} 
            className="flex items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-800 border-white/10 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center gap-4 flex-1">
              <CheckCircle className={editingId === plan.id ? "text-blue-400" : "text-blue-500"} />
              
              {editingId === plan.id ? (
                <input 
                  autoFocus
                  className="flex-1 bg-slate-900 border border-blue-500 p-2 rounded-xl text-white outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(plan.id)}
                />
              ) : (
                <span className="font-bold text-gray-200">{plan.attraction_name}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editingId === plan.id ? (
                <>
                  <button onClick={() => handleSaveEdit(plan.id)} className="text-green-500 hover:text-green-400 p-2">
                    <Save size={18} />
                  </button>
                  <button onClick={cancelEditing} className="text-gray-400 hover:text-white p-2">
                    <X size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEditing(plan)} className="text-slate-400 hover:text-blue-400 transition-colors p-2">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => onDelete(plan.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerComponent;