import React, { useState } from "react";
import CalendarComponent from "../../components/CalendarComponent";
import EventModal from "../../components/ModalComponent";
import WeatherComponent from "../../components/WeatherComponent";
import "../style/style.css";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEventData, setModalEventData] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState("month");

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleDayClick = (date) => {
    setModalEventData({ start: date, end: date, title: "" });
    setModalOpen(true);
  };

  const handleSaveEvent = (eventData) => {
    setEvents([...events, eventData]);
  };

  const handleDeleteEvent = (eventData) => {
    setEvents(events.filter((ev) => ev !== eventData));
  };

  return (
    <div className="container flex flex-col md:flex-row gap-4 p-4">
      
      <div className="weather">
        <WeatherComponent location="Wroclaw" />
      </div>

      <div className="calendar flex-1">
        <CalendarComponent
        events={events}
        onDayClick={handleDayClick}
        view={currentView} 
        onViewChange={(view) => setCurrentView(view)}
        />
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        eventData={modalEventData}
      />
    </div>
  );
};

export default Home;
