import { h } from "preact";
import { useState, useMemo, useEffect, useCallback } from "preact/hooks";
import { Button, InputArea, InputBox } from "../../site/Elements.js";

export const CalendarEventEdit = ({ id }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const handleChange = (key) => (evt) =>
    setForm({ ...form, [key]: evt.target.value });
  const handleSubmit = useCallback(() => {
    console.log(form);
  }, [form]);
  return (
    <div>
      <h3>Add your events to the calendar:</h3>
      <br />
      <InputBox
        name="title"
        onBlur={handleChange("title")}
        value={form.title}
        error={errors.title}
        className="w240"
      >
        Title of the event:{" "}
      </InputBox>
      <InputBox
        name="eventDate"
        onBlur={handleChange("eventDate")}
        value={form.eventDate}
        error={errors.eventDate}
        className="w240"
        placeholder="aug 20, 2022 18:30"
      >
        Event date &amp; time:{" "}
      </InputBox>
      <InputBox
        name="eventTimezone"
        onBlur={handleChange("eventTimezone")}
        value={form.eventTimezone}
        error={errors.eventTimezone}
        className="w240"
        placeholder="PST"
      >
        Timezone:{" "}
      </InputBox>
      <InputBox
        name="duration"
        onBlur={handleChange("duration")}
        value={form.duration}
        error={errors.duration}
        className="w240"
        placeholder="2 hours"
      >
        Duration (how long is the event?):{" "}
      </InputBox>
      <InputBox
        name="recurrence"
        onBlur={handleChange("recurrence")}
        value={form.recurrence}
        error={errors.recurrence}
        className="w240"
        placeholder="once / every monday"
      >
        How often does this event occur?:{" "}
      </InputBox>
      <div className="drac-p-sm">
        Event description:
        <InputArea
          name="description"
          onBlur={handleChange("description")}
          value={form.description}
          error={errors.description}
          placeholder="Weekly lewding event..."
        />
        <br />
      </div>
      <div className="drac-p-sm">
        Instructions on how to join:
        <InputArea
          name="joinInstructions"
          onBlur={handleChange("joinInstructions")}
          value={form.joinInstructions}
          error={errors.joinInstructions}
          placeholder="Add vrchatname as friend and join"
        />
        <br />
      </div>
      <InputBox
        name="creatorDiscord"
        onBlur={handleChange("creatorDiscord")}
        value={form.creatorDiscord}
        error={errors.creatorDiscord}
        className="w240"
        placeholder="username"
      >
        Your discord:{" "}
      </InputBox>
      <center>
        <Button onclick={handleSubmit}>Add event</Button>
      </center>
      <br />
      All events undergo review first; will show up in the calendar in 2-4
      hours.
      <br />
    </div>
  );
};
