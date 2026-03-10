import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import "./style/modalStyle.css";

Modal.setAppElement("#root");

const formatDateTimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const EventModal = ({ isOpen, onClose, onSave, onDelete, eventData }) => {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(eventData?.title || "");
      setStart(eventData?.start ? formatDateTimeLocal(eventData.start) : "");
      setEnd(eventData?.end ? formatDateTimeLocal(eventData.end) : "");
    }
  }, [isOpen, eventData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, start: new Date(start), end: new Date(end) });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Modal Wydarzenia"
      className="custom-modal"
      overlayClassName="custom-modal-overlay"
    >
      <h2>{eventData ? "Edytuj Wydarzenie" : "Dodaj Wydarzenie"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Tytuł: </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Data i godzina rozpoczęcia: </label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <button className="btn_primary" type="submit">Zapisz</button>
          {eventData && (
            <button
              className="btn_primary"
              type="button"
              onClick={() => {
                onDelete(eventData);
                onClose();
              }}
              style={{ marginLeft: "10px" }}
            >
              Usuń
            </button>
          )}
          <button className="btn_primary" type="button" onClick={onClose} style={{ marginLeft: "10px" }}>
            Anuluj
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EventModal;
