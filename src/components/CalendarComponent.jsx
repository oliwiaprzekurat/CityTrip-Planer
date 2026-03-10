import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../components/style/calendar.css";

const localizer = momentLocalizer(moment);

const CalendarComponent = ({ events, onDayClick }) => {
  const handleSelectSlot = (slotInfo) => {

    onDayClick(slotInfo.start);
  };

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        selectable
        onSelectSlot={handleSelectSlot}
        startAccessor="start"
        endAccessor="end"
        messages={{
          next: "Następny",
          previous: "Poprzedni",
          today: "Dziś",
          month: "Miesiąc",
          week: "Tydzień",
          day: "Dzień",
          agenda: "Agenda",
          date: "Data",
          time: "Czas",
          event: "Zdarzenie",
          allDay: "Cały dzień",
        }}
      />
    </div>
  );
};

export default CalendarComponent;
