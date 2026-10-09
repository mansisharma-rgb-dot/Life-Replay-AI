from marshmallow import Schema, fields, validate, EXCLUDE

class ActivitiesSchema(Schema):
    study_hours = fields.Float(validate=validate.Range(min=0, max=24), load_default=0.0)
    work_hours = fields.Float(validate=validate.Range(min=0, max=24), load_default=0.0)
    exercise_minutes = fields.Integer(validate=validate.Range(min=0, max=1440), load_default=0)
    reading_minutes = fields.Integer(validate=validate.Range(min=0, max=1440), load_default=0)
    meditation_minutes = fields.Integer(validate=validate.Range(min=0, max=1440), load_default=0)
    sleep_hours = fields.Float(validate=validate.Range(min=0, max=24), load_default=0.0)
    water_intake_ml = fields.Integer(validate=validate.Range(min=0), load_default=0)
    screen_time_minutes = fields.Integer(validate=validate.Range(min=0, max=1440), load_default=0)
    leisure_hours = fields.Float(validate=validate.Range(min=0, max=24), load_default=0.0)
    walking_steps = fields.Integer(validate=validate.Range(min=0), load_default=0)
    calories_burned = fields.Integer(validate=validate.Range(min=0), load_default=0)

class MoodSchema(Schema):
    mood_score = fields.Integer(validate=validate.Range(min=1, max=10), load_default=5)
    intensity = fields.Integer(validate=validate.Range(min=1, max=5), load_default=3)
    mood_label = fields.String(load_default='😐')
    note = fields.String(load_default='')

class WellbeingSchema(Schema):
    energy_level = fields.Integer(validate=validate.Range(min=1, max=5), load_default=3)
    stress_level = fields.Integer(validate=validate.Range(min=1, max=5), load_default=3)
    focus_level = fields.Integer(validate=validate.Range(min=1, max=5), load_default=3)
    motivation_level = fields.Integer(validate=validate.Range(min=1, max=5), load_default=3)

class JournalSchema(Schema):
    title = fields.String(load_default='')
    content = fields.String(load_default='')

class DailyCheckinSchema(Schema):
    date = fields.Date(load_default=None)
    activities = fields.Nested(ActivitiesSchema, load_default={})
    mood = fields.Nested(MoodSchema, load_default={})
    wellbeing = fields.Nested(WellbeingSchema, load_default={})
    journal = fields.Nested(JournalSchema, load_default={})
    daily_rating = fields.Integer(load_default=0)
    is_completed = fields.Boolean(required=True)

    class Meta:
        unknown = EXCLUDE
